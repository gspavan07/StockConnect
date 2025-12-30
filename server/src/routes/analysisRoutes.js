const express = require("express");
const router = express.Router();
const analysisController = require("../controllers/analysisController");

router.get("/growth", analysisController.getGrowthAnalysis);

module.exports = router;
