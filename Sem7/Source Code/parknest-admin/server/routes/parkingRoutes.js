const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Slots
router.get('/slots', parkingController.getAllSlots);
router.get('/slots/:slotId', parkingController.getSlotById);
router.post('/slots', parkingController.createSlot);
router.put('/slots/:slotId', parkingController.updateSlot);
router.delete('/slots/:slotId', parkingController.deleteSlot);

// Areas
router.get('/areas', parkingController.getAllAreas);
router.post('/areas', parkingController.createArea);
router.put('/areas/:id', parkingController.updateArea);

module.exports = router;
