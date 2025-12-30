const axios = require("axios");

let isinToAmfiMap = {};
let lastLoaded = 0;

const AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt";
const ONE_DAY = 24 * 60 * 60 * 1000;

async function loadAmfiMaster() {
  // Reload once per day
  if (Date.now() - lastLoaded < ONE_DAY && Object.keys(isinToAmfiMap).length) {
    return;
  }

  console.log("[AMFI] Loading AMFI master file...");
  const res = await axios.get(AMFI_URL, { timeout: 15000 });

  const lines = res.data.split("\n");

  isinToAmfiMap = {};

  for (const line of lines) {
    const parts = line.split(";");

    if (parts.length < 4) continue;

    const amfiCode = parts[0].trim();

    // Detect ISINs dynamically
    for (const field of parts) {
      const val = field.trim();
      if (/^INF[A-Z0-9]{9}$/.test(val)) {
        isinToAmfiMap[val] = amfiCode;
      }
    }
  }

  lastLoaded = Date.now();
  console.log(
    `[AMFI] Loaded ${Object.keys(isinToAmfiMap).length} ISIN mappings`
  );
}

async function getAmfiCodeFromISIN(isin) {
  if (!isin) return null;
  await loadAmfiMaster();
  return isinToAmfiMap[isin] || null;
}

module.exports = { getAmfiCodeFromISIN };
