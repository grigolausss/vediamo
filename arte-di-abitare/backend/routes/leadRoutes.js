const express = require('express');
const router = express.Router();
const {
    submitQuestionnaire1,
    submitQuestionnaire2,
    getHotLeads,
    getWarmLeads,
    getIncompleteLeads,
    getTodaysReminders,
    getLeadById,
    updateLeadCallDetails
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { protectEmployee } = require('../middleware/employeeAuthMiddleware');

// === Public User Routes ===
router.post('/questionnaire1', protect, submitQuestionnaire1);
router.post('/questionnaire2', protect, submitQuestionnaire2);

// === Employee Dashboard Routes ===
router.get('/hot', protectEmployee, getHotLeads);
router.get('/warm', protectEmployee, getWarmLeads);
router.get('/incomplete', protectEmployee, getIncompleteLeads);
router.get('/reminders/today', protectEmployee, getTodaysReminders);
router.get('/:id', protectEmployee, getLeadById);
router.put('/:id/call-details', protectEmployee, updateLeadCallDetails);

module.exports = router;
