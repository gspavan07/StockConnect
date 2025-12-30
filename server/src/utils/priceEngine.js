const axios = require("axios");
const Price = require("../models/Price");

// Cache duration in minutes (to avoid hitting limits)
const CACHE_DURATION_MINUTES = 0; // DEBUG: Force Fetch

// Fetch Live Gold Price (XAU-INR)
// Using a free API service like metals-api or simplified logical scrape/mock for now
// Since reliable free Gold APIs are rare, we will mock a realistic price or use a free public endpoint if available.
// For this project, let's use a reliable scraping endpoint or a placeholder that updates slightly.
// Actually, 'mfapi.in' doesn't do gold.
// We will use a mock function that varies slightly around basic market rate (e.g., ~6500/g) to simulate live data
// OR we can fetch from a generic free finance API if provided.
// Let's implement a 'Mock' that is stable for 'Personal Use' as requested (Free APIs often die).
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { fetchGoldPriceWithFallback } = require("./safeGoldScraper");

const fetchGoldPrice = async () => {
  try {
    // Use SafeGold scraper with fallback to Yahoo Finance
    const price = await fetchGoldPriceWithFallback();
    return price;
  } catch (e) {
    console.error("Gold Price Fetch Error:", e.message);
    // Final fallback
    return 7200;
  }
};

// Map ISIN to AMFI Scheme Code using mfapi.in search
const { getAmfiCodeFromISIN } = require("../utils/amfiMapper");

const fetchStockPrice = async (symbol) => {
  // 2. Try Yahoo Finance (Free API, ~15min delay)
  try {
    const yahooSymbol = `${symbol}.NS`; // Assume NSE
    console.log(`[PriceEngine] Fetching Yahoo for: ${yahooSymbol}`);
    const quote = await yahooFinance.quote(yahooSymbol);

    if (quote && quote.regularMarketPrice) {
      console.log(
        `[PriceEngine] Yahoo Finance result for ${symbol}: ${quote.regularMarketPrice}`
      );
      return quote.regularMarketPrice;
    } else {
      console.log(`[PriceEngine] Yahoo No Result for ${yahooSymbol}`);
    }
  } catch (error) {
    console.error(`Yahoo fetch error for ${symbol}:`, error.message);
  }

  // 3. Last Resort Mock
  console.log(`[PriceEngine] Fallback Mock for ${symbol}`);
  return 100 + symbol.length * 10;
};

// Main function to update prices for a list of symbols
const updatePrices = async (assets) => {
  const prices = {};

  for (const asset of assets) {
    let price = null;

    // Skip if recently updated (Naive caching handled here or in caller)
    // Check DB for recent price
    const cachedPrice = await Price.findOne({
      symbol: asset.symbol,
      type: asset.type,
    });
    if (cachedPrice) {
      const diffMs = Date.now() - cachedPrice.lastFetched;
      const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
      if (diffMins < CACHE_DURATION_MINUTES) {
        prices[asset.symbol] = cachedPrice.price;
        continue; // Use cached
      }
    }

    if (asset.type === "GOLD") {
      price = await fetchGoldPrice();
    } else if (asset.type === "MF") {
      // asset.isin should come from Zerodha MF holdings
      const amfiCode = await getAmfiCodeFromISIN(asset.symbol);

      if (amfiCode) {
        console.log(`[MF] ISIN ${asset.symbol} → AMFI ${amfiCode}`);

        // Optional: Fetch NAV using mfapi.in
        try {
          const navRes = await axios.get(`https://api.mfapi.in/mf/${amfiCode}`);
          const nav = navRes.data?.data?.[0]?.nav;
          if (nav) {
            price = Number(nav);
          }
        } catch (e) {
          console.error("[MF] NAV fetch failed", e.message);
        }
      }

      // Final fallback
      if (!price) {
        price = asset.currentPrice || asset.averagePrice;
      }
    } else if (asset.type === "STOCK") {
      price = await fetchStockPrice(asset.symbol);
    }

    if (price) {
      // Update DB
      await Price.findOneAndUpdate(
        { symbol: asset.symbol, type: asset.type },
        {
          symbol: asset.symbol,
          type: asset.type,
          price: price,
          lastFetched: Date.now(),
        },
        { upsert: true }
      );
      prices[asset.symbol] = price;
    }
  }
  return prices;
};

module.exports = {
  updatePrices,
};
