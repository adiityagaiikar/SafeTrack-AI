import React, { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Cpu, RefreshCw } from "lucide-react";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─── Slider row ───────────────────────────────────────────────────────────────
function SliderRow({ label, hint, value, min, max, step, onChange, format }) {
  return (
    <label className="block group">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-zinc-200">{label}</span>
          {hint && <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">{hint}</p>}
        </div>
        <span className="text-sm font-black font-mono text-orange-400 tabular-nums min-w-[3rem] text-right">
          {format ? format(value) : value}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-100"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full opacity-0 h-2 -mt-2 cursor-pointer relative z-10"
      />
    </label>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
      isError
        ? "bg-red-950 border-red-500/40 text-red-300"
        : "bg-emerald-950 border-emerald-500/40 text-emerald-300"
    }`}>
      {isError
        ? <AlertTriangle className="w-4 h-4 shrink-0" />
        : <CheckCircle className="w-4 h-4 shrink-0" />}
      <span className="text-sm font-bold font-mono">{toast.msg}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SliderSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-36 bg-zinc-800 rounded" />
            <div className="h-3 w-10 bg-zinc-800 rounded" />
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ModelConfigPanel() {
  const [conf,      setConf]      = useState(0.25);
  const [confCrit,  setConfCrit]  = useState(0.60);
  const [iou,       setIou]       = useState(0.45);
  const [frameSkip, setFrameSkip] = useState(2);
  const [modelOnline, setModelOnline] = useState(false);

  const [loading,   setLoading]   = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch current config on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${BASE}/api/model/config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setConf(data.conf_general   ?? 0.25);
        setConfCrit(data.conf_critical ?? 0.60);
        setIou(data.iou             ?? 0.45);
        setFrameSkip(data.frame_skip ?? 2);
        setModelOnline(data.model_online ?? false);
      } catch (e) {
        showToast(`Failed to load config: ${e.message}`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // ── Deploy weights ──────────────────────────────────────────────────────────
  const handleDeploy = async () => {
    if (deploying) return;
    setDeploying(true);
    try {
      const res = await fetch(`${BASE}/api/model/config`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conf_general:  conf,
          conf_critical: confCrit,
          iou,
          frame_skip:    frameSkip,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("Config deployed — model updated in real-time.", "success");
    } catch (e) {
      showToast(`Deploy failed: ${e.message}`, "error");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Page header */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            Model Configuration
          </h2>
          <p className="text-zinc-500 font-medium text-lg">
            Hot-update YOLOv8 inference parameters without restarting the server.
          </p>
        </div>

        <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <Cpu className="w-4 h-4 text-zinc-300" />
              </div>
              <div>
                <p className="text-sm font-black text-white tracking-widest uppercase">
                  YOLOv8 Collision Parameters
                </p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Changes apply to the live WebSocket feed immediately on deploy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${modelOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-red-500"}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${modelOnline ? "text-emerald-400" : "text-red-400"}`}>
                {modelOnline ? "Model Online" : "Model Offline"}
              </span>
            </div>
          </div>

          {/* Sliders */}
          <div className="px-6 py-6 space-y-7">
            {loading ? <SliderSkeleton /> : (
              <>
                <SliderRow
                  label="Confidence Threshold"
                  hint="Minimum score for a detection to be accepted"
                  value={conf} min={0.05} max={1.0} step={0.01}
                  onChange={setConf}
                  format={(v) => v.toFixed(2)}
                />
                <SliderRow
                  label="Critical Confidence Threshold"
                  hint="Score required to flag a detection as CRITICAL"
                  value={confCrit} min={0.05} max={1.0} step={0.01}
                  onChange={setConfCrit}
                  format={(v) => v.toFixed(2)}
                />
                <SliderRow
                  label="IoU Threshold"
                  hint="Intersection-over-Union for non-max suppression"
                  value={iou} min={0.05} max={1.0} step={0.01}
                  onChange={setIou}
                  format={(v) => v.toFixed(2)}
                />
                <SliderRow
                  label="Frame Skip Rate"
                  hint="Process every Nth frame — higher = faster, less accurate"
                  value={frameSkip} min={1} max={10} step={1}
                  onChange={setFrameSkip}
                  format={(v) => `${v}x`}
                />
              </>
            )}
          </div>

          {/* Current values summary */}
          {!loading && (
            <div className="mx-6 mb-6 rounded-xl border border-white/5 bg-black/40 px-4 py-3 grid grid-cols-4 gap-3">
              {[
                { label: "Conf",       value: conf.toFixed(2) },
                { label: "Crit Conf",  value: confCrit.toFixed(2) },
                { label: "IoU",        value: iou.toFixed(2) },
                { label: "Frame Skip", value: `${frameSkip}x` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{label}</p>
                  <p className="text-sm font-black font-mono text-orange-400 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Deploy button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleDeploy}
              disabled={deploying || loading}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-orange-500 text-black font-black text-sm tracking-widest uppercase hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deploying
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Deploying...</>
                : <><CheckCircle className="w-4 h-4" /> Deploy Weights</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
