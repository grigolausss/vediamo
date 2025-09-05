const Property = require('../models/propertyModel');
const Lead = require('../models/leadModel');
const logActivity = require('../utils/logger');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Helper to remove old file
const removeFile = (filePath) => {
    if (!filePath) return;
    // Construct the full path from the project root
    const fullPath = path.join(__dirname, '..', filePath);
    fs.unlink(fullPath, err => {
        if (err) console.error(`Failed to delete old file: ${fullPath}`, err);
    });
};

// @desc    Search for a property by RIF (for public users) and create a lead
const searchProperty = async (req, res) => {
    const { rif } = req.body;
    const userId = req.user._id;

    if (!rif) { return res.status(400).json({ message: 'Per favore, fornisci un codice RIF.' }); }
    try {
        const property = await Property.findOne({ rif: rif.trim().toUpperCase() });
        if (!property || !property.isActive) {
            return res.status(404).json({ message: 'Immobile non trovato o non attivo.' });
        }

        // Upsert the lead for this specific property
        await Lead.findOneAndUpdate(
            { user: userId, property: property._id },
            { $setOnInsert: { user: userId, property: property._id } },
            { upsert: true, new: true, runValidators: true }
        );

        // Check if the user has completed questionnaires for ANY lead
        const anyLeadWithQuestionnaires = await Lead.findOne({
            user: userId,
            questionnaire1: { $exists: true, $ne: null },
            questionnaire2: { $exists: true, $ne: null },
        });

        const questionnairesCompleted = !!anyLeadWithQuestionnaires;

        // The response will now include the skip-logic flag
        res.status(200).json({
            _id: property._id,
            rif: property.rif,
            title: property.title,
            dossierImage: property.dossierImage,
            questionnairesCompleted: questionnairesCompleted,
        });

    } catch (error) {
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// @desc    Get a watermarked floor plan for a property
const getWatermarkedFloorPlan = async (req, res) => {
    try {
        const property = await Property.findOne({ rif: req.params.rif.toUpperCase() });
        if (!property || !property.planimetryImage) {
            return res.status(404).json({ message: 'Planimetria non trovata.' });
        }

        // The image is now stored locally
        const imagePath = path.join(__dirname, '..', property.planimetryImage);
        const imageBuffer = fs.readFileSync(imagePath);

        const userEmail = req.user.email;
        const currentDate = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
        const watermarkText = `${userEmail}   ${currentDate}`;
        const svgWatermark = `<svg width="500" height="100"><text x="10" y="50" font-family="Arial" font-size="16" fill="rgba(0, 0, 0, 0.3)" transform="rotate(-15)">${watermarkText}</text></svg>`;
        const svgBuffer = Buffer.from(svgWatermark);

        const watermarkedImageBuffer = await sharp(imageBuffer)
            .composite([{ input: svgBuffer, tile: true, blend: 'over' }])
            .png()
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
        const { rif, title, zone, price, surface, bedrooms, bathrooms } = req.body;
        const requiredFields = { rif, title, zone, price, surface, bedrooms, bathrooms };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                return res.status(400).json({ message: `Il campo ${field} è obbligatorio.` });
            }
        }

        const propertyExists = await Property.findOne({ rif: rif.trim().toUpperCase() });
        if (propertyExists) { return res.status(400).json({ message: 'Un immobile con questo RIF esiste già.' }); }

        if (!req.files || !req.files.dossierImage || !req.files.planimetryImage || !req.files.zoneImage) {
            return res.status(400).json({ message: 'Tutte e tre le immagini sono obbligatorie.' });
        }

        const propertyData = {
            ...requiredFields,
            dossierImage: `/public/uploads/${req.files.dossierImage[0].filename}`,
            planimetryImage: `/public/uploads/${req.files.planimetryImage[0].filename}`,
            zoneImage: `/public/uploads/${req.files.zoneImage[0].filename}`,
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
        if (property) {
            const { rif, title, zone, price, surface, bedrooms, bathrooms, isActive } = req.body;

            // Update all fields from request body
            property.rif = rif || property.rif;
            property.title = title || property.title;
            property.zone = zone || property.zone;
            property.price = price || property.price;
            property.surface = surface || property.surface;
            property.bedrooms = bedrooms || property.bedrooms;
            property.bathrooms = bathrooms || property.bathrooms;
            property.isActive = isActive === 'true';

            // Handle file updates
            if (req.files) {
                if (req.files.dossierImage) {
                    removeFile(property.dossierImage);
                    property.dossierImage = `/public/uploads/${req.files.dossierImage[0].filename}`;
                }
                if (req.files.planimetryImage) {
                    removeFile(property.planimetryImage);
                    property.planimetryImage = `/public/uploads/${req.files.planimetryImage[0].filename}`;
                }
                if (req.files.zoneImage) {
                    removeFile(property.zoneImage);
                    property.zoneImage = `/public/uploads/${req.files.zoneImage[0].filename}`;
                }
            }

            const updatedProperty = await property.save();
            logActivity(req.employee._id, 'UPDATE_PROPERTY', `Aggiornato immobile RIF: ${updatedProperty.rif}`);
            res.json(updatedProperty);
        } else {
            res.status(404).json({ message: 'Immobile non trovato.' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Dati immobile non validi.', error: error.message });
    }
};

const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (property) {
            const rif = property.rif;
            // Remove images associated with the property
            removeFile(property.dossierImage);
            removeFile(property.planimetryImage);
            removeFile(property.zoneImage);

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
    // Remove currency symbols, dots, and spaces, then parse as integer
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
            // No answers to base alternatives on, return empty
            return res.json([]);
        }

        const { maxBudget } = lead.questionnaire1;
        const { searchZone, minBedrooms } = lead.questionnaire2;

        const budget = parseBudget(maxBudget);
        const priceMargin = 0.20; // 20% margin for price

        // Build the query
        const query = {
            _id: { $ne: originalProperty._id },
            isActive: true,
        };

        if (searchZone) {
            // Simple search in the property's zone field
            query.zone = { $regex: searchZone, $options: 'i' };
        }
        if (minBedrooms) {
            query.bedrooms = { $gte: minBedrooms };
        }
        if (budget) {
            query.price = {
                $gte: budget * (1 - priceMargin),
                $lte: budget * (1 + priceMargin)
            };
        }

        const alternatives = await Property.find(query)
            .limit(3)
            .select('_id title rif')
            .sort({ createdAt: -1 });

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
