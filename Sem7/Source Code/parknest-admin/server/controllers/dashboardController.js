const ParkingSlot = require('../models/ParkingSlot');
const Sensor = require('../models/Sensor');

exports.getStats = async (req, res) => {
  try {
    const totalSlots = await ParkingSlot.countDocuments();
    const available = await ParkingSlot.countDocuments({ status: 'AVAILABLE' });
    const occupied = await ParkingSlot.countDocuments({ status: 'OCCUPIED' });
    const reserved = await ParkingSlot.countDocuments({ status: 'RESERVED' });
    const offline = await ParkingSlot.countDocuments({ status: 'OFFLINE' });
    const maintenance = await ParkingSlot.countDocuments({ status: 'MAINTENANCE' });

    const onlineSensors = await Sensor.countDocuments({ status: 'ONLINE' });
    const totalSensors = await Sensor.countDocuments();

    res.json({
      totalSlots,
      available,
      occupied,
      reserved,
      offline,
      maintenance,
      onlineSensors,
      totalSensors
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
