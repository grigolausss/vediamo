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
// Removing 'admin' middleware as the role concept is being removed
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');

// Public routes
router.post('/login', loginEmployee);
router.post('/login/verify-otp', verifyEmployeeOtp);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

// --- Protected Employee Routes ---

// All employees can now perform these actions
router.route('/')
    .post(protectEmployee, createEmployee)
    .get(protectEmployee, getEmployees);

router.route('/profile/password')
    .put(protectEmployee, updateMyPassword);

router.route('/:id')
    .get(protectEmployee, getEmployeeById)
    .put(protectEmployee, updateEmployee)
    .delete(protectEmployee, deleteEmployee);


module.exports = router;
