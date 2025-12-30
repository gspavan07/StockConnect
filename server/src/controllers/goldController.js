const Asset = require("../models/Asset");
const Transaction = require("../models/Transaction");

// Constant symbol for PhonePe Gold to ensure singleton record per user (for now)
const GOLD_SYMBOL = "DIGITAL_GOLD_PHONEPE";

// @desc    Get Gold Holdings
const getGoldHoldings = async (req, res) => {
  try {
    const goldAssets = await Asset.find({ type: "GOLD" });
    res.json(goldAssets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually Add Gold Holding
const updateGoldHolding = async (req, res) => {
  try {
    const { totalGrams, investedValue, name, pricePerGram, purchaseDate } =
      req.body;

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
    if (pricePerGram !== undefined) {
      averagePrice = parseFloat(pricePerGram);
      value = quantity * averagePrice;
    } else {
      value = parseFloat(investedValue);
      averagePrice = quantity > 0 ? value / quantity : 0;
    }

    const goldName = name || "Manual Gold";
    const symbol = `GOLD_${Date.now()}`;

    // Create Asset
    const newAsset = await Asset.create({
      symbol: symbol,
      name: goldName,
      type: "GOLD",
      source: "MANUAL",
      quantity: quantity,
      investedValue: value,
      averagePrice: averagePrice,
      lastUpdated: purchaseDate || Date.now(),
    });

    // Create BUY Transaction
    await Transaction.create({
      asset: newAsset._id,
      type: "BUY",
      quantity: quantity,
      price: averagePrice,
      date: purchaseDate || Date.now(),
    });

    res.status(201).json({
      message: "Gold holding and transaction added successfully",
      data: newAsset,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit/Update a specific Gold Holding by ID
const editGoldHolding = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalGrams, investedValue, name, pricePerGram, purchaseDate } =
      req.body;

    if (totalGrams === undefined) {
      return res.status(400).json({ message: "Please provide totalGrams" });
    }

    const quantity = parseFloat(totalGrams);
    let value, averagePrice;

    if (pricePerGram !== undefined) {
      averagePrice = parseFloat(pricePerGram);
      value = quantity * averagePrice;
    } else {
      value = parseFloat(investedValue);
      averagePrice = quantity > 0 ? value / quantity : 0;
    }

    const updateData = {
      quantity: quantity,
      investedValue: value,
      averagePrice: averagePrice,
      lastUpdated: purchaseDate || Date.now(),
    };

    if (name) updateData.name = name;

    const updatedAsset = await Asset.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedAsset) {
      return res.status(404).json({ message: "Gold holding not found" });
    }

    // Update corresponding Transaction
    // Since it's a manual asset, we expect one primary BUY transaction
    await Transaction.findOneAndUpdate(
      { asset: id, type: "BUY" },
      {
        quantity: quantity,
        price: averagePrice,
        date: purchaseDate || Date.now(),
      },
      { upsert: true } // Create if doesn't exist for some reason
    );

    res.status(200).json({
      message: "Gold holding and transaction updated successfully",
      data: updatedAsset,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Gold Holding by ID
const deleteGoldHolding = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated transactions first
    await Transaction.deleteMany({ asset: id });

    const deletedAsset = await Asset.findByIdAndDelete(id);

    if (!deletedAsset) {
      return res.status(404).json({ message: "Gold holding not found" });
    }

    res.status(200).json({
      message: "Gold holding and transactions deleted successfully",
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
