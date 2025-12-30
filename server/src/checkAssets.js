const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Asset = require('./models/Asset');

dotenv.config();

const checkAssets = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const assets = await Asset.find({});
    console.log(`Found ${assets.length} assets.`);
    
    assets.forEach(a => {
        console.log(`Symbol: ${a.symbol}, Type: ${a.type}, Source: ${a.source}, Qty: ${a.quantity}, ISIN_Check: ${a.symbol.startsWith('INF') ? 'Maybe' : 'No'}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkAssets();
