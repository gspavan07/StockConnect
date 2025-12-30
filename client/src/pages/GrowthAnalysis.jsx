import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import axios from "axios";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

const GrowthAnalysis = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("ALL");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [viewMode, setViewMode] = useState("TOTAL"); // "TOTAL" or "COMPARE"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/analysis/growth");
        setData(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedPoint(res.data.data[res.data.data.length - 1]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load growth data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = React.useMemo(() => {
    if (!data.length) return [];

    // Filter by range
    const now = new Date();
    let startDate = new Date(0); // ALL

    if (range === "1M") {
      const d = new Date(now);
      startDate = new Date(d.setMonth(d.getMonth() - 1));
    } else if (range === "3M") {
      const d = new Date(now);
      startDate = new Date(d.setMonth(d.getMonth() - 3));
    } else if (range === "6M") {
      const d = new Date(now);
      startDate = new Date(d.setMonth(d.getMonth() - 6));
    } else if (range === "1Y") {
      const d = new Date(now);
      startDate = new Date(d.setFullYear(d.getFullYear() - 1));
    }

    return data
      .map((d) => {
        const breakdown = d.assetsBreakdown || [];
        return {
          ...d,
          stocksValue: breakdown
            .filter((a) => a.type === "STOCK")
            .reduce((sum, a) => sum + a.value, 0),
          goldValue: breakdown
            .filter((a) => a.type === "GOLD")
            .reduce((sum, a) => sum + a.value, 0),
          mfValue: breakdown
            .filter((a) => a.type === "MF")
            .reduce((sum, a) => sum + a.value, 0),
        };
      })
      .filter((d) => new Date(d.date) >= startDate);
  }, [data, range]);

  const stats = React.useMemo(() => {
    if (!filteredData.length) return { profit: 0, returns: 0, current: 0 };
    const first = filteredData[0];
    const last = filteredData[filteredData.length - 1];
    const profit = last.totalValue - last.investedValue;
    const returns =
      last.investedValue > 0 ? (profit / last.investedValue) * 100 : 0;
    return {
      profit,
      returns,
      current: last.totalValue,
      invested: last.investedValue,
    };
  }, [filteredData]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded-xl"></div>
      </div>
    );

  if (error) return <div className="p-12 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/")}
          className="p-2 hover:bg-gray-200 rounded-full transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Growth Analysis
          </h1>
          <p className="text-gray-500">
            Track your portfolio performance over time
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-gray-500 text-sm font-medium uppercase">
            Current Value
          </span>
          <div className="text-2xl font-bold mt-1">
            ₹{stats.current.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-gray-500 text-sm font-medium uppercase">
            Invested
          </span>
          <div className="text-2xl font-bold mt-1 text-gray-600">
            ₹{stats.invested.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-gray-500 text-sm font-medium uppercase">
            Total Profit
          </span>
          <div
            className={`text-2xl font-bold mt-1 flex items-center gap-2 ${
              stats.profit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {stats.profit >= 0 ? (
              <TrendingUp size={24} />
            ) : (
              <TrendingDown size={24} />
            )}
            ₹{Math.abs(stats.profit).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-gray-500 text-sm font-medium uppercase">
            Returns (%)
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              stats.returns >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {stats.returns >= 0 ? "+" : ""}
            {stats.returns.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-xl font-bold text-gray-800">
            Portfolio Value Details
          </h2>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("TOTAL")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  viewMode === "TOTAL"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Overall
              </button>
              <button
                onClick={() => setViewMode("COMPARE")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                  viewMode === "COMPARE"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Compare Assets
              </button>
            </div>

            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              {["1M", "3M", "6M", "1Y", "ALL"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                    range === r
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  setSelectedPoint(e.activePayload[0].payload);
                } else if (e && e.activeLabel) {
                  const point = filteredData.find(
                    (d) => d.date === e.activeLabel
                  );
                  if (point) setSelectedPoint(point);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorStocks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
              {selectedPoint && (
                <ReferenceLine
                  x={selectedPoint.date}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  label={{
                    value: "Selected",
                    position: "top",
                    fill: "#3b82f6",
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                />
              )}
              {viewMode === "TOTAL" ? (
                <>
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
                </>
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="stocksValue"
                    name="Stocks"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStocks)"
                    animationDuration={1000}
                  />
                  <Area
                    type="monotone"
                    dataKey="mfValue"
                    name="Mutual Funds"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMF)"
                    animationDuration={1000}
                  />
                  <Area
                    type="monotone"
                    dataKey="goldValue"
                    name="Gold"
                    stroke="#eab308"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGold)"
                    animationDuration={1000}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Debugger Section */}
      {selectedPoint && (
        <div className="mt-12 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <DollarSign size={20} />
                </span>
                Data Debugger:{" "}
                {new Date(selectedPoint.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Detailed asset breakdown for this specific day
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 uppercase font-medium tracking-wider">
                Total Value
              </div>
              <div className="text-2xl font-black text-blue-600">
                ₹{selectedPoint.totalValue.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-xs font-bold uppercase tracking-widest">
                  <th className="px-8 py-4">Asset</th>
                  <th className="px-8 py-4">Quantity</th>
                  <th className="px-8 py-4">Bought Price</th>
                  <th className="px-8 py-4">Hist. Price</th>
                  <th className="px-8 py-4">Holding Value</th>
                  <th className="px-8 py-4 text-right">Invested Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedPoint.assetsBreakdown?.map((asset, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {asset.name}
                      </div>
                      <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            asset.type === "STOCK"
                              ? "bg-indigo-400"
                              : asset.type === "GOLD"
                              ? "bg-yellow-400"
                              : "bg-green-400"
                          }`}
                        ></span>
                        {asset.symbol} • {asset.type}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-mono text-sm text-gray-600">
                      {asset.quantity.toFixed(3)}
                    </td>
                    <td className="px-8 py-5 font-mono text-sm text-gray-600">
                      ₹{asset.avgPrice?.toLocaleString() || "0"}
                    </td>
                    <td className="px-8 py-5 font-mono text-sm text-gray-600">
                      ₹{asset.price.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 font-bold text-gray-900">
                      ₹{asset.value.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right font-medium text-gray-500">
                      ₹{asset.invested.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Insight Box */}
      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl h-fit">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Performance Insight</h3>
            <p className="text-blue-700 text-sm mt-1">
              Your portfolio has {stats.profit >= 0 ? "grown" : "declined"} by ₹
              {Math.abs(stats.profit).toLocaleString()} since the earliest
              recorded transaction. This represents a{" "}
              {stats.returns >= 0 ? "gain" : "loss"} of{" "}
              {Math.abs(stats.returns).toFixed(2)}% on your total capital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthAnalysis;
