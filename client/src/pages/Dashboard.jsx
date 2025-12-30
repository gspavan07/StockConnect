import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import SummaryCard from "../components/SummaryCard";
import { RefreshCw, Wallet, TrendingUp, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assetFilter, setAssetFilter] = useState("ALL");

  const [lastUpdated, setLastUpdated] = useState(null);

  const syncZerodha = async () => {
    const btn = document.getElementById("sync-btn");
    if (btn) btn.innerText = "Redirecting...";
    try {
      const res = await api.get("/zerodha/login");
      window.location.href = res.data.loginUrl;
    } catch (err) {
      alert("Could not start Zerodha login");
      if (btn) btn.innerText = "Sync Zerodha";
    }
  };

  const fetchData = async () => {
    // Don't set global loading on refresh to avoid flickering
    if (!data) setLoading(true);
    try {
      const res = await api.get("/portfolio");
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter assets based on selected filter - moved before conditional returns
  const filteredAssets = React.useMemo(() => {
    if (!data || !data.assets) return [];
    if (assetFilter === "ALL") return data.assets;
    return data.assets.filter((asset) => asset.type === assetFilter);
  }, [data, assetFilter]);

  // Prepare chart data based on filtered assets - moved before conditional returns
  const chartData = React.useMemo(() => {
    return [
      {
        name: "Stocks",
        value: filteredAssets
          .filter((a) => a.type === "STOCK")
          .reduce((acc, curr) => acc + curr.currentValue, 0),
      },
      {
        name: "Gold",
        value: filteredAssets
          .filter((a) => a.type === "GOLD")
          .reduce((acc, curr) => acc + curr.currentValue, 0),
      },
      {
        name: "Mutual Funds",
        value: filteredAssets
          .filter((a) => a.type === "MF")
          .reduce((acc, curr) => acc + curr.currentValue, 0),
      },
    ].filter((d) => d.value > 0);
  }, [filteredAssets]);

  if (loading && !data)
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <div>
            <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3 items-center">
            <div className="h-8 w-40 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table Skeleton */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-full animate-pulse mx-auto w-64"></div>
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  if (error) return <div className="p-10 text-red-500">Error: {error}</div>;

  const { summary, assets } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Investment Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            {lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : "Check your financial health"}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3 items-center">
          {/* Connection Status Badge */}
          <div
            className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              summary.isZerodhaConnected
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                summary.isZerodhaConnected ? "bg-green-500" : "bg-orange-500"
              }`}
            ></div>
            {summary.isZerodhaConnected
              ? "Zerodha Connected"
              : "Zerodha Disconnected"}
          </div>

          <button
            onClick={() => navigate("/gold")}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition shadow-sm font-medium text-sm"
          >
            Manage Gold
          </button>
          <button
            id="sync-btn"
            onClick={syncZerodha}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm"
          >
            {summary.isZerodhaConnected ? "Re-Sync" : "Sync Zerodha"}
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition shadow-sm"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <SummaryCard
          title="Total Investment"
          value={summary.totalInvested}
          isPositive={true}
        />
        <SummaryCard
          title="Current Value"
          value={summary.currentValue}
          isPositive={summary.totalPnl >= 0}
          subValue={summary.totalPnl}
        />
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <span className="text-gray-500 text-sm font-medium uppercase">
            Overall Returns
          </span>
          <span
            className={`text-4xl font-bold mt-2 ${
              summary.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {summary.totalPnlPercent.toFixed(2)}%
          </span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
          <span className="text-gray-500 text-sm font-medium uppercase">
            Asset Count
          </span>
          <span className="text-4xl font-bold mt-2 text-gray-800">
            {assets.length}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-800">Your Assets</h2>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                  {filteredAssets.length}
                </span>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setAssetFilter("ALL")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    assetFilter === "ALL"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAssetFilter("STOCK")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    assetFilter === "STOCK"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Stocks
                </button>
                <button
                  onClick={() => setAssetFilter("GOLD")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    assetFilter === "GOLD"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Gold
                </button>
                <button
                  onClick={() => setAssetFilter("MF")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    assetFilter === "MF"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Mutual Funds
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Symbol</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold text-right">Qty</th>
                  <th className="p-4 font-semibold text-right">Avg Price</th>
                  <th className="p-4 font-semibold text-right">
                    Current Price
                  </th>
                  <th className="p-4 font-semibold text-right">Value</th>
                  <th className="p-4 font-semibold text-right">Profit/Loss</th>
                  <th className="p-4 font-semibold text-right">P&L %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">
                      {asset.name}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          asset.type === "GOLD"
                            ? "bg-yellow-100 text-yellow-800"
                            : asset.type === "STOCK"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {asset.type}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-600">
                      {asset.quantity}
                    </td>
                    <td className="p-4 text-right text-gray-600">
                      ₹{asset.averagePrice.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-medium">
                      ₹{asset.livePrice.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900">
                      ₹{asset.currentValue.toFixed(2)}
                    </td>
                    <td
                      className={`p-4 text-right font-bold ${
                        asset.pnl >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {asset.pnl >= 0 ? "+" : ""}₹
                      {Math.abs(asset.pnl).toFixed(2)}
                    </td>
                    <td
                      className={`p-4 text-right font-medium ${
                        asset.pnl >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {asset.pnl >= 0 ? "+" : ""}
                      {asset.pnlPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssets.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No assets found.{" "}
                {assetFilter !== "ALL"
                  ? `Try selecting a different filter.`
                  : `Sync Zerodha or add Manual Gold.`}
              </div>
            )}
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-6">
            Asset Allocation
          </h2>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {chartData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-900">
                  ₹{entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
