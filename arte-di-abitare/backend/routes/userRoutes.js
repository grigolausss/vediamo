const express = require('express');
const router = express.Router();

const { requestOtp, verifyOtp, updateUserPhone } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @desc    Request an OTP for a user
// @route   POST /api/users/request-otp
// @access  Public
router.post('/request-otp', requestOtp);

// @desc    Verify an OTP for a user
// @route   POST /api/users/verify-otp
// @access  Public
router.post('/verify-otp', verifyOtp);

// @desc    Update user's phone number
// @route   POST /api/users/update-phone
// @access  Private
router.post('/update-phone', protect, updateUserPhone);


module.exports = router;
