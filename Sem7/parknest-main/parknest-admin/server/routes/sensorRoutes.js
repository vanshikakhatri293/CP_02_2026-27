const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/health', sensorController.getSystemHealth);
router.get('/', sensorController.getAllSensors);
router.get('/:sensorId', sensorController.getSensorById);
router.post('/update', sensorController.updateSensorData);

module.exports = router;
