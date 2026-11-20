const mongoose = require('mongoose');
const Sensor = require('../models/Sensor');
const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');
const { resolveSlotStatus } = require('../services/slotState');

exports.getAllSensors = async (req, res) => {
  try {
    const sensors = await Sensor.find().sort({ sensorId: 1 });
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSensorById = async (req, res) => {
  try {
    const sensor = await Sensor.findOne({ sensorId: req.params.sensorId });
    if (!sensor) return res.status(404).json({ message: 'Sensor not found' });
    res.json(sensor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbConnected = dbState === 1;
    const offlineThresholdMs = parseInt(process.env.SENSOR_OFFLINE_THRESHOLD_MS, 10) || 30000;

    res.json({
      status: dbConnected ? 'HEALTHY' : 'DEGRADED',
      dbConnected,
      dbState: dbConnected ? 'connected' : 'disconnected',
      offlineThresholdMs,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
};

exports.updateSensorData = async (req, res) => {
  const { sensorId, slotId, distance, occupied, state, ipAddress, firmwareVersion, isSimulator: reqIsSim } = req.body;

  if (!sensorId || !slotId) {
    return res.status(400).json({ message: 'sensorId and slotId are required' });
  }

  // Validate numeric distance if provided
  const numDistance = typeof distance === 'number' ? distance : parseFloat(distance);
  const isDistanceValid = !isNaN(numDistance) && numDistance >= 0 && numDistance <= 400;

  if (distance !== undefined && !isDistanceValid) {
    console.warn(`[Sensor API] Received invalid distance reading (${distance}) from sensor ${sensorId}. Ignoring state change.`);
    return res.status(400).json({ message: 'Invalid sensor distance reading provided' });
  }
  if (occupied !== undefined && typeof occupied !== 'boolean' &&
      !(typeof occupied === 'string' && ['true', 'false'].includes(occupied.toLowerCase()))) {
    return res.status(400).json({ message: 'occupied must be a boolean value' });
  }

  // Determine if source is a physical hardware device or simulator
  const clientIp = ipAddress || req.ip || req.socket.remoteAddress || '';
  const isLocalIp = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost' || clientIp === '::ffff:127.0.0.1';
  const isSimulator = Boolean(reqIsSim || req.headers['x-simulator'] === 'true' || (isLocalIp && req.headers['user-agent']?.includes('axios')));
  const isPhysicalSensor = !isSimulator;

  try {
    const now = new Date();

    // 1. Find or create sensor record
    let sensor = await Sensor.findOne({ sensorId: String(sensorId).trim() });
    if (!sensor) {
      sensor = new Sensor({
        sensorId: String(sensorId).trim(),
        slotId: String(slotId).trim(),
        ipAddress: clientIp,
        firmwareVersion: firmwareVersion || '1.0.3',
        status: 'ONLINE',
        lastSeen: now,
        lastSource: isPhysicalSensor ? 'PHYSICAL SENSOR' : 'SIMULATOR'
      });
    } else {
      sensor.slotId = String(slotId).trim();
      if (ipAddress) sensor.ipAddress = ipAddress;
      if (firmwareVersion) sensor.firmwareVersion = firmwareVersion;
      sensor.lastSeen = now;
      sensor.status = 'ONLINE';
      sensor.lastSource = isPhysicalSensor ? 'PHYSICAL SENSOR' : 'SIMULATOR';
    }
    await sensor.save();

    // 2. Find corresponding parking slot
    const slot = await ParkingSlot.findOne({ slotId: String(slotId).trim() });
    if (!slot) {
      return res.status(404).json({ message: `Parking slot '${slotId}' not found` });
    }

    // Determine physical occupancy state
    let isVehiclePresent = null;

    if (typeof occupied === 'boolean') {
      isVehiclePresent = occupied;
    } else if (typeof occupied === 'string') {
      isVehiclePresent = occupied.toLowerCase() === 'true';
    } else if (isDistanceValid) {
      isVehiclePresent = numDistance < (slot.threshold || 10);
    }

    if (isDistanceValid) {
      slot.distance = numDistance;
    }

    // 3. Keep reservation and physical sensor state independent.
    if (slot.status !== 'MAINTENANCE') {
      const activeReservation = await Reservation.findOne({
        slotId: slot.slotId,
        status: { $in: ['ACTIVE', 'PENDING'] },
        endTime: { $gt: now }
      });
      const currentStatus = slot.status === 'OFFLINE' ? 'AVAILABLE' : slot.status;
      const sensorState = isVehiclePresent === true ? 'OCCUPIED' : isVehiclePresent === false ? 'EMPTY' : 'UNKNOWN';
      slot.status = resolveSlotStatus(currentStatus, sensorState, Boolean(activeReservation));
      if (!activeReservation && sensorState === 'UNKNOWN' && state &&
          ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OFFLINE', 'MAINTENANCE'].includes(state)) {
        slot.status = state;
      }
    }

    slot.sensorId = String(sensorId).trim();
    slot.lastUpdated = now;
    await slot.save();

    // 4. Emit real-time Socket.IO telemetry events for frontend monitor & dashboard
    const io = req.app.get('socketio');
    if (io) {
      const telemetryPayload = {
        sensor,
        slot,
        source: isPhysicalSensor ? 'PHYSICAL SENSOR' : 'SIMULATOR',
        isPhysicalSensor,
        isSimulator,
        receivedAt: now,
        dbUpdatedAt: now,
        stages: {
          payloadReceived: true,
          payloadValidated: true,
          dbUpdated: true
        },
        rawPayload: {
          sensorId: String(sensorId).trim(),
          slotId: String(slotId).trim(),
          distance: isDistanceValid ? numDistance : distance,
          occupied: isVehiclePresent,
          state,
          ipAddress: clientIp,
          firmwareVersion: firmwareVersion || '1.0.3'
        }
      };

      io.emit('sensorTelemetry', telemetryPayload);
      io.emit('sensorUpdated', sensor);
      io.emit('slotUpdated', slot);
      io.emit('parkingUpdated', { sensor, slot });
    }

    res.json({
      message: 'Sensor data updated successfully',
      sensor,
      slot
    });
  } catch (err) {
    console.error('[Sensor API] Error updating sensor data:', err);
    res.status(500).json({ message: err.message });
  }
};
