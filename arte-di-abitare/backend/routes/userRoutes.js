const express = require('express');
const router = express.Router();

const { requestOtp, verifyOtp } = require('../controllers/userController');

// @desc    Request an OTP for a user
// @route   POST /api/users/request-otp
// @access  Public
router.post('/request-otp', requestOtp);

// @desc    Verify an OTP for a user
// @route   POST /api/users/verify-otp
// @access  Public
router.post('/verify-otp', verifyOtp);

module.exports = router;
