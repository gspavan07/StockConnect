// Test script for SafeGold scraper
const {
  fetchSafeGoldPrice,
  fetchGoldPriceWithFallback,
} = require("./src/utils/safeGoldScraper");

async function test() {
  console.log("Testing SafeGold scraper...\n");

  try {
    const price = await fetchGoldPriceWithFallback();
    console.log(
      `\n✅ Success! Current 24K gold price: ₹${price.toFixed(2)}/gram`
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

test();
