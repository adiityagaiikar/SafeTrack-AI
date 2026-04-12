import React, { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { CheckCircle, Flag, FileSearch, Clock, AlertTriangle, ShieldAlert } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(ts) {
  if (!ts) return "N/A";
  const d = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return "N/A";
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function normalizeSeverity(raw, accidentDetected) {
  const v = String(raw || "").toUpperCase();
  if (v === "SEVERE" || v === "HIGH" || v === "CRITICAL") return "Critical";
  if (v === "MODERATE" || v === "MEDIUM")                  return "Moderate";
  if (v === "MINOR"    || v === "LOW")                     return "Minor";
  return accidentDetected ? "Critical" : "Minor";
}

function severityStyle(sev) {
  if (sev === "Critical") return "bg-red-500/15 text-red-300 border border-red-500/30";
  if (sev === "Moderate") return "bg-orange-500/15 text-orange-300 border border-orange-500/30";
  return "bg-zinc-700/40 text-zinc-400 border border-zinc-600/30";
}

function incidentId(id) {
  return `INC-${id.slice(0, 6).toUpperCase()}`;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-white/5 animate-pulse space-y-2">
      <div className="h-3 w-28 bg-zinc-800 rounded" />
      <div className="h-2.5 w-40 bg-zinc-800/70 rounded" />
      <div className="h-4 w-16 bg-zinc-800/50 rounded-full" />
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="flex-1 animate-pulse space-y-3 p-1">
      <div className="h-3 w-3/4 bg-zinc-800 rounded" />
      <div className="h-3 w-full bg-zinc-800/70 rounded" />
      <div className="h-3 w-5/6 bg-zinc-800/60 rounded" />
      <div className="h-3 w-2/3 bg-zinc-800/50 rounded" />
      <div className="h-3 w-full bg-zinc-800/40 rounded" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyQueue() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600 py-16">
      <CheckCircle className="w-10 h-10 text-emerald-600/50" />
      <p className="text-sm font-bold tracking-wide text-zinc-500">All reports reviewed</p>
      <p className="text-xs text-zinc-600">No incidents pending audit.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportAuditQueue() {
  const [pendingReports, setPendingReports] = useState([]);
  const [selected, setSelected]             = useState(null);
  const [loading, setLoading]               = useState(true);
  const [actionLoading, setActionLoading]   = useState(false);
  const [toast, setToast]                   = useState(null); // { msg, type }

  // ── Real-time Firestore listener ──────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "accidents"),
      where("status", "==", "pending_review"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => {
          const raw = d.data();
          return {
            docId:    d.id,
            id:       incidentId(d.id),
            timestamp: toDateString(raw.timestamp),
            severity:  normalizeSeverity(raw.severity, raw.accidentDetected ?? raw.accident),
            summary:
              raw.llm_summary ||
              raw.geminiReport ||
              raw.report ||
              raw.summary ||
              "No AI summary available for this incident.",
            location:  raw.location || "Unknown",
            raw,
          };
        });
        setPendingReports(docs);
        // Auto-select first if current selection was archived
        setSelected((prev) => {
          if (!prev) return docs[0] ?? null;
          const still = docs.find((d) => d.docId === prev.docId);
          return still ?? docs[0] ?? null;
        });
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        showToast("Failed to connect to database.", "error");
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Approve & Archive ─────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selected || actionLoading) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "accidents", selected.docId), {
        status:      "archived",
        reviewedAt:  serverTimestamp(),
        reviewAction: "approved",
      });
      showToast(`${selected.id} approved and archived.`, "success");
    } catch (e) {
      showToast("Failed to archive report.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Flag for Manual Review ────────────────────────────────────────────────
  const handleFlag = async () => {
    if (!selected || actionLoading) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "accidents", selected.docId), {
        status:       "manual_review",
        reviewedAt:   serverTimestamp(),
        reviewAction: "flagged",
      });
      showToast(`${selected.id} flagged for manual review.`, "warning");
    } catch (e) {
      showToast("Failed to flag report.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === "success" ? "bg-emerald-950 border-emerald-500/40 text-emerald-300" :
          toast.type === "warning" ? "bg-orange-950 border-orange-500/40 text-orange-300" :
                                     "bg-red-950 border-red-500/40 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> :
           toast.type === "warning" ? <Flag className="w-4 h-4" /> :
                                      <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-bold font-mono">{toast.msg}</span>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          Report Audit Queue
        </h2>
        <p className="text-zinc-500 font-medium text-lg">
          Real-time incident review — approve or escalate pending anomaly reports.
        </p>
      </div>

      {/* Main grid */}
      <section className="grid md:grid-cols-2 gap-5 h-[72vh]">

        {/* ── Left: Pending list ── */}
        <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl">
          <div className="sticky top-0 bg-black/80 border-b border-white/5 px-5 py-4 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                <FileSearch className="w-4 h-4 text-zinc-300" />
              </div>
              <span className="text-sm font-black text-white tracking-widest uppercase">
                Pending Reports
              </span>
            </div>
            {!loading && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {pendingReports.length} queued
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : pendingReports.length === 0 ? (
              <EmptyQueue />
            ) : (
              <ul>
                {pendingReports.map((item) => {
                  const isActive = selected?.docId === item.docId;
                  return (
                    <li key={item.docId}>
                      <button
                        onClick={() => setSelected(item)}
                        className={`w-full text-left px-5 py-4 border-b border-white/5 transition-all duration-150 ${
                          isActive
                            ? "bg-zinc-800/70 border-l-2 border-l-white"
                            : "hover:bg-zinc-900/60 border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-black text-white">{item.id}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${severityStyle(item.severity)}`}>
                            {item.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{item.timestamp}</span>
                        </div>
                        {item.location !== "Unknown" && (
                          <p className="text-[10px] text-zinc-600 mt-1 truncate font-mono">{item.location}</p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right: Detail panel ── */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-5 flex flex-col shadow-2xl">
          {!selected && !loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
              <ShieldAlert className="w-10 h-10 opacity-30" />
              <p className="text-sm font-bold text-zinc-500">Select a report to review</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {selected ? `Report Detail: ${selected.id}` : "Loading..."}
                  </h3>
                  {selected && (
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{selected.timestamp}</p>
                  )}
                </div>
                {selected && (
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${severityStyle(selected.severity)}`}>
                    {selected.severity}
                  </span>
                )}
              </div>

              {/* LLM Summary */}
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                  AI Forensic Summary
                </p>
                <div className="flex-1 rounded-xl border border-white/5 bg-black/50 p-4 overflow-y-auto">
                  {loading ? (
                    <SkeletonDetail />
                  ) : (
                    <p className="text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {selected?.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || !selected}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_28px_rgba(16,185,129,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading ? "Processing…" : "Approve & Archive"}
                </button>
                <button
                  onClick={handleFlag}
                  disabled={actionLoading || !selected}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-black font-black text-sm hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_28px_rgba(249,115,22,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Flag className="w-4 h-4" />
                  Flag for Review
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
