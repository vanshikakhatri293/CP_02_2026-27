const Sensor = require('../models/Sensor');
const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');
const { getSensorState, resolveSlotStatus } = require('./slotState');

// Configurable offline threshold: default 30 seconds (30000 ms)
const OFFLINE_THRESHOLD_MS = parseInt(process.env.SENSOR_OFFLINE_THRESHOLD_MS, 10) || 30000;

const checkSensors = async (io) => {
  try {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - OFFLINE_THRESHOLD_MS);

    // Find sensors that haven't sent readings recently and are marked ONLINE
    const sensorsToMarkOffline = await Sensor.find({
      status: 'ONLINE',
      lastSeen: { $lt: thresholdDate }
    });

    for (const sensor of sensorsToMarkOffline) {
      sensor.status = 'OFFLINE';
      await sensor.save();

      // Mark the corresponding slot as OFFLINE if it's not under MAINTENANCE
      const slot = await ParkingSlot.findOne({ slotId: sensor.slotId });
      if (slot && slot.status !== 'MAINTENANCE') {
        slot.status = 'OFFLINE';
        slot.lastUpdated = new Date();
        await slot.save();

        if (io) io.emit('slotUpdated', slot);
      }

      if (io) {
        io.emit('sensorUpdated', sensor);
        io.emit('parkingUpdated', { sensor, slot });
      }
    }

    const expiredReservations = await Reservation.find({
      status: { $in: ['ACTIVE', 'PENDING'] },
      endTime: { $lte: now }
    });

    for (const reservation of expiredReservations) {
      reservation.status = 'EXPIRED';
      await reservation.save();

      const slot = await ParkingSlot.findOne({ slotId: reservation.slotId });
      if (!slot || ['MAINTENANCE', 'OFFLINE'].includes(slot.status)) {
        if (io) io.emit('reservationExpired', reservation);
        continue;
      }

      const anotherReservation = await Reservation.findOne({
        slotId: slot.slotId,
        status: { $in: ['ACTIVE', 'PENDING'] },
        endTime: { $gt: now }
      });
      const sensor = slot.sensorId ? await Sensor.findOne({ sensorId: slot.sensorId }) : null;
      const sensorIsOnline = !slot.sensorId || sensor?.status === 'ONLINE';
      const sensorState = !slot.sensorId
        ? 'EMPTY'
        : sensorIsOnline
          ? getSensorState(slot)
          : 'UNKNOWN';
      slot.status = resolveSlotStatus(
        sensorIsOnline ? slot.status : 'OFFLINE',
        sensorState,
        Boolean(anotherReservation)
      );
      slot.lastUpdated = now;
      await slot.save();

      if (io) {
        io.emit('reservationExpired', reservation);
        io.emit('slotUpdated', slot);
        io.emit('parkingUpdated', { slot, reservation });
      }
    }

    if (sensorsToMarkOffline.length > 0) {
      console.log(`[SensorMonitor] Marked ${sensorsToMarkOffline.length} sensor(s) as OFFLINE.`);
    }
  } catch (err) {
    console.error('[SensorMonitor] Error checking sensor connectivity:', err);
  }
};

module.exports = {
  start: (io) => {
    console.log(`[SensorMonitor] Service started (Offline Timeout: ${OFFLINE_THRESHOLD_MS / 1000}s)...`);
    // Run connectivity monitor check every 10 seconds
    setInterval(() => checkSensors(io), 10000);
  }
};

