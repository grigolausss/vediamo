const mongoose = require('mongoose');

const leadSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Property',
    },
    // Answers from the first questionnaire
    qualificationAnswers: {
      maxBudget: { type: String },
      purchaseTimeline: { type: String },
      mortgagePreApproval: { type: String },
      isFirstHome: { type: String },
      availabilityForVisit: { type: String },
    },
    // Answers from the second questionnaire (to be used later)
    postViewingAnswers: {
      searchZone: { type: String },
      minBedrooms: { type: Number },
      mustHaveFeatures: { type: String },
      urgency: { type: String },
      finalFeedback: { type: String },
    },
    status: {
        type: String,
        enum: ['Nuovo', 'Contattato', 'Da richiamare', 'Non interessato'],
        default: 'Nuovo'
    },
    notes: [
      {
        text: { type: String, required: true },
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
  }
);

// To avoid creating duplicate leads for the same user and property
leadSchema.index({ user: 1, property: 1 }, { unique: true });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
