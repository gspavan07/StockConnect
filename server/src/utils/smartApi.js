const { SmartAPI } = require("smartapi-javascript");
const { totp } = require("otplib");

let smartInstance = null;
let sessionData = null;
let initPromise = null;
let lastFailedAt = 0;

const getSmartInstance = async (retry = true) => {
  if (smartInstance && sessionData) return smartInstance;

  // Prevent multiple simultaneous login attempts
  if (initPromise) return initPromise;

  // Cooldown if last attempt failed recently (prevent loop)
  if (Date.now() - lastFailedAt < 300000 && !retry) {
    console.warn("[SmartAPI] Skipping login due to recent failure (cooldown)");
    return null;
  }

  const {
    SMARTAPI_CLIENT_ID,
    SMARTAPI_PASSWORD,
    SMARTAPI_API_KEY,
    SMARTAPI_TOTP_SECRET,
  } = process.env;

  if (
    !SMARTAPI_CLIENT_ID ||
    !SMARTAPI_PASSWORD ||
    !SMARTAPI_API_KEY ||
    !SMARTAPI_TOTP_SECRET
  ) {
    console.warn("[SmartAPI] Missing credentials in .env");
    return null;
  }

  initPromise = (async () => {
    try {
      const smartApi = new SmartAPI({
        api_key: SMARTAPI_API_KEY,
      });
      totp.options = { window: 1 };
      const token = totp.generate(SMARTAPI_TOTP_SECRET);

      const response = await smartApi.generateSession(
        SMARTAPI_CLIENT_ID,
        SMARTAPI_PASSWORD,
        token
      );

      if (response.status) {
        smartInstance = smartApi;
        sessionData = response.data;
        console.log("[SmartAPI] Session generated successfully");
        initPromise = null;
        return smartInstance;
      } else {
        const errorMsg = response.message || "Unknown error";
        console.error("[SmartAPI] Session failed:", errorMsg);

        // If TOTP failed, retry once after 1 second (might be timing issue)
        if (
          retry &&
          typeof errorMsg === "string" &&
          errorMsg.toLowerCase().includes("totp")
        ) {
          console.log("[SmartAPI] Retrying TOTP in 1s...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          initPromise = null;
          return getSmartInstance(false);
        }

        lastFailedAt = Date.now();
        initPromise = null;
        return null;
      }
    } catch (error) {
      console.error("[SmartAPI] Connection error:", error.message);
      lastFailedAt = Date.now();
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
};

const axios = require("axios");

/**
 * Fetch historical candles for a symbol
 * @param {string} symbol - Equity symbol (e.g., SBIN)
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate - YYYY-MM-DD
 * @param {string} interval - ONE_DAY, ONE_MINUTE, etc.
 * @returns {Promise<Array>}
 */
const fetchHistoricalData = async (
  symbol,
  fromDate,
  toDate,
  interval = "ONE_DAY"
) => {
  const api = await getSmartInstance();
  if (!api) return [];

  try {
    const scripInfo = await getSymbolToken(symbol);
    if (!scripInfo) {
      console.warn(`[SmartAPI] No token found for ${symbol}`);
      return [];
    }

    // Angel One format: YYYY-MM-DD HH:mm
    const params = {
      exchange: scripInfo.exchange,
      symboltoken: scripInfo.token,
      interval: interval,
      fromdate: fromDate + " 09:15",
      todate: toDate + " 15:30",
    };

    console.log(`[SmartAPI] Requesting candles for ${symbol}:`, params);
    const response = await api.getCandleData(params);

    if (response.status && response.data) {
      console.log(
        `[SmartAPI] Successfully fetched ${response.data.length} candles for ${symbol}`
      );
      return response.data; // [[time, open, high, low, close, volume], ...]
    } else {
      console.warn(
        `[SmartAPI] Candle API failed for ${symbol}:`,
        response.message || "Unknown error"
      );
      return [];
    }
  } catch (error) {
    console.error(
      `[SmartAPI] Candle fetch error for ${symbol}:`,
      error.message
    );
    return [];
  }
};

let scripMaster = null;

const getSymbolToken = async (symbol, retry = true) => {
  try {
    if (!scripMaster) {
      console.log("[SmartAPI] Downloading scrip master...");
      try {
        const response = await axios.get(
          "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
          { timeout: 10000 }
        );
        scripMaster = response.data;
      } catch (err) {
        if (retry) {
          console.log("[SmartAPI] Scrip master download failed, retrying...");
          return getSymbolToken(symbol, false);
        }
        throw err;
      }
    }

    // Try NSE first (Primary)
    let scrip = scripMaster.find(
      (s) =>
        s.symbol.toUpperCase() === `${symbol.toUpperCase()}-EQ` &&
        s.exch_seg === "NSE"
    );

    // Try BSE if NSE not found (Secondary)
    if (!scrip) {
      scrip = scripMaster.find(
        (s) =>
          s.symbol.toUpperCase() === symbol.toUpperCase() &&
          s.exch_seg === "BSE"
      );
    }

    // Final loose search if still not found
    if (!scrip) {
      scrip = scripMaster.find(
        (s) =>
          s.name.toUpperCase().includes(symbol.toUpperCase()) &&
          (s.exch_seg === "NSE" || s.exch_seg === "BSE")
      );
    }

    if (scrip) {
      console.log(
        `[SmartAPI] Found token for ${symbol}: ${scrip.token} (${scrip.exch_seg})`
      );
      return { token: scrip.token, exchange: scrip.exch_seg };
    }

    return null;
  } catch (error) {
    console.error("[SmartAPI] Error in token lookup:", error.message);
    return null;
  }
};

module.exports = { fetchHistoricalData };
