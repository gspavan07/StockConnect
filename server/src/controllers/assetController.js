const Asset = require('../models/Asset');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Public
const getAssets = async (req, res) => {
  try {
    const assets = await Asset.find();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new asset manually
// @route   POST /api/assets
// @access  Public
const addAsset = async (req, res) => {
  try {
    const { symbol, name, type, quantity, averagePrice, source } = req.body;
    
    // Simple verification (in real app, use validation library)
    if (!symbol || !name || !type) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }

    const investedValue = quantity * averagePrice;

    const asset = await Asset.create({
      symbol,
      name,
      type,
      quantity,
      averagePrice,
      investedValue,
      source
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAssets,
  addAsset
};
