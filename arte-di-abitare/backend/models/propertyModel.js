const mongoose = require('mongoose');

const propertySchema = mongoose.Schema(
  {
    rif: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true, // Add index for faster search
    },
    title: {
      type: String,
      required: true,
    },
    typology: {
      type: String,
      required: true,
    },
    zone: {
      type: String,
      required: true,
    },
    surface: {
      type: Number, // Metratura in mq
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String, // e.g., 'Disponibile', 'Venduto', 'In trattativa'
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    floorPlan: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional fields
    yearOfConstruction: {
      type: Number,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
