# Stock Connect - Personal Investment Dashboard

This project is a personal investment tracking dashboard designed to consolidate stocks (Zerodha), mutual funds (Zerodha Coin), and digital gold (PhonePe) into a single view.

## Project Structure

- **client/**: React 18 + Vite frontend application.
  - **src/components**: Reusable UI components.
  - **src/pages**: Page views (Dashboard, Holdings, etc.).
  - **src/api**: Axios instances and API services.
  - **src/utils**: Helper functions.
  
- **server/**: Node.js + Express backend application.
  - **src/config**: Database and other configuration files.
  - **src/models**: Mongoose schemas (Asset, Price, Transaction).
  - **src/routes**: API endpoints.
  - **src/controllers**: Request handlers.
  - **src/utils**: shared utilities.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Recharts, Axios
- **Backend**: Node.js, Express, MongoDB
- **Data**: Zerodha APIs, MF APIs, Manual Import

## Getting Started

1. **Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
