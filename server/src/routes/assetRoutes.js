const express = require('express');
const router = express.Router();
const { getAssets, addAsset } = require('../controllers/assetController');

router.get('/', getAssets);
router.post('/', addAsset);

module.exports = router;
