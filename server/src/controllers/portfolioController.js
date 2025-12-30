const Asset = require("../models/Asset");
const { updatePrices } = require("../utils/priceEngine");

// @desc    Get Portfolio Dashboard Data (Aggregated)
// @route   GET /api/portfolio
// @access  Public
const getPortfolio = async (req, res) => {
  try {
    const assets = await Asset.find();

    // Trigger price update (async or await depending on perf needs)
    // For personal use, awaiting is fine for accurate data
    const livePrices = await updatePrices(assets);

    let totalInvested = 0;
    let currentValue = 0;

    // Separate gold assets for aggregation
    const goldAssets = assets.filter((a) => a.type === "GOLD");
    const nonGoldAssets = assets.filter((a) => a.type !== "GOLD");

    // Process non-gold assets normally
    const portfolio = nonGoldAssets.map((asset) => {
      const liveRate = livePrices[asset.symbol] || asset.averagePrice;
      const currentAssetValue = liveRate * asset.quantity;

      totalInvested += asset.investedValue;
      currentValue += currentAssetValue;

      return {
        ...asset.toObject(),
        livePrice: liveRate,
        currentValue: currentAssetValue,
        pnl: currentAssetValue - asset.investedValue,
        pnlPercent:
          asset.investedValue > 0
            ? ((currentAssetValue - asset.investedValue) /
                asset.investedValue) *
              100
            : 0,
      };
    });

    // Aggregate all gold holdings into one entry
    if (goldAssets.length > 0) {
      let totalGoldQuantity = 0;
      let totalGoldInvested = 0;
      let totalGoldCurrentValue = 0;

      goldAssets.forEach((goldAsset) => {
        const liveRate = livePrices[goldAsset.symbol] || goldAsset.averagePrice;
        const currentAssetValue = liveRate * goldAsset.quantity;

        totalGoldQuantity += goldAsset.quantity;
        totalGoldInvested += goldAsset.investedValue;
        totalGoldCurrentValue += currentAssetValue;
      });

      totalInvested += totalGoldInvested;
      currentValue += totalGoldCurrentValue;

      // Calculate weighted average price
      const avgGoldPrice =
        totalGoldQuantity > 0 ? totalGoldInvested / totalGoldQuantity : 0;
      const liveGoldPrice =
        totalGoldQuantity > 0 ? totalGoldCurrentValue / totalGoldQuantity : 0;

      // Create aggregated gold entry
      const aggregatedGold = {
        _id: "AGGREGATED_GOLD",
        symbol: "GOLD_TOTAL",
        name: `Gold Holdings (${goldAssets.length} ${
          goldAssets.length === 1 ? "entry" : "entries"
        })`,
        type: "GOLD",
        source: "AGGREGATED",
        quantity: totalGoldQuantity,
        averagePrice: avgGoldPrice,
        investedValue: totalGoldInvested,
        livePrice: liveGoldPrice,
        currentValue: totalGoldCurrentValue,
        pnl: totalGoldCurrentValue - totalGoldInvested,
        pnlPercent:
          totalGoldInvested > 0
            ? ((totalGoldCurrentValue - totalGoldInvested) /
                totalGoldInvested) *
              100
            : 0,
      };

      portfolio.push(aggregatedGold);
    }

    const totalPnl = currentValue - totalInvested;
    const totalPnlPercent =
      totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    // Check Zerodha status
    const { getKiteInstance } = require("./zerodhaController");
    const kc = getKiteInstance();
    const isZerodhaConnected = !!(kc && kc.access_token);

    res.json({
      summary: {
        totalInvested,
        currentValue,
        totalPnl,
        totalPnlPercent,
        isZerodhaConnected,
      },
      assets: portfolio,
    });
  } catch (error) {
    console.error("Portfolio Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPortfolio };
