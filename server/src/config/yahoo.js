const yahooFinance = require('yahoo-finance2').default;

// Suppress console notice about API key missing if it appears
yahooFinance._opts = { ...yahooFinance._opts, logger: { info: () => {}, warn: () => {}, error: console.error } };

module.exports = yahooFinance;
