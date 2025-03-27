const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');

// Register a new user
router.post('/register', authController.register);

// Login existing user
router.post('/login', authController.login);

// Google login
router.post('/google', authController.googleLogin);

// Verify token route (protected)
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;