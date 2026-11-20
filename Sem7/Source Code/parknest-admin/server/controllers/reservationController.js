const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');
const { getSensorState, resolveSlotStatus } = require('../services/slotState');
const { formatPhone, normalizePhone } = require('../services/userProfile');

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { slotId, userPhone, vehicleNumber, durationHours = 2 } = req.body;

    const duration = Number(durationHours);
    const phone = normalizePhone(userPhone);
    const plate = String(vehicleNumber ?? '').trim().toUpperCase();
    if (!slotId || !/^\d{10}$/.test(phone) || !plate || !Number.isFinite(duration) || duration <= 0 || duration > 24) {
      return res.status(400).json({ message: 'A valid phone number, registered number plate, slot, and duration are required.' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Sign in and register your profile before booking.' });
    }
    const registeredVehicle = user.vehicles.find((vehicle) => vehicle.plate === plate);
    if (!registeredVehicle) {
      return res.status(400).json({ message: 'Select a vehicle registered to your account.' });
    }

    const slot = await ParkingSlot.findOne({ slotId });
    if (!slot) {
      return res.status(404).json({ message: `Slot ${slotId} not found` });
    }

    if (['OFFLINE', 'MAINTENANCE'].includes(slot.status)) {
      return res.status(409).json({ message: `Slot ${slotId} is ${slot.status.toLowerCase()} and cannot be booked` });
    }

    const existingRes = await Reservation.findOne({
      slotId,
      status: { $in: ['ACTIVE', 'PENDING'] },
      endTime: { $gt: new Date() }
    });

    if (existingRes) {
      return res.status(400).json({
        message: `Slot ${slotId} is already reserved by ${existingRes.vehicleNumber}`
      });
    }

    const isPhysicallyOccupied = Boolean(slot.sensorId) &&
      Number.isFinite(Number(slot.distance)) &&
      Number(slot.distance) < Number(slot.threshold || 10);
    if (slot.status === 'OCCUPIED' || isPhysicallyOccupied) {
      return res.status(409).json({ message: `Slot ${slotId} is currently occupied` });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    const reservationId = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

    const reservation = new Reservation({
      reservationId,
      slotId,
      userId: user._id.toString(),
      userName: user.name,
      userPhone: formatPhone(user.phone),
      vehicleNumber: registeredVehicle.plate,
      vehicleType: registeredVehicle.type,
      startTime,
      endTime,
      status: 'ACTIVE'
    });

    await reservation.save();

    slot.status = 'RESERVED';
    slot.lastUpdated = new Date();
    await slot.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('reservationCreated', reservation);
      io.emit('slotUpdated', slot);
      io.emit('parkingUpdated', { slot, reservation });
    }

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
      slot
    });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findOne(mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { reservationId: id }] }
      : { reservationId: id }
    );

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = 'CANCELLED';
    await reservation.save();

    const slot = await ParkingSlot.findOne({ slotId: reservation.slotId });
    if (slot) {
      if (!['MAINTENANCE', 'OFFLINE'].includes(slot.status)) {
        const now = new Date();
        const anotherReservation = await Reservation.findOne({
          slotId: slot.slotId,
          status: { $in: ['ACTIVE', 'PENDING'] },
          endTime: { $gt: now }
        });
        const sensorState = slot.sensorId ? getSensorState(slot) : 'EMPTY';
        slot.status = resolveSlotStatus(slot.status, sensorState, Boolean(anotherReservation));
        slot.lastUpdated = now;
        await slot.save();
      }

      const io = req.app.get('socketio');
      if (io) {
        io.emit('reservationCancelled', reservation);
        io.emit('slotUpdated', slot);
        io.emit('parkingUpdated', { slot, reservation });
      }
    }

    res.json({ message: 'Reservation cancelled successfully', reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
