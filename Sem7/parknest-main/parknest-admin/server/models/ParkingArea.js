const mongoose = require('mongoose');

const parkingAreaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 },
  totalSlots: { type: Number, default: 0 },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ParkingArea', parkingAreaSchema);
