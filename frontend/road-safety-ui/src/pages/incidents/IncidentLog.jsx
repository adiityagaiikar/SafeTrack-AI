import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, CalendarDays, DownloadCloud, FileDown, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncidents } from "@/hooks/useIncidents";
import { downloadInsurancePDF } from "@/utils/generateClaim";
import { api } from "@/api";

// ─── AI Narrative Modal ───────────────────────────────────────────────────────
function NarrativeModal({ narrative, loading, error, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-widest uppercase">
                Automated Incident Reconstruction
              </p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                AI-generated legal narrative · For review purposes only
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[180px] flex items-start">
          {loading && (
            <div className="flex items-center gap-3 text-zinc-400 text-sm font-mono">
              <span className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
              Reconstructing incident timeline...
            </div>
          )}
          {error && (
            <p className="text-red-400 text-sm font-mono">{error}</p>
          )}
          {!loading && !error && narrative && (
            <p className="text-zinc-200 text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {narrative}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IncidentLog() {
  const [searchTerm, setSearchTerm]       = useState("");
  const [compilingId, setCompilingId]     = useState("");
  const [narrativeModal, setNarrativeModal] = useState(null); // { loading, narrative, error }
  const { incidents, loading, error } = useIncidents("accidents", { scoped: true });

  const filteredLogs = incidents.filter(
    (log) =>
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateNarrative = async (incident) => {
    setNarrativeModal({ loading: true, narrative: null, error: null });

    // Build mock telemetry from incident data if real telemetry isn't stored
    const events = incident.raw?.telemetry ?? [
      { time: -5, speed: incident.raw?.speedAtImpact ?? 60, distance: 12, event: null },
      { time: -3, speed: Math.max((incident.raw?.speedAtImpact ?? 60) - 10, 10), distance: 6, event: null },
      { time: -1, speed: Math.max((incident.raw?.speedAtImpact ?? 60) - 30, 5), distance: 2, event: "hard_brake" },
      { time: 0,  speed: 0, distance: 0, event: "impact" },
    ];

    try {
      const result = await api.generateNarrative(events, incident.id);
      setNarrativeModal({ loading: false, narrative: result.narrative, error: null });
    } catch (e) {
      setNarrativeModal({ loading: false, narrative: null, error: e.message });
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "Severe":
        return (
          <Badge className="bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)] font-black tracking-widest uppercase text-[9px] py-1 px-2.5">
            Critical Threat
          </Badge>
        );
      case "Moderate":
        return (
          <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)] font-bold tracking-widest uppercase text-[9px] py-1 px-2.5">
            Moderate
          </Badge>
        );
      case "Minor":
        return (
          <Badge className="bg-white/5 text-zinc-400 border border-white/10 font-bold tracking-widest uppercase text-[9px] py-1 px-2.5">
            Minor
          </Badge>
        );
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const handleDownloadReport = async (incident) => {
    if (compilingId) return;
    try {
      setCompilingId(incident.id);
      await downloadInsurancePDF({
        timestamp: `${incident.date} ${incident.time}`,
        location: incident.location,
        severity: incident.severity,
        geminiReport:
          incident.raw?.geminiReport ||
          incident.raw?.report ||
          incident.raw?.summary ||
          "AI forensic narrative unavailable for this event.",
        snapshotUrl:
          incident.raw?.snapshotUrl || incident.raw?.imageUrl || incident.raw?.frameUrl || "",
        yoloConfidence: incident.raw?.yoloConfidence || incident.raw?.confidence || "N/A",
        speedAtImpact: incident.raw?.speedAtImpact || "Unknown",
        weatherCondition: incident.raw?.weatherCondition || "Unknown",
      });
    } finally {
      setCompilingId("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Narrative Modal */}
      {narrativeModal && (
        <NarrativeModal
          loading={narrativeModal.loading}
          narrative={narrativeModal.narrative}
          error={narrativeModal.error}
          onClose={() => setNarrativeModal(null)}
        />
      )}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 relative">
        <div className="absolute top-0 right-0 w-75 h-37.5 bg-zinc-800/10 blur-[80px] rounded-full -z-10 animate-pulse" />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
            Incident LEDGER
          </h2>
          <p className="text-zinc-500 font-medium text-lg">
            Immutable database of recorded safety anomalies and spatial violations.
          </p>
        </div>
        <Button className="bg-white hover:bg-zinc-200 text-zinc-950 border-none shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all rounded-full font-bold px-6">
          <DownloadCloud className="w-4 h-4 mr-2" /> Export JSON
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent pointer-events-none opacity-50" />

        {/* Table Header / Search Bar */}
        <CardHeader className="bg-black/40 border-b border-white/5 pb-5 pt-6 px-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg shadow-inner">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-white tracking-widest uppercase text-[12px]">
                Global Archive | Apr '26
              </CardTitle>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80 overflow-hidden rounded-full p-px bg-linear-to-r from-white/10 via-white/30 to-white/10">
                <div className="relative bg-zinc-950 rounded-full h-full w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Query Location or Node ID..."
                    className="pl-10 bg-transparent border-none shadow-inner h-10 w-full rounded-full focus-visible:ring-0 text-white font-medium placeholder:text-zinc-600 focus:bg-white/5 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="shrink-0 border-white/10 bg-white/5 text-white hover:bg-white hover:text-zinc-950 rounded-full font-bold px-5 transition-all shadow-sm"
              >
                <Filter className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-black/20 backdrop-blur-md">
          {loading && (
            <div className="px-8 py-6 text-sm text-zinc-400">Connecting to incident database...</div>
          )}
          {error && (
            <div className="mx-8 my-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Database connection failed: {error}
            </div>
          )}

          {/* ── Grid table — no horizontal scroll ── */}
          <div className="w-full">
            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_1.4fr_1.2fr_1.2fr_1fr_1fr_1.4fr_1.6fr] border-b border-white/5 px-6">
              {[
                "System ID",
                "Timestamp (UTC)",
                "Spatial Coordinates",
                "Agent Identifier",
                "Anomaly Class",
                "Threat Level",
                "Forensic PDF",
                "AI Narrative",
              ].map((heading, i) => (
                <div
                  key={heading}
                  className={`py-4 px-3 font-black text-zinc-600 uppercase tracking-widest text-[9px] ${
                    i >= 5 ? "text-right" : ""
                  }`}
                >
                  {heading}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[1fr_1.4fr_1.2fr_1.2fr_1fr_1fr_1.4fr_1.6fr] border-b border-white/5 px-6 hover:bg-white/[0.03] transition-colors group items-center"
                >
                  {/* System ID */}
                  <div className="py-4 px-3">
                    <span className="font-mono text-xs font-bold text-zinc-300 bg-zinc-900 border border-white/10 px-2 py-1 rounded group-hover:bg-zinc-800 transition-colors">
                      {log.id.slice(0, 8)}…
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="py-4 px-3 flex flex-col gap-0.5">
                    <span className="font-bold text-zinc-200 text-sm">{log.date}</span>
                    <span className="text-xs font-medium text-zinc-500">{log.time}</span>
                  </div>

                  {/* Spatial Coordinates */}
                  <div className="py-4 px-3">
                    <span className="font-mono text-xs text-zinc-300 tracking-tight">{log.location}</span>
                  </div>

                  {/* Agent Identifier */}
                  <div className="py-4 px-3">
                    {log.plate === "UNKNOWN" ? (
                      <span className="font-mono text-xs font-bold text-zinc-600 italic tracking-wider">
                        UNIDENTIFIED
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.1)]">
                        {log.plate}
                      </span>
                    )}
                  </div>

                  {/* Anomaly Class */}
                  <div className="py-4 px-3">
                    <span className="text-sm font-semibold text-zinc-300">{log.type}</span>
                  </div>

                  {/* Threat Level */}
                  <div className="py-4 px-3 flex justify-end">
                    {getSeverityBadge(log.severity)}
                  </div>

                  {/* Forensic PDF */}
                  <div className="py-4 px-3 flex justify-end">
                    <button
                      onClick={() => handleDownloadReport(log)}
                      disabled={Boolean(compilingId)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-500/50 text-orange-500 bg-transparent hover:bg-orange-500 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(249,115,22,0.1)] hover:shadow-[0_0_16px_rgba(249,115,22,0.35)]"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      {compilingId === log.id ? "Compiling…" : "Forensic PDF"}
                    </button>
                  </div>

                  {/* AI Narrative */}
                  <div className="py-4 px-3 flex justify-end">
                    <button
                      onClick={() => handleGenerateNarrative(log)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-sky-500/50 text-sky-400 bg-transparent hover:bg-sky-500 hover:text-white transition-all duration-200 shadow-[0_0_10px_rgba(14,165,233,0.1)] hover:shadow-[0_0_16px_rgba(14,165,233,0.35)]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Narrative
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                <Search className="w-8 h-8 mb-3 opacity-30" />
                <p className="font-bold text-zinc-500 tracking-wide text-sm">
                  No telemetry records match your parameters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
