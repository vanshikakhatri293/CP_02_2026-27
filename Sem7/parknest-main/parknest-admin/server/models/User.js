const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  plate: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, required: true, enum: ['Sedan', 'SUV', 'Hatchback', 'EV', 'Bike'] },
  model: { type: String, default: '' },
  color: { type: String, default: '' },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{10}$/
  },
  name: { type: String, default: '', trim: true, maxlength: 80 },
  vehicles: { type: [vehicleSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
