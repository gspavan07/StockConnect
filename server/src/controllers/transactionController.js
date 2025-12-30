const Transaction = require("../models/Transaction");

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Public
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate(
      "asset",
      "symbol name"
    );
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add transaction
// @route   POST /api/transactions
// @access  Public
const addTransaction = async (req, res) => {
  try {
    const { assetId, type, quantity, price, date } = req.body;

    const transaction = await Transaction.create({
      asset: assetId,
      type,
      quantity,
      price,
      date: date || Date.now(),
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  addTransaction,
};
