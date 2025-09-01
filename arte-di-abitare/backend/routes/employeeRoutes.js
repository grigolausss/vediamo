const express = require('express');
const router = express.Router();
const {
    loginEmployee,
    verifyEmployeeOtp,
    forgotPassword,
    resetPassword,
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    updateMyPassword
} = require('../controllers/employeeController');
const { protectEmployee, admin } = require('../middleware/employeeAuthMiddleware');

// @desc    Auth employee (step 1: password check) & send OTP
// @route   POST /api/employees/login
// @access  Public
router.post('/login', loginEmployee);

// @desc    Verify employee OTP (step 2) & get token
// @route   POST /api/employees/login/verify-otp
// @access  Public
router.post('/login/verify-otp', verifyEmployeeOtp);

// @desc    Forgot password
// @route   POST /api/employees/forgot-password
// @access  Public
router.post('/forgot-password', forgotPassword);

// @desc    Reset password
// @route   PUT /api/employees/reset-password/:resettoken
// @access  Public
router.put('/reset-password/:resettoken', resetPassword);


// --- Admin Routes ---
router.route('/')
    .post(protectEmployee, admin, createEmployee)
    .get(protectEmployee, admin, getEmployees);

router.route('/profile/password')
    .put(protectEmployee, updateMyPassword);

router.route('/:id')
    .get(protectEmployee, admin, getEmployeeById)
    .put(protectEmployee, admin, updateEmployee)
    .delete(protectEmployee, admin, deleteEmployee);


module.exports = router;
