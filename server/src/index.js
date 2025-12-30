const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/zerodha", require("./routes/zerodhaRoutes"));
app.use("/api/gold", require("./routes/goldRoutes"));
app.use("/api/portfolio", require("./routes/portfolioRoutes"));

// Handle Redirect from Zerodha (Matches user's verified config)
const { handleDirectRedirect } = require("./controllers/zerodhaController");
app.get("/auth/zerodha/callback", handleDirectRedirect);

// Basic route
app.get("/", (req, res) => {
  res.send("Stock Connect API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API Key: ${process.env.ZERODHA_API_KEY ? "Loaded" : "Missing"}`);
});
