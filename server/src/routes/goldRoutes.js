const express = require("express");
const router = express.Router();
const {
  getGoldHoldings,
  updateGoldHolding,
  editGoldHolding,
  deleteGoldHolding,
} = require("../controllers/goldController");

router.get("/", getGoldHoldings);
router.post("/", updateGoldHolding);
router.put("/:id", editGoldHolding);
router.delete("/:id", deleteGoldHolding);

module.exports = router;
