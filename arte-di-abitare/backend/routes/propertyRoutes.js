const express = require('express');
const router = express.Router();
const {
    searchProperty,
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty
} = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const { protectEmployee, admin } = require('../middleware/employeeAuthMiddleware');

// @desc    Search for a property by RIF (for public users)
// @route   POST /api/properties/search
// @access  Private
router.post('/search', protect, searchProperty);

// === Employee CRUD Routes ===
router.route('/')
    .get(protectEmployee, getProperties)
    .post(protectEmployee, createProperty);

router.route('/:id')
    .get(protectEmployee, getPropertyById)
    .put(protectEmployee, updateProperty)
    .delete(protectEmployee, admin, deleteProperty);

module.exports = router;
