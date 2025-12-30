const Asset = require("../models/Asset");

// Constant symbol for PhonePe Gold to ensure singleton record per user (for now)
// If we want to track separate transactions, we would use the Transaction model.
// For the Dashboard view, we want the aggregated Asset state.
const GOLD_SYMBOL = "DIGITAL_GOLD_PHONEPE";

// @desc    Get Gold Holdings
// @route   GET /api/gold
// @access  Public
const getGoldHoldings = async (req, res) => {
  try {
    // Get all gold holdings regardless of source
    const goldAssets = await Asset.find({ type: "GOLD" });
    res.json(goldAssets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually Add Gold Holding
// @route   POST /api/gold
// @access  Public
const updateGoldHolding = async (req, res) => {
  try {
    const { totalGrams, investedValue, name, pricePerGram } = req.body;

    // Validate that we have either investedValue or pricePerGram
    if (totalGrams === undefined) {
      return res.status(400).json({ message: "Please provide totalGrams" });
    }

    if (investedValue === undefined && pricePerGram === undefined) {
      return res.status(400).json({
        message: "Please provide either investedValue or pricePerGram",
      });
    }

    const quantity = parseFloat(totalGrams);

    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity provided" });
    }

    let value, averagePrice;

    // If pricePerGram is provided, calculate investedValue from it
    if (pricePerGram !== undefined) {
      averagePrice = parseFloat(pricePerGram);
      if (isNaN(averagePrice) || averagePrice < 0) {
        return res
          .status(400)
          .json({ message: "Invalid pricePerGram provided" });
      }
      value = quantity * averagePrice;
    } else {
      // Otherwise, calculate averagePrice from investedValue
      value = parseFloat(investedValue);
      if (isNaN(value) || value < 0) {
        return res
          .status(400)
          .json({ message: "Invalid investedValue provided" });
      }
      averagePrice = quantity > 0 ? value / quantity : 0;
    }

    // Create a new gold holding with a unique symbol
    const goldName = name || "Manual Gold";
    const symbol = `GOLD_${Date.now()}`;

    const newAsset = await Asset.create({
      symbol: symbol,
      name: goldName,
      type: "GOLD",
      source: "MANUAL",
      quantity: quantity,
      investedValue: value,
      averagePrice: averagePrice,
      lastUpdated: Date.now(),
    });

    res.status(201).json({
      message: "Gold holding added successfully",
      data: newAsset,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit/Update a specific Gold Holding by ID
// @route   PUT /api/gold/:id
// @access  Public
const editGoldHolding = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalGrams, investedValue, name, pricePerGram } = req.body;

    // Validate that we have either investedValue or pricePerGram
    if (totalGrams === undefined) {
      return res.status(400).json({ message: "Please provide totalGrams" });
    }

    if (investedValue === undefined && pricePerGram === undefined) {
      return res.status(400).json({
        message: "Please provide either investedValue or pricePerGram",
      });
    }

    const quantity = parseFloat(totalGrams);

    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity provided" });
    }

    let value, averagePrice;

    // If pricePerGram is provided, calculate investedValue from it
    if (pricePerGram !== undefined) {
      averagePrice = parseFloat(pricePerGram);
      if (isNaN(averagePrice) || averagePrice < 0) {
        return res
          .status(400)
          .json({ message: "Invalid pricePerGram provided" });
      }
      value = quantity * averagePrice;
    } else {
      // Otherwise, calculate averagePrice from investedValue
      value = parseFloat(investedValue);
      if (isNaN(value) || value < 0) {
        return res
          .status(400)
          .json({ message: "Invalid investedValue provided" });
      }
      averagePrice = quantity > 0 ? value / quantity : 0;
    }

    const updateData = {
      quantity: quantity,
      investedValue: value,
      averagePrice: averagePrice,
      lastUpdated: Date.now(),
    };

    // If name is provided, update it
    if (name) {
      updateData.name = name;
    }

    const updatedAsset = await Asset.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedAsset) {
      return res.status(404).json({ message: "Gold holding not found" });
    }

    res.status(200).json({
      message: "Gold holding updated successfully",
      data: updatedAsset,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Gold Holding by ID
// @route   DELETE /api/gold/:id
// @access  Public
const deleteGoldHolding = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAsset = await Asset.findByIdAndDelete(id);

    if (!deletedAsset) {
      return res.status(404).json({ message: "Gold holding not found" });
    }

    res.status(200).json({
      message: "Gold holding deleted successfully",
      data: deletedAsset,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGoldHoldings,
  updateGoldHolding,
  editGoldHolding,
  deleteGoldHolding,
};
