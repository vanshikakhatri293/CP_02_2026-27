const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

router.get('/', reservationController.getAllReservations);
router.post('/', reservationController.createReservation);
router.post('/:id/cancel', reservationController.cancelReservation);
router.put('/:id/cancel', reservationController.cancelReservation);

module.exports = router;
