const express = require('express');
const {
    loginUser,
    registerUser
} = require('../controllers/login-controller');

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', loginUser);

// Admin routes (admin authentication required)
router.post('/register', registerUser);

module.exports = router;
