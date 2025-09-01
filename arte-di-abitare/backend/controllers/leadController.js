const Lead = require('../models/leadModel');
const Property = require('../models/propertyModel');
const User = require('../models/userModel');
const logActivity = require('../utils/logger');

// @desc    Submit the first questionnaire
// @route   POST /api/leads/questionnaire1
// @access  Private
const submitQuestionnaire1 = async (req, res) => {
    const { propertyRif, answers } = req.body;
    const userId = req.user._id;

    if (!propertyRif || !answers) {
        res.status(400);
        return res.json({ message: 'Per favore, fornisci il RIF dell\'immobile e le risposte.' });
    }
    const { maxBudget, purchaseTimeline, mortgagePreApproval, isFirstHome, availabilityForVisit } = answers;
    if (!maxBudget || !purchaseTimeline || !mortgagePreApproval || !isFirstHome || !availabilityForVisit) {
        res.status(400);
        return res.json({ message: 'Per favore, rispondi a tutte le domande del questionario.' });
    }

    try {
        const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
        if (!property) {
            res.status(404);
            return res.json({ message: 'Immobile non trovato.' });
        }
        const propertyId = property._id;

        const lead = await Lead.findOneAndUpdate(
            { user: userId, property: propertyId },
            {
                user: userId,
                property: propertyId,
                qualificationAnswers: { maxBudget, purchaseTimeline, mortgagePreApproval, isFirstHome, availabilityForVisit },
                status: 'Nuovo'
            },
            { new: true, upsert: true, runValidators: true }
        );
        res.status(201).json({ message: 'Questionario inviato con successo.', lead });
    } catch (error) {
        console.error('Questionnaire submission error:', error);
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// @desc    Submit the second questionnaire
// @route   POST /api/leads/questionnaire2
// @access  Private
const submitQuestionnaire2 = async (req, res) => {
    const { propertyRif, answers } = req.body;
    const userId = req.user._id;

    if (!propertyRif || !answers) {
        res.status(400);
        return res.json({ message: 'Per favore, fornisci il RIF dell\'immobile e le risposte.' });
    }
    const { searchZone, minBedrooms, mustHaveFeatures, urgency, finalFeedback } = answers;
    if (!searchZone || !minBedrooms || !mustHaveFeatures || !urgency || !finalFeedback) {
        res.status(400);
        return res.json({ message: 'Per favore, rispondi a tutte le domande del questionario.' });
    }

    try {
        const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
        if (!property) {
            res.status(404);
            return res.json({ message: 'Immobile non trovato.' });
        }
        const propertyId = property._id;

        const lead = await Lead.findOne({ user: userId, property: propertyId });
        if (!lead) {
            res.status(404);
            return res.json({ message: 'Lead non trovato. Completa prima il questionario di qualificazione.' });
        }

        lead.postViewingAnswers = { searchZone, minBedrooms, mustHaveFeatures, urgency, finalFeedback };
        const updatedLead = await lead.save();
        res.status(200).json({ message: 'Secondo questionario inviato con successo.', lead: updatedLead });
    } catch (error) {
        console.error('Second questionnaire submission error:', error);
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// @desc    Handle the final step of the public flow (discover address or get alternatives)
// @route   POST /api/leads/final-step
// @access  Private
const handleFinalStep = async (req, res) => {
    const { propertyRif, choice, phone } = req.body;
    const userId = req.user._id;

    if (!propertyRif || !choice) {
        res.status(400);
        return res.json({ message: 'Per favore, fornisci il RIF dell\'immobile e una scelta.' });
    }

    try {
        if (phone) {
            await User.findByIdAndUpdate(userId, { phone });
        }
        const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
        if (!property) {
            res.status(404);
            return res.json({ message: 'Immobile non trovato.' });
        }
        if (choice === 'discoverAddress') {
            return res.status(200).json({ message: 'Indirizzo recuperato con successo.', address: property.address });
        } else if (choice === 'getAlternatives') {
            const priceMargin = property.price * 0.2;
            const alternatives = await Property.find({
                _id: { $ne: property._id },
                zone: property.zone,
                price: { $gte: property.price - priceMargin, $lte: property.price + priceMargin },
                isActive: true,
            }).limit(3);
            return res.status(200).json({ message: 'Alternative trovate con successo.', alternatives });
        } else {
            res.status(400);
            return res.json({ message: 'Scelta non valida.' });
        }
    } catch (error) {
        console.error('Final step handling error:', error);
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

// @desc    Get all leads for the dashboard
// @route   GET /api/leads
// @access  Private/Employee
const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find({}).populate('user', 'name surname email phone').populate('property', 'title rif').sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

// @desc    Get a single lead by ID
// @route   GET /api/leads/:id
// @access  Private/Employee
const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id).populate('user', 'name surname email phone').populate('property');
        if (lead) {
            res.status(200).json(lead);
        } else {
            res.status(404).json({ message: 'Lead non trovato.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

// @desc    Update lead status and add a note
// @route   PUT /api/leads/:id/status
// @access  Private/Employee
const updateLeadStatus = async (req, res) => {
    const { status, noteText } = req.body;
    const employeeId = req.employee._id;

    try {
        const lead = await Lead.findById(req.params.id);
        if (lead) {
            lead.status = status || lead.status;
            if (noteText) {
                const note = { text: noteText, employee: employeeId };
                lead.notes.push(note);
            }
            const updatedLead = await lead.save();
            logActivity(employeeId, 'UPDATE_LEAD_STATUS', `Aggiornato stato del lead ID: ${lead._id} a "${lead.status}"`);
            res.status(200).json(updatedLead);
        } else {
            res.status(404).json({ message: 'Lead non trovato.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

module.exports = {
    submitQuestionnaire1,
    submitQuestionnaire2,
    handleFinalStep,
    getLeads,
    getLeadById,
    updateLeadStatus,
};
