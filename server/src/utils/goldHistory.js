const axios = require("axios");

/**
 * Fetch historical gold rates from SafeGold
 * @param {string} startDate - Start date in YYYY-MM-DD
 * @param {string} endDate - End date in YYYY-MM-DD
 * @returns {Promise<Array>} Array of { date, rate }
 */
const fetchGoldHistory = async (startDate, endDate) => {
  try {
    const url = `https://www.safegold.com/user-trends/gold-rates?start_date=${startDate}&end_date=${endDate}&frequency=d`;
    console.log(`[SafeGold] Fetching history from ${startDate} to ${endDate}`);

    const response = await axios.get(url);
    if (response.data && response.data.data) {
      return response.data.data.map((item) => ({
        date: item.date,
        rate: parseFloat(item.rate),
      }));
    }
    return [];
  } catch (error) {
    console.error("[SafeGold] Error fetching history:", error.message);
    return [];
  }
};

module.exports = { fetchGoldHistory };
