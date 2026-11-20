const User = require('../models/User');
const { normalizePhone, normalizeVehicles } = require('../services/userProfile');

const serializeUser = (user) => ({
  id: user._id.toString(),
  phone: user.phone,
  name: user.name,
  vehicles: user.vehicles.map((vehicle) => ({
    id: vehicle.id,
    plate: vehicle.plate,
    type: vehicle.type,
    model: vehicle.model,
    color: vehicle.color,
    isDefault: vehicle.isDefault
  }))
});

exports.login = async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Enter a valid 10-digit phone number.' });
  }

  try {
    let user = await User.findOne({ phone });
    if (!user) {
      try {
        user = await User.create({ phone, name: '', vehicles: [] });
      } catch (error) {
        if (error.code !== 11000) throw error;
        user = await User.findOne({ phone });
      }
    }

    if (!user) {
      return res.status(500).json({ message: 'Could not load the user profile.' });
    }

    return res.json({
      user: serializeUser(user),
      needsName: !user.name?.trim()
    });
  } catch (error) {
    console.error('Error loading user profile:', error);
    return res.status(500).json({ message: 'Could not load the user profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const name = String(req.body?.name ?? '').trim();
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Enter a valid 10-digit phone number.' });
  }
  if (!name || name.length > 80) {
    return res.status(400).json({ message: 'Name must be between 1 and 80 characters.' });
  }

  let vehicles;
  try {
    vehicles = normalizeVehicles(req.body?.vehicles);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const user = await User.findOneAndUpdate(
      { phone },
      { $set: { name, vehicles } },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User profile not found. Sign in again.' });
    }

    return res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Could not save the user profile.' });
  }
};
