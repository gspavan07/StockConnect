const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Scrape live 24K gold price from SafeGold.com
 * @returns {Promise<number>} Price per gram in INR
 */
const fetchSafeGoldPrice = async () => {
  try {
    console.log("[SafeGold] Fetching live 24K gold price...");

    // Fetch the SafeGold homepage
    const response = await axios.get("https://www.safegold.com", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 10000,
    });

    const html = response.data;
    let price = null;

    // Strategy 1: Extract from global JavaScript variable 'var bp'
    // SafeGold embeds the base price in the page as: var bp = "13916.09";
    const bpMatch = html.match(/var\s+bp\s*=\s*["']([0-9.]+)["']/);
    if (bpMatch) {
      const parsedPrice = parseFloat(bpMatch[1]);
      // Sanity check: Gold price should be between ₹5000 and ₹20000 per gram
      if (parsedPrice >= 5000 && parsedPrice <= 20000) {
        price = parsedPrice;
        console.log(`[SafeGold] Found price from 'var bp': ₹${price}/g`);
        return price;
      }
    }

    // Strategy 2: Parse the HTML with cheerio as fallback
    const $ = cheerio.load(html);

    // Look for the price in the .livePrice_buy h4 span element
    const priceElement = $(".livePrice_buy h4 span").first();
    if (priceElement.length) {
      const text = priceElement.text().trim();
      const priceMatch = text.match(/([0-9,]+(?:\.[0-9]{1,2})?)/);
      if (priceMatch) {
        const parsedPrice = parseFloat(priceMatch[1].replace(/,/g, ""));
        if (parsedPrice >= 5000 && parsedPrice <= 20000) {
          price = parsedPrice;
          console.log(`[SafeGold] Found price from DOM: ₹${price}/g`);
          return price;
        }
      }
    }

    // Strategy 3: Look for any text containing "₹" followed by numbers
    $("*").each((i, elem) => {
      if (price) return; // Already found

      const text = $(elem).text().trim();
      const priceMatch = text.match(
        /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:\/g|per\s*g|gram)?/i
      );

      if (priceMatch) {
        const priceStr = priceMatch[1].replace(/,/g, "");
        const parsedPrice = parseFloat(priceStr);

        // Sanity check: Gold price should be between ₹5000 and ₹20000 per gram
        if (parsedPrice >= 5000 && parsedPrice <= 20000) {
          price = parsedPrice;
          console.log(`[SafeGold] Found price from text: ₹${price}/g`);
        }
      }
    });

    if (price) {
      console.log(
        `[SafeGold] Successfully fetched 24K gold price: ₹${price}/g`
      );
      return price;
    }

    console.warn("[SafeGold] Could not find price on page, using fallback");
    throw new Error("Price not found on SafeGold page");
  } catch (error) {
    console.error("[SafeGold] Scraping error:", error.message);
    throw error;
  }
};

/**
 * Fetch gold price with fallback to Yahoo Finance
 * @returns {Promise<number>} Price per gram in INR
 */
const fetchGoldPriceWithFallback = async () => {
  try {
    // Try SafeGold first
    const price = await fetchSafeGoldPrice();
    return price;
  } catch (error) {
    console.warn("[SafeGold] Failed, falling back to Yahoo Finance");

    // Fallback to Yahoo Finance
    try {
      const YahooFinance = require("yahoo-finance2").default;
      const yahooFinance = new YahooFinance({
        suppressNotices: ["yahooSurvey"],
      });

      const quote = await yahooFinance.quote("XAUINR=X");
      if (quote && quote.regularMarketPrice) {
        const pricePerOunce = quote.regularMarketPrice;
        const pricePerGram = pricePerOunce / 31.1034768;
        console.log(`[Yahoo] Gold price: ₹${pricePerGram.toFixed(2)}/g`);
        return pricePerGram;
      }
    } catch (yahooError) {
      console.error("[Yahoo] Fetch error:", yahooError.message);
    }

    // Final fallback - approximate market rate
    console.warn("[Gold] Using fallback price");
    return 7200;
  }
};

module.exports = {
  fetchSafeGoldPrice,
  fetchGoldPriceWithFallback,
};
