import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Plus, Edit2, Trash2, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GoldManagement = () => {
  const navigate = useNavigate();
  const [goldHoldings, setGoldHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGold, setEditingGold] = useState(null);
  const [inputMode, setInputMode] = useState("investedValue"); // "investedValue" or "pricePerGram"
  const [formData, setFormData] = useState({
    name: "",
    totalGrams: "",
    investedValue: "",
    pricePerGram: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const fetchGoldHoldings = async () => {
    try {
      const res = await api.get("/gold");
      setGoldHoldings(res.data);
    } catch (error) {
      console.error("Failed to fetch gold holdings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoldHoldings();
  }, []);

  const handleOpenModal = (gold = null) => {
    if (gold) {
      setEditingGold(gold);
      setFormData({
        name: gold.name,
        totalGrams: gold.quantity.toString(),
        investedValue: gold.investedValue.toString(),
        pricePerGram: gold.averagePrice.toString(),
        purchaseDate: gold.lastUpdated
          ? new Date(gold.lastUpdated).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      setEditingGold(null);
      setFormData({
        name: "",
        totalGrams: "",
        investedValue: "",
        pricePerGram: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
    }
    setInputMode("investedValue");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGold(null);
    setInputMode("investedValue");
    setFormData({
      name: "",
      totalGrams: "",
      investedValue: "",
      pricePerGram: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name || undefined,
        totalGrams: parseFloat(formData.totalGrams),
        purchaseDate: formData.purchaseDate,
      };

      // Send either investedValue or pricePerGram based on input mode
      if (inputMode === "pricePerGram") {
        payload.pricePerGram = parseFloat(formData.pricePerGram);
      } else {
        payload.investedValue = parseFloat(formData.investedValue);
      }

      if (editingGold) {
        // Update existing gold holding
        await api.put(`/gold/${editingGold._id}`, payload);
      } else {
        // Create new gold holding
        await api.post("/gold", payload);
      }

      fetchGoldHoldings();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save gold holding:", error);
      alert(error.response?.data?.message || "Failed to save gold holding");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gold holding?")) {
      return;
    }

    try {
      await api.delete(`/gold/${id}`);
      fetchGoldHoldings();
    } catch (error) {
      console.error("Failed to delete gold holding:", error);
      alert("Failed to delete gold holding");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-9 w-56 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse mt-4 md:mt-0"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-16 flex-1 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Gold Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your gold holdings manually
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition shadow-lg font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          Add Gold
        </button>
      </div>

      {/* Gold Holdings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Your Gold Holdings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold text-right">
                  Quantity (grams)
                </th>
                <th className="p-4 font-semibold text-right">Invested Value</th>
                <th className="p-4 font-semibold text-right">Avg Price/gram</th>
                <th className="p-4 font-semibold text-right">Purchase Date</th>
                <th className="p-4 font-semibold text-right">Source</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goldHoldings.map((gold) => (
                <tr key={gold._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-900">{gold.name}</td>
                  <td className="p-4 text-right text-gray-600">
                    {gold.quantity.toFixed(3)}g
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    ₹{gold.investedValue.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    ₹{gold.averagePrice.toFixed(2)}
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    {new Date(gold.lastUpdated).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-800">
                      {gold.source}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(gold)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(gold._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {goldHoldings.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No gold holdings found. Click "Add Gold" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingGold ? "Edit Gold Holding" : "Add Gold Holding"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name{" "}
                  {!editingGold && (
                    <span className="text-gray-400">(Optional)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., PhonePe Gold 24K"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Grams
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.totalGrams}
                  onChange={(e) => {
                    const grams = e.target.value;
                    setFormData({ ...formData, totalGrams: grams });
                    // Recalculate based on current input mode
                    if (grams) {
                      if (
                        inputMode === "investedValue" &&
                        formData.investedValue
                      ) {
                        const ppg =
                          parseFloat(formData.investedValue) /
                          parseFloat(grams);
                        setFormData((prev) => ({
                          ...prev,
                          totalGrams: grams,
                          pricePerGram: ppg.toFixed(2),
                        }));
                      } else if (
                        inputMode === "pricePerGram" &&
                        formData.pricePerGram
                      ) {
                        const invested =
                          parseFloat(formData.pricePerGram) * parseFloat(grams);
                        setFormData((prev) => ({
                          ...prev,
                          totalGrams: grams,
                          investedValue: invested.toFixed(2),
                        }));
                      }
                    }
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., 5.5"
                />
              </div>

              {/* Input Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Input Method
                </label>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setInputMode("investedValue")}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                      inputMode === "investedValue"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Total Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("pricePerGram")}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                      inputMode === "pricePerGram"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Price/Gram
                  </button>
                </div>
              </div>

              {/* Conditional Input based on mode */}
              {inputMode === "investedValue" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Invested Value (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.investedValue}
                    onChange={(e) => {
                      const invested = e.target.value;
                      setFormData({ ...formData, investedValue: invested });
                      // Auto-calculate price per gram
                      if (invested && formData.totalGrams) {
                        const ppg =
                          parseFloat(invested) /
                          parseFloat(formData.totalGrams);
                        setFormData((prev) => ({
                          ...prev,
                          investedValue: invested,
                          pricePerGram: ppg.toFixed(2),
                        }));
                      }
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                    placeholder="e.g., 35000"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gold Rate (₹/gram)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerGram}
                    onChange={(e) => {
                      const ppg = e.target.value;
                      setFormData({ ...formData, pricePerGram: ppg });
                      // Auto-calculate invested value
                      if (ppg && formData.totalGrams) {
                        const invested =
                          parseFloat(ppg) * parseFloat(formData.totalGrams);
                        setFormData((prev) => ({
                          ...prev,
                          pricePerGram: ppg,
                          investedValue: invested.toFixed(2),
                        }));
                      }
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                    placeholder="e.g., 6500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Investment
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Calculation Display */}
              {formData.totalGrams &&
                (inputMode === "investedValue"
                  ? formData.investedValue
                  : formData.pricePerGram) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="space-y-1">
                      {inputMode === "investedValue" ? (
                        <p className="text-sm text-gray-600">
                          Gold Rate:{" "}
                          <span className="font-bold text-gray-900">
                            ₹
                            {(
                              parseFloat(formData.investedValue) /
                              parseFloat(formData.totalGrams)
                            ).toFixed(2)}
                            /gram
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Total Investment:{" "}
                          <span className="font-bold text-gray-900">
                            ₹
                            {(
                              parseFloat(formData.pricePerGram) *
                              parseFloat(formData.totalGrams)
                            ).toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition font-medium shadow-lg"
                >
                  {editingGold ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldManagement;
