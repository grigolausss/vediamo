const Property = require('../models/propertyModel');
const Lead = require('../models/leadModel');
const logActivity = require('../utils/logger');
const sharp = require('sharp');
const axios = require('axios');

// @desc    Search for a property by RIF (for public users) and create a lead
const searchProperty = async (req, res) => {
    const { rif } = req.body;
    if (!rif) { return res.status(400).json({ message: 'Per favore, fornisci un codice RIF.' }); }
    try {
        const property = await Property.findOne({ rif: rif.trim().toUpperCase() });
        if (property && property.isActive) {
            await Lead.findOneAndUpdate(
                { user: req.user._id, property: property._id },
                { $setOnInsert: { user: req.user._id, property: property._id } },
                { upsert: true, new: true, runValidators: true }
            );
            res.status(200).json({
                title: property.title, rif: property.rif, typology: property.typology, zone: property.zone,
                surface: property.surface, price: property.price, status: property.status,
                images: property.images.slice(0, 4), floorPlan: property.floorPlan,
            });
        } else {
            res.status(404).json({ message: 'Immobile non trovato o non attivo.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// @desc    Get a watermarked floor plan for a property
const getWatermarkedFloorPlan = async (req, res) => {
    try {
        const property = await Property.findOne({ rif: req.params.rif.toUpperCase() });
        if (!property || !property.floorPlan) {
            return res.status(404).json({ message: 'Planimetria non trovata.' });
        }
        const imageResponse = await axios({ url: property.floorPlan, responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        const userEmail = req.user.email;
        const currentDate = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
        const watermarkText = `${userEmail}   ${currentDate}`;
        const svgWatermark = `<svg width="500" height="100"><text x="10" y="50" font-family="Arial" font-size="16" fill="rgba(0, 0, 0, 0.3)" transform="rotate(-15)">${watermarkText}</text></svg>`;
        const svgBuffer = Buffer.from(svgWatermark);
        const watermarkedImageBuffer = await sharp(imageBuffer)
            .composite([{ input: svgBuffer, tile: true, blend: 'over' }])
            .png() // Convert to png for consistency
            .toBuffer();
        res.set('Content-Type', 'image/png');
        res.send(watermarkedImageBuffer);
    } catch (error) {
        console.error('Watermark service error:', error);
        res.status(500).json({ message: 'Errore durante la creazione del watermark.' });
    }
};

// --- Employee-only routes ---
const getProperties = async (req, res) => {
    try {
        const properties = await Property.find({}).sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) { res.status(500).json({ message: 'Errore del server.' }); }
};

const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) { res.json(property); }
        else { res.status(404).json({ message: 'Immobile non trovato.' }); }
    } catch (error) { res.status(500).json({ message: 'Errore del server.' }); }
};

const createProperty = async (req, res) => {
    try {
        const { rif } = req.body;
        if (!rif) return res.status(400).json({ message: 'Il RIF è obbligatorio.' });
        const propertyExists = await Property.findOne({ rif: rif.trim().toUpperCase() });
        if (propertyExists) { return res.status(400).json({ message: 'Un immobile con questo RIF esiste già.' }); }
        const property = new Property({ ...req.body });
        const createdProperty = await property.save();
        logActivity(req.employee._id, 'CREATE_PROPERTY', `Creato immobile RIF: ${createdProperty.rif}`);
        res.status(201).json(createdProperty);
    } catch (error) { res.status(400).json({ message: 'Dati immobile non validi.', error: error.message }); }
};

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
    } catch (error) { res.status(400).json({ message: 'Dati immobile non validi.', error: error.message }); }
};

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
    } catch (error) { res.status(500).json({ message: 'Errore del server.' }); }
};

module.exports = {
    searchProperty, getWatermarkedFloorPlan, getProperties, getPropertyById,
    createProperty, updateProperty, deleteProperty,
};
