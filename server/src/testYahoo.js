const yahooFinance = require('yahoo-finance2').default;

(async () => {
    try {
        console.log('Testing Yahoo Finance fetch for SBIN.NS...');
        const quote = await yahooFinance.quote('SBIN.NS');
        console.log('Result:', quote);
    } catch (e) {
        console.error('Error:', e);
    }
})();
