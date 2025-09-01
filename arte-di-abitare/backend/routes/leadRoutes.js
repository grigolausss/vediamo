const express = require('express');
const router = express.Router();
const {
    submitQuestionnaire1,
    submitQuestionnaire2,
    handleFinalStep,
    getLeads,
    getLeadById,
    updateLeadStatus
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');

// === Public User Routes ===
// These are protected by the general 'protect' middleware for public users

// @desc    Submit the first questionnaire
// @route   POST /api/leads/questionnaire1
// @access  Private
router.post('/questionnaire1', protect, submitQuestionnaire1);

// @desc    Submit the second questionnaire
// @route   POST /api/leads/questionnaire2
// @access  Private
router.post('/questionnaire2', protect, submitQuestionnaire2);

// @desc    Handle final user choice (address or alternatives)
// @route   POST /api/leads/final-step
// @access  Private
router.post('/final-step', protect, handleFinalStep);


// === Employee Dashboard Routes ===
// These are protected by the 'protectEmployee' middleware

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private/Employee
router.get('/', protectEmployee, getLeads);

// @desc    Get a single lead by ID
// @route   GET /api/leads/:id
// @access  Private/Employee
router.get('/:id', protectEmployee, getLeadById);

// @desc    Update lead status
// @route   PUT /api/leads/:id/status
// @access  Private/Employee
router.put('/:id/status', protectEmployee, updateLeadStatus);

module.exports = router;
