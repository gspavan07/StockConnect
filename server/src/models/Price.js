const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String, // To distinguish between Stock price, MF NAV, etc.
    enum: ['STOCK', 'MF', 'GOLD'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  lastFetched: {
    type: Date,
    default: Date.now
  }
});

// Ensure we lookup fast by symbol
PriceSchema.index({ symbol: 1, type: 1 });

module.exports = mongoose.model('Price', PriceSchema);
