import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STORAGE_KEY = "trade-tracker-records";

interface Record {
  id: number;
  decision: string;
  tp: number;
  sl: number;
  timestamp: number;
}

export default function ClickTracker() {
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [startingCapital, setStartingCapital] = useState(() => {
    const stored = localStorage.getItem("starting-capital");
    return stored ? Number(stored) : 10000;
  });
  const [records, setRecords] = useState<Record[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage whenever records change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  // Save starting capital to localStorage
  useEffect(() => {
    localStorage.setItem("starting-capital", String(startingCapital));
  }, [startingCapital]);

  const handleDecision = (decision: string) => {
    const newRecord = {
      id: Date.now(),
      decision,
      tp: Number(tp),
      sl: Number(sl),
      timestamp: Date.now(),
    };
    setRecords((prev) => [...prev, newRecord]);
    setTp("");
    setSl("");
  };

  const exportData = () => {
    const csv = [
      "timestamp,decision,tp,sl,result",
      ...records.map((r) => {
        const result = r.decision === "Yes" ? r.tp : -r.sl;
        const date = new Date(r.timestamp).toISOString();
        return `${date},${r.decision},${r.tp},${r.sl},${result}`;
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Analytics calculations
  const getEquityCurve = () => {
    let balance = startingCapital;
    return records.map((r, index) => {
      const result = r.decision === "Yes" ? r.tp : -r.sl;
      balance += result;
      return {
        trade: index + 1,
        balance: Number(balance.toFixed(2)),
        result,
        date: new Date(r.timestamp).toLocaleDateString(),
      };
    });
  };

  const getDrawdownData = () => {
    let balance = startingCapital;
    let peak = startingCapital;
    let maxDrawdown = 0;
    let currentDrawdown = 0;

    const data = records.map((r, index) => {
      const result = r.decision === "Yes" ? r.tp : -r.sl;
      balance += result;

      if (balance > peak) {
        peak = balance;
      }

      currentDrawdown = ((peak - balance) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);

      return {
        trade: index + 1,
        drawdown: Number(currentDrawdown.toFixed(2)),
        balance: Number(balance.toFixed(2)),
      };
    });

    return { data, maxDrawdown: Number(maxDrawdown.toFixed(2)) };
  };

  const getWinLossDistribution = () => {
    const wins = records.filter((r) => r.decision === "Yes");
    const losses = records.filter((r) => r.decision === "No");

    return [
      {
        name: "Wins",
        value: wins.length,
        amount: wins.reduce((sum, r) => sum + r.tp, 0),
      },
      {
        name: "Losses",
        value: losses.length,
        amount: losses.reduce((sum, r) => sum + r.sl, 0),
      },
    ];
  };

  const getMonthlyPerformance = () => {
    const monthlyData: { [key: string]: number } = {};

    records.forEach((r) => {
      const month = new Date(r.timestamp).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      const result = r.decision === "Yes" ? r.tp : -r.sl;
      monthlyData[month] = (monthlyData[month] || 0) + result;
    });

    return Object.entries(monthlyData).map(([month, profit]) => ({
      month,
      profit: Number(profit.toFixed(2)),
    }));
  };

  const equityCurve = getEquityCurve();
  const { data: drawdownData, maxDrawdown } = getDrawdownData();
  const winLossData = getWinLossDistribution();
  const monthlyData = getMonthlyPerformance();
  const currentBalance =
    equityCurve.length > 0
      ? equityCurve[equityCurve.length - 1].balance
      : startingCapital;
  const totalProfit = currentBalance - startingCapital;
  const profitPercentage = ((totalProfit / startingCapital) * 100).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gray-100">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold"
      >
        Trade Backtesting Tracker
      </motion.h1>

      {records.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Trades</div>
              <div className="text-2xl font-bold">{records.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Yes Decisions</div>
              <div className="text-2xl font-bold text-green-600">
                {records.filter((r) => r.decision === "Yes").length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">No Decisions</div>
              <div className="text-2xl font-bold text-red-600">
                {records.filter((r) => r.decision === "No").length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Net</div>
              <div
                className={`text-2xl font-bold ${
                  records.reduce(
                    (sum, r) => sum + (r.decision === "Yes" ? r.tp : -r.sl),
                    0
                  ) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {records.reduce(
                  (sum, r) => sum + (r.decision === "Yes" ? r.tp : -r.sl),
                  0
                ) >= 0
                  ? "+"
                  : ""}
                {records.reduce(
                  (sum, r) => sum + (r.decision === "Yes" ? r.tp : -r.sl),
                  0
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Wins</div>
              <div className="text-2xl font-bold text-green-600">
                {records.reduce(
                  (sum, r) => sum + (r.decision === "Yes" ? r.tp : 0),
                  0
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Losses</div>
              <div className="text-2xl font-bold text-red-600">
                {records.reduce(
                  (sum, r) => sum + (r.decision === "No" ? r.sl : 0),
                  0
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Win Rate</div>
              <div className="text-2xl font-bold">
                {(
                  (records.filter((r) => r.decision === "Yes").length /
                    records.length) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Avg Net</div>
              <div
                className={`text-2xl font-bold ${
                  records.reduce(
                    (sum, r) => sum + (r.decision === "Yes" ? r.tp : -r.sl),
                    0
                  ) /
                    records.length >=
                  0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(
                  records.reduce(
                    (sum, r) => sum + (r.decision === "Yes" ? r.tp : -r.sl),
                    0
                  ) / records.length
                ).toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-4 mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            TP (Take Profit)
          </label>
          <input
            type="number"
            value={tp}
            onChange={(e) => setTp(e.target.value)}
            className="px-4 py-2 rounded-xl shadow border w-32 text-xl"
            placeholder="TP"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            SL (Stop Loss)
          </label>
          <input
            type="number"
            value={sl}
            onChange={(e) => setSl(e.target.value)}
            className="px-4 py-2 rounded-xl shadow border w-32 text-xl"
            placeholder="SL"
          />
        </div>

        <button
          type="button"
          onClick={() => handleDecision("Yes")}
          className="px-6 py-3 rounded-2xl shadow bg-green-500 text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!tp || !sl}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => handleDecision("No")}
          className="px-6 py-3 rounded-2xl shadow bg-red-500 text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!tp || !sl}
        >
          No
        </button>
      </div>

      <div className="w-full max-w-4xl mt-8">
        <table className="w-full bg-white rounded-2xl shadow overflow-hidden text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-lg">Timestamp</th>
              <th className="p-3 text-lg">Decision</th>
              <th className="p-3 text-lg">TP</th>
              <th className="p-3 text-lg">SL</th>
              <th className="p-3 text-lg">Result</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const result = r.decision === "Yes" ? r.tp : -r.sl;
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 text-xl">{r.decision}</td>
                  <td className="p-3 text-xl text-green-600">{r.tp}</td>
                  <td className="p-3 text-xl text-red-600">{r.sl}</td>
                  <td
                    className={`p-3 text-xl font-bold ${
                      result >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result >= 0 ? "+" : ""}
                    {result}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={() => {
            const confirmClear = window.confirm(
              "Are you sure you want to clear all records? This action cannot be undone."
            );
            if (!confirmClear) return;
            setRecords([]);
            setTp("");
            setSl("");
          }}
          className="px-6 py-3 rounded-2xl shadow bg-gray-700 text-white text-xl"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            const confirmClear = window.confirm(
              "Are you sure you want to clear all records? This action cannot be undone."
            );
            if (!confirmClear) return;
            if (records.length > 0) {
              setRecords((prev) => prev.slice(0, -1));
            }
          }}
          className="px-6 py-3 rounded-2xl shadow bg-orange-600 text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={records.length === 0}
        >
          Delete Last
        </button>
        <button
          type="button"
          onClick={() => setShowAnalytics(true)}
          className="px-6 py-3 rounded-2xl shadow bg-purple-600 text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={records.length === 0}
        >
          Analytics
        </button>
        <button
          type="button"
          onClick={exportData}
          className="px-6 py-3 rounded-2xl shadow bg-blue-600 text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={records.length === 0}
        >
          Export
        </button>
      </div>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">In-Depth Analytics</h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>

              {/* Starting Capital Input */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Capital
                </label>
                <input
                  type="number"
                  value={startingCapital}
                  onChange={(e) => setStartingCapital(Number(e.target.value))}
                  className="px-4 py-2 rounded-xl shadow border w-48 text-xl"
                  placeholder="Starting Capital"
                />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                  <div className="text-sm opacity-90">Starting Capital</div>
                  <div className="text-2xl font-bold">
                    ${startingCapital.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl">
                  <div className="text-sm opacity-90">Current Balance</div>
                  <div className="text-2xl font-bold">
                    ${currentBalance.toLocaleString()}
                  </div>
                </div>
                <div
                  className={`bg-gradient-to-br ${
                    totalProfit >= 0
                      ? "from-emerald-500 to-emerald-600"
                      : "from-red-500 to-red-600"
                  } text-white p-4 rounded-xl`}
                >
                  <div className="text-sm opacity-90">Total P/L</div>
                  <div className="text-2xl font-bold">
                    {totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString()}{" "}
                    ({profitPercentage}%)
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl">
                  <div className="text-sm opacity-90">Max Drawdown</div>
                  <div className="text-2xl font-bold">{maxDrawdown}%</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="space-y-8">
                {/* Equity Curve */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">Equity Curve</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={equityCurve}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="trade"
                        label={{
                          value: "Trade #",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        label={{
                          value: "Balance ($)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Drawdown Chart */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">Drawdown Analysis</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={drawdownData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="trade"
                        label={{
                          value: "Trade #",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        label={{
                          value: "Drawdown (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="#ef4444"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Win/Loss Distribution */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-4">
                      Win/Loss Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={winLossData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-600 font-semibold">
                          Total Wins:
                        </span>
                        <span>
                          ${winLossData[0]?.amount.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600 font-semibold">
                          Total Losses:
                        </span>
                        <span>
                          ${winLossData[1]?.amount.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Performance */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-4">
                      Monthly Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="profit" fill="#3b82f6">
                          {monthlyData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-4">
                    Detailed Statistics
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Avg Win</div>
                      <div className="text-xl font-bold text-green-600">
                        $
                        {winLossData[0]?.value > 0
                          ? (
                              winLossData[0].amount / winLossData[0].value
                            ).toFixed(2)
                          : 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Avg Loss</div>
                      <div className="text-xl font-bold text-red-600">
                        $
                        {winLossData[1]?.value > 0
                          ? (
                              winLossData[1].amount / winLossData[1].value
                            ).toFixed(2)
                          : 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Profit Factor</div>
                      <div className="text-xl font-bold">
                        {winLossData[1]?.amount > 0
                          ? (
                              winLossData[0]?.amount / winLossData[1]?.amount
                            ).toFixed(2)
                          : "∞"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Best Trade</div>
                      <div className="text-xl font-bold text-green-600">
                        $
                        {Math.max(
                          ...records
                            .filter((r) => r.decision === "Yes")
                            .map((r) => r.tp),
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Worst Trade</div>
                      <div className="text-xl font-bold text-red-600">
                        $
                        {Math.max(
                          ...records
                            .filter((r) => r.decision === "No")
                            .map((r) => r.sl),
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Risk/Reward Ratio
                      </div>
                      <div className="text-xl font-bold">
                        {winLossData[1]?.value > 0 && winLossData[0]?.value > 0
                          ? (
                              winLossData[0].amount /
                              winLossData[0].value /
                              (winLossData[1].amount / winLossData[1].value)
                            ).toFixed(2)
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
