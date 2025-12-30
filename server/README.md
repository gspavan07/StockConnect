# ⚙️ StockConnect Backend

The backend engine for StockConnect, handling data synchronization, API integrations, and portfolio calculations.

## 🚀 Features

- **API Integrations**: Connects with Zerodha (Kite) and SmartAPI (Angel One).
- **Data Synchronization**: Automated price fetching using Yahoo Finance and web scraping.
- **Scheduled Tasks**: Periodic updates via `node-cron`.
- **Growth Tracking**: Aggregates daily portfolio snapshots for historical analysis.
- **Secure Authentication**: Supports TOTP for API login.

## 🛠️ Tech Stack

- **Node.js** (Express)
- **MongoDB** (Mongoose)
- **Kite Connect / SmartAPI** (Broker APIs)
- **Yahoo Finance 2** (Market Data)
- **Node-cron** (Task Scheduling)
- **Otplib** (Authenticator/TOTP)

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in your credentials.

```bash
cp .env.example .env
```

## 🏃 Running the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## 📁 Key Directories

- `src/models`: Database schemas.
- `src/routes`: API endpoint definitions.
- `src/controllers`: Request handling logic.
- `src/scripts`: One-off or periodic data import scripts.
