const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['STOCK', 'MF', 'GOLD'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  averagePrice: {
    type: Number,
    required: true,
    default: 0
  },
  currentPrice: {
    type: Number,
    required: false // Optional, only for MFs where Zerodha provides it
  },
  investedValue: {
    type: Number,
    required: true,
    default: 0
  },
  source: {
    type: String,
    enum: ['ZERODHA', 'PHONEPE', 'MANUAL'],
    default: 'MANUAL'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique symbol per source (or just globally if we mix)
// A user might have the same stock in multiple places? For now assuming aggregated view
// or distinct by symbol. Let's keep it unique by symbol + type for simplicity.
AssetSchema.index({ symbol: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Asset', AssetSchema);
