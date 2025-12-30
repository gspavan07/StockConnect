import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import SummaryCard from "../components/SummaryCard";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  RefreshCw,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeft,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Growth Analysis State
  const [growthData, setGrowthData] = useState([]);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [growthRange, setGrowthRange] = useState("ALL");
  const [selectedGrowthPoint, setSelectedGrowthPoint] = useState(null);

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

  const fetchGrowthData = async () => {
    setGrowthLoading(true);
    try {
      const res = await api.get("/analysis/growth");
      setGrowthData(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedGrowthPoint(res.data.data[res.data.data.length - 1]);
      }
    } catch (err) {
      console.error("Failed to load growth data:", err);
    } finally {
      setGrowthLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchGrowthData();
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

  const filteredGrowthData = React.useMemo(() => {
    if (!growthData.length) return [];
    const now = new Date();
    let startDate = new Date(0);

    if (growthRange === "1M") {
      const d = new Date(now);
      startDate = new Date(d.setMonth(d.getMonth() - 1));
    } else if (growthRange === "3M") {
      const d = new Date(now);
      startDate = new Date(d.setMonth(d.getMonth() - 3));
    } else if (growthRange === "6M") {
      const d = new Date(now);
      startDate = new Date(d.setMonth(d.getMonth() - 6));
    } else if (growthRange === "1Y") {
      const d = new Date(now);
      startDate = new Date(d.setFullYear(d.getFullYear() - 1));
    }

    return growthData.filter((d) => new Date(d.date) >= startDate);
  }, [growthData, growthRange]);

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
            onClick={() => {
              fetchData();
              fetchGrowthData();
            }}
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

      {/* Integrated Growth Analysis Section */}
      <div className="mt-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Growth Analysis
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Portfolio value trend over time
              </p>
            </div>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              {["1M", "3M", "6M", "1Y", "ALL"].map((r) => (
                <button
                  key={r}
                  onClick={() => setGrowthRange(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                    growthRange === r
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {growthLoading ? (
            <div className="h-[400px] w-full bg-gray-50 rounded-2xl animate-pulse"></div>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredGrowthData}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      setSelectedGrowthPoint(e.activePayload[0].payload);
                    } else if (e && e.activeLabel) {
                      const point = filteredGrowthData.find(
                        (d) => d.date === e.activeLabel
                      );
                      if (point) setSelectedGrowthPoint(point);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorInvested"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      padding: "12px",
                    }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                  />
                  <Legend verticalAlign="top" height={36} />
                  {selectedGrowthPoint && (
                    <ReferenceLine
                      x={selectedGrowthPoint.date}
                      stroke="#3b82f6"
                      strokeDasharray="3 3"
                      label={{
                        value: "Locked",
                        position: "top",
                        fill: "#3b82f6",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="totalValue"
                    name="Total Portfolio Value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="investedValue"
                    name="Amount Invested"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorInvested)"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Data Debugger Integrated */}
        {selectedGrowthPoint && !growthLoading && (
          <div className="mt-8 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <DollarSign size={18} />
                  </span>
                  Data Debugger:{" "}
                  {new Date(selectedGrowthPoint.date).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 uppercase font-medium tracking-wider">
                  Total Value
                </div>
                <div className="text-xl font-black text-blue-600">
                  ₹{selectedGrowthPoint.totalValue.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Bought Price</th>
                    <th className="px-6 py-4 text-right">Hist. Price</th>
                    <th className="px-6 py-4 text-right">Holding Value</th>
                    <th className="px-6 py-4 text-right">Invested Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedGrowthPoint.assetsBreakdown?.map((asset, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          {asset.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          {asset.symbol} • {asset.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-600">
                        {asset.quantity.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-600">
                        ₹{asset.avgPrice?.toLocaleString() || "0"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-600">
                        ₹{asset.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ₹{asset.value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-500">
                        ₹{asset.invested.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
