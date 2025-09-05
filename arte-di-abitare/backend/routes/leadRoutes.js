const express = require('express');
const router = express.Router();
const {
    submitQuestionnaire1,
    submitQuestionnaire2,
    handleFinalStep,
    getLeads,
    getLeadById,
    updateLeadStatus,
    updateLeadCallDetails,
    getTodaysReminders // Import the new function
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');

// === Public User Routes ===
router.post('/questionnaire1', protect, submitQuestionnaire1);
router.post('/questionnaire2', protect, submitQuestionnaire2);
router.post('/final-step', protect, handleFinalStep);


// === Employee Dashboard Routes ===
// @desc    Get leads with a callback reminder for today
// @route   GET /api/leads/reminders/today
// @access  Private/Employee
router.get('/reminders/today', protectEmployee, getTodaysReminders);

router.get('/', protectEmployee, getLeads);
router.get('/:id', protectEmployee, getLeadById);
router.put('/:id/call-details', protectEmployee, updateLeadCallDetails);

// This route is deprecated
router.put('/:id/status', protectEmployee, updateLeadStatus);


module.exports = router;
