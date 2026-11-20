const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  sensorId: { type: String, required: true, unique: true },
  slotId: { type: String, ref: 'ParkingSlot' },
  deviceType: { type: String, default: 'NodeMCU/ESP8266' },
  status: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE'],
    default: 'OFFLINE'
  },
  lastSeen: { type: Date, default: Date.now },
  lastSource: { type: String, enum: ['PHYSICAL SENSOR', 'SIMULATOR'] },
  ipAddress: { type: String },
  firmwareVersion: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Sensor', sensorSchema);
