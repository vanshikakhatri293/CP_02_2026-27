const ParkingSlot = require('../models/ParkingSlot');
const ParkingArea = require('../models/ParkingArea');

exports.getAllSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find().populate('areaId');
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSlotById = async (req, res) => {
  try {
    const slot = await ParkingSlot.findOne({ slotId: req.params.slotId }).populate('areaId');
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const newSlot = new ParkingSlot(req.body);
    const savedSlot = await newSlot.save();
    res.status(201).json(savedSlot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const updatedSlot = await ParkingSlot.findOneAndUpdate(
      { slotId: req.params.slotId },
      req.body,
      { new: true }
    );
    if (!updatedSlot) return res.status(404).json({ message: 'Slot not found' });

    const io = req.app.get('socketio');
    io.emit('slotUpdated', updatedSlot);

    res.json(updatedSlot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const deletedSlot = await ParkingSlot.findOneAndDelete({ slotId: req.params.slotId });
    if (!deletedSlot) return res.status(404).json({ message: 'Slot not found' });
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAreas = async (req, res) => {
  try {
    const areas = await ParkingArea.find();
    res.json(areas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createArea = async (req, res) => {
  try {
    const newArea = new ParkingArea(req.body);
    const savedArea = await newArea.save();
    res.status(201).json(savedArea);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const updatedArea = await ParkingArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedArea) return res.status(404).json({ message: 'Area not found' });
    res.json(updatedArea);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
