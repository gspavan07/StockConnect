const Asset = require("../models/Asset");
const Transaction = require("../models/Transaction");
const { fetchGoldHistory } = require("../utils/goldHistory");
const { fetchHistoricalData } = require("../utils/smartApi");
const axios = require("axios");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/**
 * @desc    Get Growth Analysis Data
 * @route   GET /api/analysis/growth
 */
const getGrowthAnalysis = async (req, res) => {
  try {
    const assets = await Asset.find();
    const transactions = await Transaction.find().sort({ date: 1 });

    if (assets.length === 0) {
      return res.json({ data: [] });
    }

    // Determine range: Start from 1 year ago or earliest transaction
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    let earliestTxDate =
      transactions.length > 0 ? new Date(transactions[0].date) : new Date();
    const startDate = earliestTxDate < oneYearAgo ? earliestTxDate : oneYearAgo;
    const endDate = new Date();

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // 1. Fetch Historical Gold Data
    const goldHistory = await fetchGoldHistory(startDateStr, endDateStr);
    const goldPriceMap = {};
    goldHistory.forEach((h) => (goldPriceMap[h.date] = h.rate));

    // 2. Fetch Historical Stock/MF Data
    const historicalData = {}; // { symbol: { date: price } }
    console.log(
      `[Analysis] Processing ${assets.length} assets from ${startDateStr} to ${endDateStr}`
    );

    for (const asset of assets) {
      if (asset.type === "STOCK") {
        console.log(
          `[Analysis] Fetching historical data for STOCK: ${asset.symbol}`
        );
        try {
          // Use our new SmartAPI utility
          const candles = await fetchHistoricalData(
            asset.symbol,
            startDateStr,
            endDateStr
          );

          if (candles && candles.length > 0) {
            console.log(
              `[Analysis] Fetched ${candles.length} candles for ${asset.symbol}`
            );
            historicalData[asset.symbol] = {};
            candles.forEach((candle) => {
              // candle: [time, open, high, low, close, volume]
              const dateStr = new Date(candle[0]).toISOString().split("T")[0];
              historicalData[asset.symbol][dateStr] = candle[4]; // closing price
            });
          } else {
            console.warn(
              `[Analysis] No candles returned for ${asset.symbol} from SmartAPI, trying Yahoo fallback...`
            );
            throw new Error("Empty candles");
          }
        } catch (e) {
          console.error(
            `[Analysis] SmartAPI failed for ${asset.symbol}, falling back to Yahoo:`,
            e.message
          );
          try {
            // Default to NSE (.NS)
            const yahooSymbol = `${asset.symbol}.NS`;
            console.log(
              `[Analysis] Trying Yahoo Finance for ${yahooSymbol}...`
            );

            const result = await yahooFinance.chart(yahooSymbol, {
              period1: startDateStr,
              period2: endDateStr,
              interval: "1d",
            });

            if (result && result.quotes) {
              historicalData[asset.symbol] = {};
              result.quotes.forEach((quote) => {
                if (quote.date && quote.close !== undefined) {
                  const dateStr = quote.date.toISOString().split("T")[0];
                  historicalData[asset.symbol][dateStr] = quote.close;
                }
              });
              console.log(
                `[Analysis] Yahoo NSE successful for ${asset.symbol}: ${result.quotes.length} points`
              );
            }
          } catch (ye) {
            // Try BSE (.BO) as fallback
            try {
              const bseSymbol = `${asset.symbol}.BO`;
              console.log(
                `[Analysis] Trying Yahoo Finance for ${bseSymbol}...`
              );
              const bseResult = await yahooFinance.chart(bseSymbol, {
                period1: startDateStr,
                period2: endDateStr,
                interval: "1d",
              });
              if (bseResult && bseResult.quotes) {
                historicalData[asset.symbol] = {};
                bseResult.quotes.forEach((quote) => {
                  if (quote.date && quote.close !== undefined) {
                    const dateStr = quote.date.toISOString().split("T")[0];
                    historicalData[asset.symbol][dateStr] = quote.close;
                  }
                });
                console.log(
                  `[Analysis] Yahoo BSE successful for ${asset.symbol}`
                );
              }
            } catch (be) {
              console.error(
                `[Analysis] All Yahoo fallbacks failed for ${asset.symbol}`
              );
            }
          }
        }
      } else if (asset.type === "MF") {
        console.log(
          `[Analysis] Fetching historical data for MF: ${asset.name} (${asset.symbol})`
        );
        try {
          const { getAmfiCodeFromISIN } = require("../utils/amfiMapper");
          const amfiCode = await getAmfiCodeFromISIN(asset.symbol);
          if (amfiCode) {
            const mfRes = await axios.get(
              `https://api.mfapi.in/mf/${amfiCode}`
            );
            historicalData[asset.symbol] = {};
            if (mfRes.data && mfRes.data.data) {
              mfRes.data.data.forEach((navItem) => {
                const [d, m, y] = navItem.date.split("-");
                const dateStr = `${y}-${m}-${d}`;
                historicalData[asset.symbol][dateStr] = parseFloat(navItem.nav);
              });
              console.log(
                `[Analysis] Fetched ${mfRes.data.data.length} NAV points for ${asset.name}`
              );
            }
          } else {
            console.warn(
              `[Analysis] No AMFI code found for ISIN: ${asset.symbol}`
            );
          }
        } catch (e) {
          console.error(`[Analysis] MF error for ${asset.symbol}:`, e.message);
        }
      }
    }

    // 3. BASELINE CALCULATION
    // If we don't have full transaction history, we need to know
    // what the balance was on the startDate.
    const initialBalances = {}; // { assetId: { quantity, investedValue } }

    for (const asset of assets) {
      // Current state
      let runningQty = asset.quantity;
      let runningInvested = asset.investedValue;

      // Transactions after startDate
      const laterTxs = transactions.filter(
        (t) =>
          t.asset.toString() === asset._id.toString() &&
          new Date(t.date) >= startDate
      );

      // Backtrack from current state to startDate
      laterTxs.forEach((tx) => {
        if (tx.type === "BUY") {
          runningQty -= tx.quantity;
          runningInvested -= tx.quantity * tx.price;
        } else {
          runningQty += tx.quantity;
          // For selling, we usually reduce invested value by weighted avg...
          // but backtracking is complex without full history.
          // Estimating based on current avg price for Sell backtracking.
          runningInvested += tx.quantity * asset.averagePrice;
        }
      });

      initialBalances[asset._id.toString()] = {
        quantity: Math.max(0, runningQty),
        investedValue: Math.max(0, runningInvested),
      };
    }

    // 4. Reconstruct Portfolio Day-by-Day
    const dailyDataRaw = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const assetBalances = JSON.parse(JSON.stringify(initialBalances));
    let txIndex = 0;
    // Skip transactions before startDate since we back-calculated their effect
    while (
      txIndex < transactions.length &&
      new Date(transactions[txIndex].date) < startDate
    ) {
      txIndex++;
    }

    let lastKnownPrices = {};

    // Pre-populate lastKnownPrices with the earliest available price in our historical record
    for (const asset of assets) {
      if (asset.type === "GOLD") {
        // Find first available gold rate
        const firstGold = goldHistory.find((h) => h.rate > 0);
        if (firstGold) lastKnownPrices[asset._id.toString()] = firstGold.rate;
      } else {
        const prices = historicalData[asset.symbol] || {};
        const firstDate = Object.keys(prices).sort()[0];
        if (firstDate)
          lastKnownPrices[asset._id.toString()] = prices[firstDate];
      }
    }

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Update balances with transactions that happened on this day
      while (
        txIndex < transactions.length &&
        new Date(transactions[txIndex].date).toISOString().split("T")[0] ===
          dateStr
      ) {
        const tx = transactions[txIndex];
        const assetId = tx.asset.toString();

        if (tx.type === "BUY") {
          assetBalances[assetId].quantity += tx.quantity;
          assetBalances[assetId].investedValue += tx.quantity * tx.price;
        } else {
          const avgPrice =
            assetBalances[assetId].quantity > 0
              ? assetBalances[assetId].investedValue /
                assetBalances[assetId].quantity
              : 0;
          assetBalances[assetId].quantity -= tx.quantity;
          assetBalances[assetId].investedValue -= tx.quantity * avgPrice;
        }
        txIndex++;
      }

      // Calculate total value for today
      let totalValue = 0;
      let totalInvested = 0;
      let assetBreakdown = [];

      for (const assetId in assetBalances) {
        const balance = assetBalances[assetId];
        if (balance.quantity <= 0) continue;

        const asset = assets.find((a) => a._id.toString() === assetId);
        let price = 0;

        if (asset.type === "GOLD") {
          price = goldPriceMap[dateStr] || lastKnownPrices[assetId] || 0;
        } else {
          price =
            historicalData[asset.symbol]?.[dateStr] ||
            lastKnownPrices[assetId] ||
            0;
        }

        if (price > 0) lastKnownPrices[assetId] = price;

        const currentVal = balance.quantity * price;
        const avgPrice =
          balance.quantity > 0 ? balance.investedValue / balance.quantity : 0;
        totalValue += currentVal;
        totalInvested += balance.investedValue;

        assetBreakdown.push({
          name: asset.name,
          symbol: asset.symbol,
          type: asset.type,
          quantity: balance.quantity,
          price: price,
          avgPrice: parseFloat(avgPrice.toFixed(2)),
          value: parseFloat(currentVal.toFixed(2)),
          invested: parseFloat(balance.investedValue.toFixed(2)),
        });
      }

      dailyDataRaw.push({
        date: dateStr,
        totalValue: parseFloat(totalValue.toFixed(2)),
        investedValue: parseFloat(totalInvested.toFixed(2)),
        profit: parseFloat((totalValue - totalInvested).toFixed(2)),
        assetsBreakdown: assetBreakdown,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filter out leading data points where totalValue is 0 (prevents weird dips at start)
    let firstValidIndex = dailyDataRaw.findIndex((d) => d.totalValue > 0);
    const dailyData =
      firstValidIndex !== -1 ? dailyDataRaw.slice(firstValidIndex) : [];

    console.log(
      `[Analysis] Successfully generated ${dailyData.length} daily growth data points`
    );
    res.json({ data: dailyData });
  } catch (error) {
    console.error("[Analysis Error]", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGrowthAnalysis,
};
