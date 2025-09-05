const Lead = require('../models/leadModel');
const Property = require('../models/propertyModel');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const logActivity = require('../utils/logger');

// @desc    Submit the first questionnaire
// @route   POST /api/leads/questionnaire1
// @access  Private
const submitQuestionnaire1 = async (req, res) => {
    const { propertyRif, answers } = req.body;
    const userId = req.user._id;

    if (!propertyRif || !answers) {
        return res.status(400).json({ message: 'Per favore, fornisci il RIF immobile e le risposte.' });
    }

    try {
        const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
        if (!property) {
            return res.status(404).json({ message: 'Immobile non trovato.' });
        }

        // The 'answers' object now has the new structure.
        // We can add validation here if needed.
        const questionnaireData = {
            sellToBuy: answers.sellToBuy,
            maxBudget: answers.maxBudget,
            needsMortgage: answers.needsMortgage,
            mortgagePercentage: answers.mortgagePercentage,
            mortgagePreApproval: answers.mortgagePreApproval,
            purchaseTimeline: answers.purchaseTimeline,
        };

        const lead = await Lead.findOneAndUpdate(
            { user: userId, property: property._id },
            {
                $set: {
                    user: userId,
                    property: property._id,
                    questionnaire1: questionnaireData,
                    status: 'Nuovo' // Reset status on new questionnaire submission
                }
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({ message: 'Questionario inviato con successo.', lead });
    } catch (error) {
        console.error('Questionnaire 1 submission error:', error);
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
        return res.status(400).json({ message: 'Per favore, fornisci il RIF immobile e le risposte.' });
    }

    try {
        const property = await Property.findOne({ rif: propertyRif.toUpperCase() });
        if (!property) {
            return res.status(404).json({ message: 'Immobile non trovato.' });
        }

        const lead = await Lead.findOne({ user: userId, property: property._id });
        if (!lead) {
            return res.status(404).json({ message: 'Lead non trovato. Completa prima il questionario 1.' });
        }

        // The 'answers' object now has the new structure.
        lead.questionnaire2 = {
            searchZone: answers.searchZone,
            minBedrooms: answers.minBedrooms,
            mustHaveFeatures: answers.mustHaveFeatures,
            searchDuration: answers.searchDuration,
        };

        const updatedLead = await lead.save();
        res.status(200).json({ message: 'Questionario 2 inviato con successo.', lead: updatedLead });

    } catch (error) {
        console.error('Questionnaire 2 submission error:', error);
        res.status(500).json({ message: 'Errore del server.', error: error.message });
    }
};

const handleFinalStep = async (req, res) => { res.status(501).json({ message: 'Not Implemented' }); };


// === Employee Dashboard Routes ===

const getLeads = async (req, res) => {
    // This controller will be enhanced to support search and sort later.
    // For now, it returns all leads as before to not break the initial page load.
    try {
        const leads = await Lead.find({})
            .populate('user', 'name surname email phone')
            .populate('property', 'title rif')
            .sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const getTodaysReminders = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today in server's timezone

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

        const reminders = await Lead.find({
            needsCallback: true,
            callbackDate: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('user', 'name surname');

        res.status(200).json(reminders);
    } catch (error) {
        console.error("Error fetching reminders:", error);
        res.status(500).json({ message: 'Errore nel recupero dei promemoria.' });
    }
};

const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('user', 'name surname email phone')
            .populate('property', '_id title rif')
            .populate('calledBy', 'email')
            .populate({
                path: 'notes',
                populate: { path: 'employee', select: 'email' }
            });

        if (lead) { res.status(200).json(lead); }
        else { res.status(404).json({ message: 'Lead non trovato.' }); }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const updateLeadStatus = async (req, res) => {
    res.status(410).json({ message: 'This endpoint is deprecated. Please use /api/leads/:id/call-details' });
};

const updateLeadCallDetails = async (req, res) => {
    const { id } = req.params;
    const { isContacted, calledByEmail, callDate, noteText, needsCallback, callbackDate } = req.body;
    const currentEmployeeId = req.employee._id;

    try {
        const lead = await Lead.findById(id);
        if (!lead) { return res.status(404).json({ message: 'Lead non trovato.' }); }

        if (noteText && noteText.trim() !== '') {
            lead.notes.push({ text: noteText, employee: currentEmployeeId });
        }

        lead.isContacted = isContacted;
        lead.needsCallback = needsCallback;
        lead.callDate = isContacted && callDate ? callDate : null;
        lead.callbackDate = needsCallback && callbackDate ? callbackDate : null;

        if (isContacted && calledByEmail) {
            const calledByEmployee = await Employee.findOne({ email: calledByEmail });
            lead.calledBy = calledByEmployee ? calledByEmployee._id : null;
        } else if (!isContacted) {
            lead.calledBy = null;
        }

        if (needsCallback) { lead.status = 'Da richiamare'; }
        else if (isContacted) { lead.status = 'Contattato'; }
        if (lead.status === 'Nuovo' && isContacted) { lead.status = 'Contattato'; }

        const updatedLead = await lead.save();

        await updatedLead.populate([
            { path: 'user', select: 'name surname email phone' },
            { path: 'property', select: '_id title rif' },
            { path: 'calledBy', select: 'email' },
            { path: 'notes', populate: { path: 'employee', select: 'email' } }
        ]);

        logActivity(currentEmployeeId, 'UPDATE_LEAD_DETAILS', `Aggiornati dettagli chiamata per lead ID: ${lead._id}`);
        res.status(200).json(updatedLead);

    } catch (error) {
        console.error("Error updating lead call details:", error);
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento.', error: error.message });
    }
};

module.exports = {
    submitQuestionnaire1,
    submitQuestionnaire2,
    handleFinalStep,
    getLeads,
    getLeadById,
    updateLeadStatus,
    updateLeadCallDetails,
    getTodaysReminders,
};
