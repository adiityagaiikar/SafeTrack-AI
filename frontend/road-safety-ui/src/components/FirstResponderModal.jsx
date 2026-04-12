import { useEffect } from "react";
import { Ambulance, Camera, Phone, CheckCircle, ShieldAlert, X } from "lucide-react";

/**
 * FirstResponderModal
 * Shown automatically when a CRITICAL severity accident is detected.
 * Provides four large, high-contrast action buttons for a user who may be in shock.
 */
export default function FirstResponderModal({ open, onDismiss }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="frm-title"
    >
      {/* Modal panel */}
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 shadow-[0_0_60px_rgba(239,68,68,0.25)] animate-in zoom-in-95 fade-in duration-300 border-2 border-red-500/70 [animation:pulse-border_1.5s_ease-in-out_infinite]">

        {/* Pulsing border overlay — achieved via box-shadow animation */}
        <style>{`
          @keyframes pulse-border {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2); }
            50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0), 0 0 80px rgba(239,68,68,0.35); }
          }
        `}</style>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="rounded-t-2xl bg-red-600/20 border-b border-red-500/40 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 border border-red-500/40">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p
                  id="frm-title"
                  className="text-xs font-black uppercase tracking-[0.2em] text-red-400 mb-0.5"
                >
                  Emergency Protocol Activated
                </p>
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                  CRITICAL ACCIDENT DETECTED
                </h2>
              </div>
            </div>
            {/* Subtle close — intentionally small so it's not accidentally tapped */}
            <button
              onClick={onDismiss}
              aria-label="Close"
              className="mt-0.5 shrink-0 rounded-full p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm text-red-100/70 leading-relaxed">
            Stay calm. Follow the steps below. Help is on the way.
          </p>
        </div>

        {/* ── Action Buttons ──────────────────────────────────────────────── */}
        <div className="p-5 grid grid-cols-2 gap-3">

          {/* 1 — Call Ambulance */}
          <a
            href="tel:102"
            className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-5 text-center transition-all duration-200 hover:bg-red-500/20 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 group-hover:bg-red-500/30 transition-colors">
              <Ambulance className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-wide">Call Ambulance</p>
              <p className="text-xs text-red-300/80 mt-0.5 font-mono">102</p>
            </div>
          </a>

          {/* 2 — Document Scene */}
          <button
            onClick={() =>
              alert(
                "📸 Document the Scene\n\n• Photograph all vehicles involved\n• Capture road conditions & skid marks\n• Record any visible injuries\n• Note the time and exact location"
              )
            }
            className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-5 text-center transition-all duration-200 hover:bg-amber-500/20 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 group-hover:bg-amber-500/30 transition-colors">
              <Camera className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-wide">Document Scene</p>
              <p className="text-xs text-amber-300/80 mt-0.5">Take photos now</p>
            </div>
          </button>

          {/* 3 — Insurance Hotline */}
          <a
            href="tel:+18001234567"
            className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-blue-500/50 bg-blue-500/10 px-4 py-5 text-center transition-all duration-200 hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/40 group-hover:bg-blue-500/30 transition-colors">
              <Phone className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-wide">Insurance Hotline</p>
              <p className="text-xs text-blue-300/80 mt-0.5 font-mono">1-800-123-4567</p>
            </div>
          </a>

          {/* 4 — I am Safe (dismiss) */}
          <button
            onClick={onDismiss}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-green-500/50 bg-green-500/10 px-4 py-5 text-center transition-all duration-200 hover:bg-green-500/20 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 border border-green-500/40 group-hover:bg-green-500/30 transition-colors">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-wide">I am Safe</p>
              <p className="text-xs text-green-300/80 mt-0.5">Dismiss this alert</p>
            </div>
          </button>
        </div>

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <div className="px-5 pb-5">
          <p className="text-center text-[11px] text-zinc-600 leading-relaxed">
            SOS has been automatically dispatched to your emergency contacts.
            <br />
            Stay at the scene until help arrives unless you are in immediate danger.
          </p>
        </div>
      </div>
    </div>
  );
}
