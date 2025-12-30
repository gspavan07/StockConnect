const KiteConnect = require("kiteconnect").KiteConnect;
const Asset = require("../models/Asset");

let kiteInstance = null;

// Initialize Kite Connect instance with API Key
const getKiteInstance = () => {
  console.log("[Zerodha] Initializing Kite Instance...");
  if (!kiteInstance && process.env.ZERODHA_API_KEY) {
    kiteInstance = new KiteConnect({
      api_key: process.env.ZERODHA_API_KEY,
    });
    console.log("[Zerodha] Kite Instance Created.");
  }
  return kiteInstance;
};

// @desc    Generate Login URL
// @route   GET /api/zerodha/login
// @access  Public
const getLoginUrl = (req, res) => {
  try {
    const kc = getKiteInstance();
    if (!kc) {
      return res
        .status(500)
        .json({ message: "Zerodha API Key not configured" });
    }
    const loginUrl = kc.getLoginURL();
    res.json({ loginUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper logic for exchanging token
const performLogin = async (requestToken) => {
  const kc = getKiteInstance();
  if (!kc) throw new Error("Zerodha API Key not configured");
  if (!process.env.ZERODHA_API_SECRET)
    throw new Error("Zerodha API Secret not configured");

  const response = await kc.generateSession(
    requestToken,
    process.env.ZERODHA_API_SECRET
  );
  kc.setAccessToken(response.access_token);
  return response;
};

// @desc    Callback for Zerodha Login (POST from Frontend)
// @route   POST /api/zerodha/callback
// @access  Public
const handleCallback = async (req, res) => {
  try {
    const { requestToken } = req.body;
    const response = await performLogin(requestToken);

    res.json({
      message: "Logged in successfully",
      accessToken: response.access_token,
      publicToken: response.public_token,
    });
  } catch (error) {
    console.error("Zerodha Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle Direct GET Redirect from Zerodha
// @route   GET /auth/zerodha/callback
// @access  Public
const handleDirectRedirect = async (req, res) => {
  try {
    const { request_token, status } = req.query;

    if (status !== "success") {
      return res.redirect("http://localhost:5173/?error=zerodha_failed");
    }

    await performLogin(request_token);

    // Populate holdings immediately
    await fetchHoldingsInternal(); // internal call

    // Redirect to Frontend
    res.redirect("http://localhost:5173/");
  } catch (error) {
    console.error("Direct Redirect Error:", error);
    res.redirect(
      `http://localhost:5173/?error=${encodeURIComponent(error.message)}`
    );
  }
};

// Internal helper to fetch holdings without req/res
const fetchHoldingsInternal = async () => {
  const kc = getKiteInstance();
  if (!kc || !kc.access_token) return;

  try {
    const holdings = await kc.getHoldings();
    console.log(`[Zerodha] Fetched ${holdings.length} raw holdings.`);

    for (const holding of holdings) {
      // DEBUG: Print FULL holding object to see structure
      console.log(`[Zerodha FULL DEBUG] ${JSON.stringify(holding)}`);

      console.log(
        `[Zerodha] Processing: ${holding.tradingsymbol} | ISIN: ${holding.isin} | Exchange: ${holding.exchange}`
      );
      let type = "STOCK";

      // Heuristic for Mutual Funds vs Stocks in India (Zerodha/CDSL/NSDL)
      // Stocks usually start with INE, Mutual Funds with INF
      if (holding.isin && holding.isin.startsWith("INF")) {
        type = "MF";
      } else if (holding.exchange === "BSE" || holding.exchange === "NSE") {
        type = "STOCK";
      } else {
        console.log(
          `[Zerodha] Unknown exchange or ISIN for: ${holding.tradingsymbol}`
        );
      }

      console.log(`[Zerodha] Saved as: ${type}`);

      await Asset.findOneAndUpdate(
        { symbol: holding.tradingsymbol, type: type },
        {
          symbol: holding.tradingsymbol,
          name: holding.fund || holding.tradingsymbol,
          type: type,
          quantity: holding.quantity,
          averagePrice: holding.average_price,
          investedValue: holding.average_price * holding.quantity,
          source: "ZERODHA",
          lastUpdated: Date.now(),
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error("Error auto-fetching holdings:", err);
  }

  // 2. Fetch Mutual Fund Holdings
  try {
    console.log("[Zerodha] Calling getMFHoldings()...");
    const mfHoldings = await kc.getMFHoldings();
    console.log(
      `[Zerodha] Fetched ${mfHoldings.length} MF holdings. Raw:`,
      JSON.stringify(mfHoldings)
    );

    for (const mf of mfHoldings) {
      console.log(`[Zerodha MF DEBUG] ${JSON.stringify(mf)}`);

      // Zerodha might provide last_price, pnl, or other fields
      // Let's use whatever current price data they provide
      const currentPrice = mf.last_price || mf.average_price;

      await Asset.findOneAndUpdate(
        { symbol: mf.tradingsymbol, type: "MF" },
        {
          symbol: mf.tradingsymbol,
          name: mf.fund || mf.tradingsymbol,
          type: "MF",
          quantity: mf.quantity,
          averagePrice: mf.average_price,
          currentPrice: currentPrice, // Store current price if available
          investedValue: mf.average_price * mf.quantity,
          source: "ZERODHA",
          lastUpdated: Date.now(),
        },
        { upsert: true, new: true }
      );
    }
  } catch (mfError) {
    console.error("[Zerodha] MF Fetch Error:", mfError.message);
  }
};

// @desc    Fetch Holdings and Save to DB
// @route   GET /api/zerodha/holdings
// @access  Public (Protected in real app)
const fetchHoldings = async (req, res) => {
  try {
    const kc = getKiteInstance();
    if (!kc || !kc.access_token) {
      return res
        .status(401)
        .json({ message: "Zerodha session not active. Please login again." });
    }

    const holdings = await kc.getHoldings(); // This might recurse if we use internal func? No, duplicate logic is fine here or refactor.
    // Let's call internal to ensure consistency
    await fetchHoldingsInternal();

    // Return the latest from DB or simple success
    // The user asked to just sync.
    res.json({ message: `Holdings Synced` });
  } catch (error) {
    console.error("Fetch Holdings Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getKiteInstance,
  getLoginUrl,
  handleCallback,
  handleDirectRedirect,
  fetchHoldings,
};
