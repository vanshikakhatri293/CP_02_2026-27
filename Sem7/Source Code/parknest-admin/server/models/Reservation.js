const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, required: true, unique: true },
  slotId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Driver' },
  userPhone: { type: String },
  vehicleNumber: { type: String, required: true },
  vehicleType: { type: String, default: 'Sedan' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
