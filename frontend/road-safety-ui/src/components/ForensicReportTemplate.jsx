import React from "react";

const FALLBACK_LOCATION = "28.6139° N, 77.2090° E (New Delhi)";
const FALLBACK_NARRATIVE =
  "At [Time], YOLOv8 spatial tracking detected a multi-vehicle anomaly. A sudden velocity drop (hard braking) was followed by bounding box intersection, triggering a CRITICAL severity alert.";

function formatTimestamp(value) {
  if (!value) return "N/A";

  const dateValue = value?.toDate?.() ? value.toDate() : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return String(value);

  return dateValue.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function getImageSource(incident) {
  return (
    incident?.snapshot_url ||
    incident?.snapshotUrl ||
    incident?.raw?.snapshot_url ||
    incident?.raw?.snapshotUrl ||
    incident?.raw?.snapshot ||
    incident?.raw?.image ||
    null
  );
}

function getNarrative(incident) {
  return incident?.llm_summary || incident?.raw?.llm_summary || incident?.raw?.ai_summary || FALLBACK_NARRATIVE;
}

function MetricCard({ label, value, tone = "slate" }) {
  const toneClasses = {
    slate: "bg-slate-800/55 border-white/5",
    orange: "bg-orange-500/10 border-orange-500/20",
    red: "bg-red-500/10 border-red-500/20",
  };

  return (
    <div className={`rounded-lg border p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${toneClasses[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-50 wrap-break-word">{value}</p>
    </div>
  );
}

export default function ForensicReportTemplate({ incident }) {
  const timestampLabel = formatTimestamp(incident?.timestamp || incident?.timestampDate || incident?.date || incident?.time || incident?.raw?.timestamp);
  const locationLabel = incident?.location && incident.location !== "Unknown" ? incident.location : FALLBACK_LOCATION;
  const severityLabel = incident?.severity || "Unknown";
  const classificationLabel = incident?.classification || incident?.type || "Unclassified";
  const confidenceLabel = typeof incident?.confidence === "number" ? `${incident.confidence.toFixed(1)}%` : typeof incident?.raw?.confidence === "number" ? `${incident.raw.confidence.toFixed(1)}%` : "N/A";
  const narrative = getNarrative(incident);
  const imageSource = getImageSource(incident);
  const generationStamp = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div
      id="pdf-report-template"
      className="absolute top-0 w-198.5 bg-slate-900 text-slate-100"
      style={{ left: "-9999px" }}
      aria-hidden="true"
    >
      <div className="p-8">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-[0_30px_90px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="grid grid-cols-1 gap-4 border-b border-slate-700/80 p-8 md:grid-cols-[1.4fr_0.9fr] md:items-end">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.45em] text-orange-400/90">
                Road Safety AI - Tactical Forensic Export
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-50">
                Forensic Incident Report
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Official incident record generated from live telemetry, detection metadata, and AI-assisted reconstruction for police, insurance, and internal review.
              </p>
            </div>

            <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-4 text-right shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-orange-300">Generated</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">{generationStamp}</p>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.35em] text-orange-300">Audit ID</p>
              <p className="mt-1 break-all text-sm font-semibold text-orange-200">{incident?.id || "N/A"}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
                <h2 className="text-sm font-black uppercase tracking-[0.35em] text-slate-200">Core Telemetry</h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Verified Event Snapshot</span>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <MetricCard label="Timestamp" value={timestampLabel} />
                <MetricCard label="Geo-Location" value={locationLabel} />
                <MetricCard label="Risk Severity" value={severityLabel} tone={String(severityLabel).toLowerCase().includes("critical") || String(severityLabel).toLowerCase().includes("severe") ? "red" : "orange"} />
                <MetricCard label="Confidence Score" value={confidenceLabel} />
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <MetricCard label="Classification" value={classificationLabel} />
                <MetricCard label="Detection Mode" value={incident?.raw?.model || incident?.raw?.detector || "YOLOv8"} />
                <MetricCard label="Source Tag" value={incident?.raw?.cameraId || incident?.raw?.userId || incident?.plate || "Telemetry Feed"} />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
                <h2 className="text-sm font-black uppercase tracking-[0.35em] text-slate-200">Visual Evidence</h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Snapshot and Spatial Context</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-700/80 bg-slate-800/50 p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">YOLOv8 Snapshot Image</p>
                  <div className="flex h-60 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-600 bg-slate-950/80">
                    {imageSource ? (
                      <img
                        src={imageSource}
                        alt="Evidence snapshot"
                        crossOrigin="anonymous"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-bold tracking-[0.3em] text-slate-300">EVIDENCE SNAPSHOT</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">Unavailable</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700/80 bg-slate-800/50 p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Geospatial Location</p>
                  <div className="flex h-60 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-600 bg-slate-950/80">
                    <div className="text-center space-y-2 px-4">
                      <p className="text-sm font-bold tracking-[0.3em] text-slate-300">GEOSPATIAL LOCATION</p>
                      <p className="text-xs leading-5 text-slate-500">
                        Static map reference reserved for coordinate review and route reconstruction.
                      </p>
                      <p className="text-xs font-semibold text-orange-300">{locationLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
                <h2 className="text-sm font-black uppercase tracking-[0.35em] text-slate-200">AI Reconstruction Narrative</h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Automated Readout</span>
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                <pre className="whitespace-pre-wrap font-mono text-[12px] leading-7 text-slate-200">
                  {narrative}
                </pre>
              </div>
            </section>

            <footer className="border-t border-slate-700/70 pt-4 text-center text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
              CONFIDENTIAL - AUTHORIZED PERSONNEL ONLY. Generated by Intelligent Transportation System.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
