const Property = require('../models/propertyModel');
const logActivity = require('../utils/logger');

// @desc    Search for a property by RIF (for public users)
// @route   POST /api/properties/search
// @access  Private
const searchProperty = async (req, res) => {
    const { rif } = req.body;
    if (!rif) {
        res.status(400);
        return res.json({ message: 'Per favore, fornisci un codice RIF.' });
    }
    try {
        const processedRif = rif.trim().toUpperCase();
        const property = await Property.findOne({ rif: processedRif });
        if (property && property.isActive) {
            const propertyDetails = {
                title: property.title,
                rif: property.rif,
                typology: property.typology,
                zone: property.zone,
                surface: property.surface,
                price: property.price,
                status: property.status,
                images: property.images.slice(0, 4),
                floorPlan: property.floorPlan,
            };
            res.status(200).json(propertyDetails);
        } else {
            res.status(404).json({ message: 'Immobile non trovato o non attivo.' });
        }
    } catch (error) {
        console.error('Property search error:', error);
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// --- Employee-only routes ---

// @desc    Get all properties for admin list
// @route   GET /api/properties
// @access  Private/Employee
const getProperties = async (req, res) => {
    try {
        const properties = await Property.find({}).sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

// @desc    Get a single property by ID
// @route   GET /api/properties/:id
// @access  Private/Employee
const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) {
            res.json(property);
        } else {
            res.status(404).json({ message: 'Immobile non trovato.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

// @desc    Create a property
// @route   POST /api/properties
// @access  Private/Employee
const createProperty = async (req, res) => {
    try {
        const { rif } = req.body;
        const propertyExists = await Property.findOne({ rif: rif.trim().toUpperCase() });
        if (propertyExists) {
            return res.status(400).json({ message: 'Un immobile con questo RIF esiste già.' });
        }
        const property = new Property({ ...req.body });
        const createdProperty = await property.save();
        logActivity(req.employee._id, 'CREATE_PROPERTY', `Creato immobile RIF: ${createdProperty.rif}`);
        res.status(201).json(createdProperty);
    } catch (error) {
        res.status(400).json({ message: 'Dati immobile non validi.', error: error.message });
    }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private/Employee
const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) {
            Object.assign(property, req.body);
            const updatedProperty = await property.save();
            logActivity(req.employee._id, 'UPDATE_PROPERTY', `Aggiornato immobile RIF: ${updatedProperty.rif}`);
            res.json(updatedProperty);
        } else {
            res.status(404).json({ message: 'Immobile non trovato.' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Dati immobile non validi.', error: error.message });
    }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private/Admin
const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) {
            const rif = property.rif;
            await property.deleteOne();
            logActivity(req.employee._id, 'DELETE_PROPERTY', `Rimosso immobile RIF: ${rif}`);
            res.json({ message: 'Immobile rimosso.' });
        } else {
            res.status(404).json({ message: 'Immobile non trovato.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

module.exports = {
    searchProperty,
    getProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
};
