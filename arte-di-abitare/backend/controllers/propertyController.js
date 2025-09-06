const Property = require('../models/propertyModel');
const Lead = require('../models/leadModel');
const logActivity = require('../utils/logger');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const heicConvert = require('heic-convert');

// --- Helper Functions ---

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Helper to safely remove a file from the uploads directory
const removeFile = async (filename) => {
    if (!filename) return;
    try {
        await fs.unlink(path.join(UPLOADS_DIR, filename));
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error(`Failed to delete old file: ${filename}`, err);
        }
    }
};

// Helper to handle HEIC to JPEG conversion
const handleImageConversion = async (file) => {
    if (!file) return null;
    if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
        const originalPath = file.path;
        const newFilename = `${path.parse(file.filename).name}.jpeg`;
        const newPath = path.join(UPLOADS_DIR, newFilename);
        try {
            const inputBuffer = await fs.readFile(originalPath);
            const outputBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 });
            await fs.writeFile(newPath, outputBuffer);
            await fs.unlink(originalPath);
            return newFilename;
        } catch (error) {
            await fs.unlink(originalPath).catch(e => {});
            throw new Error('Conversione del file HEIC fallita.');
        }
    }
    return file.filename;
};

// @desc    Search for a property by RIF (for public users) and create a lead
const searchProperty = async (req, res) => {
    const { rif } = req.body;
    if (!rif) { return res.status(400).json({ message: 'Per favore, fornisci un codice RIF.' }); }
    try {
        const normalizedRif = rif.replace(/\s/g, '').toUpperCase();
        const property = await Property.findOne({ rif: normalizedRif });
        if (!property || !property.isActive) {
            return res.status(404).json({ message: 'Immobile non trovato o non attivo.' });
        }
        const userId = req.user._id;
        await Lead.findOneAndUpdate(
            { user: userId, property: property._id },
            { $setOnInsert: { user: userId, property: property._id } },
            { upsert: true, new: true, runValidators: true }
        );
        const anyLeadWithQuestionnaires = await Lead.findOne({
            user: userId,
            questionnaire1: { $exists: true, $ne: null },
            questionnaire2: { $exists: true, $ne: null },
        });
        res.status(200).json({
            _id: property._id,
            rif: property.rif,
            title: property.title,
            dossierImage: property.dossierImage, // Send back only the filename
            questionnairesCompleted: !!anyLeadWithQuestionnaires,
        });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// @desc    Get a watermarked floor plan for a property
const getWatermarkedFloorPlan = async (req, res) => {
    try {
        const normalizedRif = req.params.rif.replace(/\s/g, '').toUpperCase();
        const property = await Property.findOne({ rif: normalizedRif });
        if (!property || !property.planimetryImage) {
            return res.status(404).json({ message: 'Planimetria non trovata.' });
        }

        // FIX: Construct the correct, absolute filesystem path
        const imagePath = path.join(UPLOADS_DIR, property.planimetryImage);

        const imageBuffer = await fs.readFile(imagePath);
        const userEmail = req.user.email;
        const currentDate = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
        const watermarkText = `${userEmail}   ${currentDate}`;
        const svgWatermark = `<svg width="500" height="100"><text x="10" y="50" font-family="Arial" font-size="16" fill="rgba(0, 0, 0, 0.3)" transform="rotate(-15)">${watermarkText}</text></svg>`;
        const svgBuffer = Buffer.from(svgWatermark);
        const watermarkedImageBuffer = await sharp(imageBuffer)
            .composite([{ input: svgBuffer, tile: true, blend: 'over' }])
            .png().toBuffer();
        res.set('Content-Type', 'image/png');
        res.send(watermarkedImageBuffer);
    } catch (error) {
        console.error('Watermark service error:', error);
        res.status(500).json({ message: 'Errore durante la creazione del watermark.' });
    }
};

// --- Employee-only routes ---

const createProperty = async (req, res) => {
    try {
        if (!req.files || !req.files.dossierImage || !req.files.planimetryImage || !req.files.zoneImage) {
            return res.status(400).json({ message: 'Tutte e tre le immagini sono obbligatorie.' });
        }

        const dossierImageFilename = await handleImageConversion(req.files.dossierImage[0]);
        const planimetryImageFilename = await handleImageConversion(req.files.planimetryImage[0]);
        const zoneImageFilename = await handleImageConversion(req.files.zoneImage[0]);

        const propertyData = {
            ...req.body,
            dossierImage: dossierImageFilename,
            planimetryImage: planimetryImageFilename,
            zoneImage: zoneImageFilename,
            isActive: req.body.isActive === 'true',
        };

        const property = new Property(propertyData);
        const createdProperty = await property.save();
        logActivity(req.employee._id, 'CREATE_PROPERTY', `Creato immobile RIF: ${createdProperty.rif}`);
        res.status(201).json(createdProperty);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Dati immobile non validi.', error: error.message });
    }
};

const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Immobile non trovato.' });
        }

        const { rif, title, zone, price, surface, bedrooms, bathrooms, isActive } = req.body;
        property.rif = rif || property.rif;
        property.title = title || property.title;
        property.zone = zone || property.zone;
        property.price = price || property.price;
        property.surface = surface || property.surface;
        property.bedrooms = bedrooms || property.bedrooms;
        property.bathrooms = bathrooms || property.bathrooms;
        property.isActive = isActive === 'true';

        if (req.files) {
            if (req.files.dossierImage) {
                await removeFile(property.dossierImage);
                property.dossierImage = await handleImageConversion(req.files.dossierImage[0]);
            }
            if (req.files.planimetryImage) {
                await removeFile(property.planimetryImage);
                property.planimetryImage = await handleImageConversion(req.files.planimetryImage[0]);
            }
            if (req.files.zoneImage) {
                await removeFile(property.zoneImage);
                property.zoneImage = await handleImageConversion(req.files.zoneImage[0]);
            }
        }

        const updatedProperty = await property.save();
        logActivity(req.employee._id, 'UPDATE_PROPERTY', `Aggiornato immobile RIF: ${updatedProperty.rif}`);
        res.json(updatedProperty);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Dati immobile non validi.', error: error.message });
    }
};

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

const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) {
            const rif = property.rif;
            await removeFile(property.dossierImage);
            await removeFile(property.planimetryImage);
            await removeFile(property.zoneImage);
            await property.deleteOne();
            logActivity(req.employee._id, 'DELETE_PROPERTY', `Rimosso immobile RIF: ${rif}`);
            res.json({ message: 'Immobile rimosso con successo.' });
        } else {
            res.status(404).json({ message: 'Immobile non trovato.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const getPropertyZone = async (req, res) => {
    try {
        const property = await Property.findOne({ rif: req.params.rif.toUpperCase() }, 'title zoneImage');
        if (property && property.zoneImage) {
            res.json({
                zoneImage: property.zoneImage,
                title: property.title,
            });
        } else {
            res.status(404).json({ message: 'Dati della zona non trovati per questo immobile.' });
        }
    } catch (error) {
        console.error('Error fetching property zone:', error);
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const parseBudget = (budgetStr) => {
    if (!budgetStr) return null;
    return parseInt(budgetStr.replace(/[€\.\s]/g, ''), 10);
};

const getAlternatives = async (req, res) => {
    try {
        const { rif } = req.params;
        const userId = req.user._id;
        const originalProperty = await Property.findOne({ rif: rif.toUpperCase() });
        if (!originalProperty) {
            return res.status(404).json({ message: 'Immobile originale non trovato.' });
        }
        const lead = await Lead.findOne({ user: userId, property: originalProperty._id });
        if (!lead || !lead.questionnaire1 || !lead.questionnaire2) {
            return res.json([]);
        }
        const { maxBudget } = lead.questionnaire1;
        const { searchZone, minBedrooms } = lead.questionnaire2;
        const budget = parseBudget(maxBudget);
        const priceMargin = 0.20;
        const query = { _id: { $ne: originalProperty._id }, isActive: true };
        if (searchZone) { query.zone = { $regex: searchZone, $options: 'i' }; }
        if (minBedrooms) { query.bedrooms = { $gte: minBedrooms }; }
        if (budget) { query.price = { $gte: budget * (1 - priceMargin), $lte: budget * (1 + priceMargin) }; }
        const alternatives = await Property.find(query).limit(3).select('_id title rif').sort({ createdAt: -1 });
        res.json(alternatives);
    } catch (error) {
        console.error('Error fetching alternatives:', error);
        res.status(500).json({ message: 'Errore del server durante la ricerca di alternative.' });
    }
};

module.exports = {
    searchProperty, getWatermarkedFloorPlan, getProperties, getPropertyById,
    createProperty, updateProperty, deleteProperty, getPropertyZone, getAlternatives,
};
