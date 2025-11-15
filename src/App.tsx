import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
  const [records, setRecords] = useState<Record[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage whenever records change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

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
          onClick={exportData}
          className="px-6 py-3 rounded-2xl shadow bg-blue-600 text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={records.length === 0}
        >
          Export
        </button>
      </div>
    </div>
  );
}
