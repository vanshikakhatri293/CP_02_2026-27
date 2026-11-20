const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true },
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingArea', required: true },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OFFLINE', 'MAINTENANCE'],
    default: 'AVAILABLE'
  },
  sensorId: { type: String, ref: 'Sensor' },
  distance: { type: Number, default: 0 },
  threshold: { type: Number, default: 10 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
