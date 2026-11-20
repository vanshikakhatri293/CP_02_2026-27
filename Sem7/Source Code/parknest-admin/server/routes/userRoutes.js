const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login', userController.login);
router.put('/profile', userController.updateProfile);

module.exports = router;
