import React, { useState } from "react";

const pending = [
  { id: "INC-1201", timestamp: "2026-03-28 09:12", severity: "Critical" },
  { id: "INC-1202", timestamp: "2026-03-28 09:47", severity: "Moderate" },
  { id: "INC-1203", timestamp: "2026-03-28 10:03", severity: "High" },
];

export default function ReportAuditQueue() {
  const [selected, setSelected] = useState(pending[0]);

  return (
    <section className="grid md:grid-cols-2 gap-4 h-[75vh]">
      <div className="rounded-xl border border-gray-800 bg-black overflow-y-auto">
        <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-3 text-sm font-semibold text-gray-200">
          Pending Reports
        </div>
        <ul>
          {pending.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setSelected(item)}
                className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-900 ${selected.id === item.id ? "bg-gray-900" : ""}`}
              >
                <p className="text-gray-100 font-medium">{item.id}</p>
                <p className="text-xs text-gray-400">{item.timestamp}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${item.severity === "Critical" ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"}`}>
                  {item.severity}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col">
        <h3 className="text-lg text-white font-semibold mb-3">Report Detail: {selected.id}</h3>
        <textarea
          className="flex-1 w-full rounded-md border border-gray-800 bg-black p-3 text-sm text-gray-200"
          readOnly
          value={`LLM Summary for ${selected.id}: Multi-vehicle anomaly detected at signalized intersection. Probable cause: red-light violation and late braking. Recommend dispatch + camera evidence retention.`}
        />
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 rounded-md bg-emerald-500 text-black font-semibold hover:bg-emerald-400">Approve & Archive</button>
          <button className="px-4 py-2 rounded-md bg-orange-500 text-black font-semibold hover:bg-orange-400">Flag for Manual Review</button>
        </div>
      </div>
    </section>
  );
}
