import React, { useState } from "react";

const initialRoster = [
  { agency: "City Police", method: "SMS", active: true },
  { agency: "Fire Brigade", method: "Email", active: true },
  { agency: "Trauma Center", method: "SMS", active: false },
];

export default function DispatchRouting() {
  const [roster, setRoster] = useState(initialRoster);

  const toggle = (index) => {
    setRoster((prev) => prev.map((item, i) => (i === index ? { ...item, active: !item.active } : item)));
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-black p-5">
          <p className="text-sm text-gray-400">SMTP Email Server</p>
          <p className="mt-2 text-lg font-semibold text-emerald-300">Connected</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-black p-5">
          <p className="text-sm text-gray-400">Twilio SMS API</p>
          <p className="mt-2 text-lg font-semibold text-emerald-300">Connected</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-white font-semibold mb-4">Emergency Contact Roster</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="py-2">Agency Name</th>
                <th className="py-2">Contact Method</th>
                <th className="py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((row, index) => (
                <tr key={row.agency} className="border-b border-gray-800/70">
                  <td className="py-3 text-gray-100">{row.agency}</td>
                  <td className="py-3 text-gray-300">{row.method}</td>
                  <td className="py-3">
                    <button
                      onClick={() => toggle(index)}
                      className={`px-3 py-1 rounded-md border text-xs ${row.active ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"}`}
                    >
                      {row.active ? "ON" : "OFF"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
