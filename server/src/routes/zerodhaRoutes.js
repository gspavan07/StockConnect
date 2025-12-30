const express = require("express");
const router = express.Router();
const {
  getLoginUrl,
  handleCallback,
  fetchHoldings,
  handleDirectRedirect,
} = require("../controllers/zerodhaController");

router.get("/login", getLoginUrl);
router.post("/callback", handleCallback); // For clean frontend post
router.get("/holdings", fetchHoldings);

// Direct Redirect Route matching User's config: /auth/zerodha/callback
// NOTE: This usually needs to be mounted at root level or we change the mount point in index.js
// Since index.js mounts this router at /api/zerodha, this current file handles /api/zerodha/...
// The User needs /auth/zerodha/callback.
// We should export the handler and mount it separately in index.js OR
// add a special route here and ask user to use /api/zerodha if possible.
// BUT, the user's error URL was localhost:5001/auth/zerodha/callback. this means index.js needs a new route.

module.exports = router;
