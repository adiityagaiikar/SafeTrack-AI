import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Zap, Radio, Scan, Eye, EyeOff, AlertTriangle } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const FRAME_W = 640;
const FRAME_H = 360;

// Distance thresholds (metres)
const DIST_SAFE     = 10.0;
const DIST_MID      = 5.0;
const DIST_HAZARD   = 3.0;

// Colour palette — matches Tailwind blue-400 / orange-400 / red-500
const C_SAFE   = "#60a5fa";
const C_MID    = "#fb923c";
const C_HAZARD = "#ef4444";

// Corner bracket geometry
const BRACKET_ARM = 16;   // px length of each L-arm
const BRACKET_W_SAFE   = 1.8;
const BRACKET_W_MID    = 2.2;
const BRACKET_W_HAZARD = 3.0;

function getColor(dist) {
  if (dist > 0 && dist < DIST_MID)  return C_HAZARD;
  if (dist > 0 && dist < DIST_SAFE) return C_MID;
  return C_SAFE;
}

function getLineWidth(dist) {
  if (dist > 0 && dist < DIST_MID)  return BRACKET_W_HAZARD;
  if (dist > 0 && dist < DIST_SAFE) return BRACKET_W_MID;
  return BRACKET_W_SAFE;
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

/** Four L-shaped corner brackets — no full rectangle */
function drawBrackets(ctx, x, y, w, h, color, lw) {
  const L = Math.min(BRACKET_ARM, w * 0.28, h * 0.28);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.lineCap     = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur  = lw > 2 ? 14 : 7;

  const pts = [
    // top-left
    [[x + L, y], [x, y], [x, y + L]],
    // top-right
    [[x + w - L, y], [x + w, y], [x + w, y + L]],
    // bottom-left
    [[x + L, y + h], [x, y + h], [x, y + h - L]],
    // bottom-right
    [[x + w - L, y + h], [x + w, y + h], [x + w, y + h - L]],
  ];

  for (const [a, b, c] of pts) {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

/** Proximity fill tint inside the bracket area */
function drawTint(ctx, x, y, w, h, color) {
  const hex = color.replace(
    /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
    (_, r, g, b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},0.15)`
  );
  ctx.fillStyle = hex;
  ctx.fillRect(x, y, w, h);
}

/** Dotted spatial-connection line from screen bottom-centre to vehicle bottom-centre */
function drawSpatialLine(ctx, vehBotX, vehBotY, canvasH, color, lw) {
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = color;
  ctx.lineWidth   = Math.max(lw - 0.8, 0.8);
  ctx.globalAlpha = 0.45;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 6;
  ctx.beginPath();
  ctx.moveTo(vehBotX, vehBotY);
  ctx.lineTo(vehBotX, canvasH);
  ctx.stroke();
  ctx.restore();
}

/** Glassmorphism telemetry badge above the bracket */
function drawGlassBadge(ctx, x, y, det, color) {
  const statusStr =
    det.status === "approaching" ? "APPROACHING" :
    det.status === "receding"    ? "RECEDING"    : "STATIC";
  const velAbs = det.velocity !== undefined ? Math.abs(det.velocity) : 0;
  const label  = `ID: ${det.id} | ${det.distance > 0 ? det.distance + "m" : "—"} | ${velAbs}km/h`;
  const sub    = statusStr;

  const fontSize    = 10.5;
  const subFontSize = 9;
  ctx.font = `bold ${fontSize}px "JetBrains Mono","Fira Mono",monospace`;
  const mainW = ctx.measureText(label).width;
  ctx.font = `bold ${subFontSize}px "JetBrains Mono","Fira Mono",monospace`;
  const subW  = ctx.measureText(sub).width;
  const bw    = Math.max(mainW, subW) + 18;
  const bh    = fontSize + subFontSize + 14;
  const bx    = Math.max(x, 2);
  const by    = Math.max(y - bh - 6, 2);

  // Glass background
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle   = "rgba(15,23,42,0.72)";
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 5);
  else ctx.rect(bx, by, bw, bh);
  ctx.fill();
  ctx.restore();

  // Glass border
  ctx.strokeStyle = color;
  ctx.lineWidth   = 0.8;
  ctx.globalAlpha = 0.7;
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 5);
  else ctx.rect(bx, by, bw, bh);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Main label
  ctx.font      = `bold ${fontSize}px "JetBrains Mono","Fira Mono",monospace`;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(label, bx + 9, by + fontSize + 4);

  // Status sub-label
  ctx.font      = `bold ${subFontSize}px "JetBrains Mono","Fira Mono",monospace`;
  ctx.fillStyle = color;
  ctx.fillText(sub, bx + 9, by + fontSize + subFontSize + 8);
}

// ─── ADAS drivable-area trapezoid ────────────────────────────────────────────
function drawADASPath(ctx, cw, ch) {
  // Vanishing point: centre-top of bottom half
  const vpX  = cw * 0.5;
  const vpY  = ch * 0.42;          // horizon line
  const inset = cw * 0.08;         // how far in from corners at the bottom

  // Four trapezoid corners
  const bl = { x: inset,        y: ch };       // bottom-left
  const br = { x: cw - inset,   y: ch };       // bottom-right
  const tl = { x: vpX - cw * 0.07, y: vpY };  // top-left  (narrow)
  const tr = { x: vpX + cw * 0.07, y: vpY };  // top-right (narrow)

  // 1. Transparent blue fill
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.closePath();
  ctx.fillStyle = "rgba(59,130,246,0.15)";
  ctx.fill();

  // 2. Dashed orange lane borders (left + right angled lines)
  ctx.setLineDash([15, 15]);
  ctx.lineWidth   = 4;
  ctx.strokeStyle = "#f97316";
  ctx.lineCap     = "round";
  ctx.shadowColor = "#f97316";
  ctx.shadowBlur  = 8;

  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(br.x, br.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.stroke();

  // 3. Solid red bumper line at the very bottom
  ctx.setLineDash([]);
  ctx.lineWidth   = 3;
  ctx.strokeStyle = "#ef4444";
  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.moveTo(bl.x, ch - 1);
  ctx.lineTo(br.x, ch - 1);
  ctx.stroke();

  ctx.restore();
}

// ─── YOLO-style bounding box + label chip ────────────────────────────────────
function drawDetection(ctx, det, sx, sy) {
  const [x1, y1, x2, y2] = det.box ?? det.bbox ?? [0, 0, 0, 0];
  const rx = x1 * sx;
  const ry = y1 * sy;
  const rw = (x2 - x1) * sx;
  const rh = (y2 - y1) * sy;

  const dist      = det.distance ?? 0;
  const isHazard  = dist > 0 && dist < DIST_HAZARD;
  const boxColor  = isHazard ? "#ef4444" : "#4ade80";   // red if hazard, neon-green otherwise

  // Bounding box
  ctx.save();
  ctx.strokeStyle = boxColor;
  ctx.lineWidth   = 2;
  ctx.shadowColor = boxColor;
  ctx.shadowBlur  = 6;
  ctx.strokeRect(rx, ry, rw, rh);

  // Label chip
  const label     = `${det.label ?? "vehicle"} #${det.id ?? "?"} ${dist > 0 ? dist + "m" : ""}`.trim();
  const fontSize  = 11;
  ctx.font        = `bold ${fontSize}px "JetBrains Mono","Fira Mono",monospace`;
  const textW     = ctx.measureText(label).width;
  const chipH     = fontSize + 8;
  const chipY     = ry - chipH;
  const chipX     = rx;

  ctx.fillStyle   = boxColor;
  ctx.shadowBlur  = 0;
  if (ctx.roundRect) ctx.roundRect(chipX, Math.max(chipY, 0), textW + 10, chipH, [3, 3, 0, 0]);
  else ctx.rect(chipX, Math.max(chipY, 0), textW + 10, chipH);
  ctx.fill();

  ctx.fillStyle = chipY < 0 ? boxColor : "#000";
  ctx.fillStyle = "#000";
  ctx.shadowBlur = 0;
  ctx.fillText(label, chipX + 5, Math.max(chipY, 0) + fontSize + 1);

  ctx.restore();
}

// ─── Master HUD draw — called every rAF tick ─────────────────────────────────
function drawHUD(ctx, detections, cw, ch, flashOn, showOverlay) {
  ctx.clearRect(0, 0, cw, ch);
  if (!showOverlay) return;

  // 1. ADAS path — always visible when overlay is on
  drawADASPath(ctx, cw, ch);

  if (!detections.length) return;

  const sx = cw / FRAME_W;
  const sy = ch / FRAME_H;

  // 2. Per-detection: spatial line + YOLO box
  for (const det of detections) {
    const [x1, y1, x2, y2] = det.box ?? det.bbox ?? [0, 0, 0, 0];
    const rx   = x1 * sx;
    const ry   = y1 * sy;
    const rw   = (x2 - x1) * sx;
    const rh   = (y2 - y1) * sy;
    const dist = det.distance ?? 0;
    const color = getColor(dist);
    const lw    = getLineWidth(dist);

    // Proximity tint
    if (dist > 0 && dist < DIST_SAFE) drawTint(ctx, rx, ry, rw, rh, color);

    // Spatial drop-line
    drawSpatialLine(ctx, rx + rw / 2, ry + rh, ch, color, lw);

    // YOLO-style box + label
    drawDetection(ctx, det, sx, sy);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveStream() {
  const [logs, setLogs]                 = useState([]);
  const [telemetry, setTelemetry]       = useState({});
  const [wsStatus, setWsStatus]         = useState("connecting");
  const [streamError, setStreamError]   = useState("");
  const [detections, setDetections]     = useState([]);
  const [hazardAlert, setHazardAlert]   = useState(false);
  const [collisionVec, setCollisionVec] = useState(false);
  const [showOverlay, setShowOverlay]   = useState(true);

  // Refs — hot-path reads never trigger re-renders
  const ws              = useRef(null);
  const videoRef        = useRef(null);
  const sendCanvasRef   = useRef(null);
  const overlayRef      = useRef(null);
  const intervalRef     = useRef(null);
  const rafRef          = useRef(null);
  const mediaStreamRef  = useRef(null);
  const detectionsRef   = useRef([]);
  const showOverlayRef  = useRef(true);
  const flashRef        = useRef(false);
  const flashTimerRef   = useRef(null);
  const hazardLoggedRef = useRef(false);

  useEffect(() => { detectionsRef.current  = detections;  }, [detections]);
  useEffect(() => { showOverlayRef.current = showOverlay; }, [showOverlay]);

  const addLog = useCallback((msg, type = "info") => {
    setLogs((prev) => [...prev, {
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      msg, type,
    }].slice(-40));
  }, []);

  const buildWsUrl = () => {
    const base   = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const parsed = new URL(base);
    return `${parsed.protocol === "https:" ? "wss:" : "ws:"}//${parsed.host}/ws/live-feed`;
  };

  // ── Sync canvas resolution to video element size ─────────────────────────
  // Called on every rAF tick — ensures pixel-perfect overlay alignment
  const syncCanvasSize = () => {
    const canvas  = overlayRef.current;
    const videoEl = videoRef.current;
    if (!canvas || !videoEl) return;
    const { clientWidth: cw, clientHeight: ch } = videoEl;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width  = cw;
      canvas.height = ch;
      // Position canvas exactly over video
      canvas.style.width  = `${cw}px`;
      canvas.style.height = `${ch}px`;
    }
  };

  // ── Encode + send frame ──────────────────────────────────────────────────
  const sendFrame = useCallback(() => {
    const socket  = ws.current;
    const videoEl = videoRef.current;
    const canvas  = sendCanvasRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!videoEl || !canvas || videoEl.readyState < 2) return;
    canvas.width  = FRAME_W;
    canvas.height = FRAME_H;
    canvas.getContext("2d").drawImage(videoEl, 0, 0, FRAME_W, FRAME_H);
    socket.send(JSON.stringify({ type: "frame", frame: canvas.toDataURL("image/jpeg", 0.62) }));
  }, []);

  // ── rAF draw loop ────────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    syncCanvasSize();
    const canvas = overlayRef.current;
    if (canvas) {
      drawHUD(
        canvas.getContext("2d"),
        detectionsRef.current,
        canvas.width, canvas.height,
        flashRef.current,
        showOverlayRef.current,
      );
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawLoop]);

  // ── Hazard flash ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (hazardAlert) {
      flashTimerRef.current = setInterval(() => { flashRef.current = !flashRef.current; }, 250);
    } else {
      flashRef.current = false;
      clearInterval(flashTimerRef.current);
      hazardLoggedRef.current = false;
    }
    return () => clearInterval(flashTimerRef.current);
  }, [hazardAlert]);

  // ── Collision-vector beep ────────────────────────────────────────────────
  useEffect(() => {
    if (!collisionVec) return;
    try {
      const ac   = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(960, ac.currentTime);
      gain.gain.setValueAtTime(0.07, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
      osc.start(); osc.stop(ac.currentTime + 0.25);
    } catch { /* AudioContext may require user gesture */ }
  }, [collisionVec]);

  // ── Camera + WebSocket init ──────────────────────────────────────────────
  useEffect(() => {
    let unmounted = false;

    const init = async () => {
      try {
        setWsStatus("connecting");
        addLog("Initialising spatial engine...", "system");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
          audio: false,
        });
        if (unmounted) return;

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        addLog("Camera stream active. HUD armed.", "success");

        const socket = new WebSocket(buildWsUrl());
        ws.current   = socket;

        socket.onopen = () => {
          setWsStatus("connected");
          addLog("ByteTrack spatial engine online — 10 FPS.", "success");
          intervalRef.current = setInterval(sendFrame, 100); // 10 FPS
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.skipped) return;

            const dets = Array.isArray(data?.detections) ? data.detections : [];
            setDetections(dets);
            detectionsRef.current = dets;

            const hazard = Boolean(data?.hazard_alert);
            const cvec   = Boolean(data?.collision_vector);
            setHazardAlert(hazard);
            setCollisionVec(cvec);

            if (hazard && !hazardLoggedRef.current) {
              addLog("🚨 HAZARD — approaching vehicle < 3m!", "danger");
              hazardLoggedRef.current = true;
            }
            if (cvec) addLog("⚡ COLLISION VECTOR — closing > 1 m/s", "danger");

            setTelemetry(data?.telemetry ?? {});
          } catch {
            addLog("Non-JSON WebSocket payload.", "warning");
          }
        };

        socket.onerror = () => {
          setWsStatus("error");
          setStreamError("WebSocket connection failed.");
          addLog("WebSocket error — spatial engine offline.", "danger");
        };

        socket.onclose = () => {
          setWsStatus((p) => (p === "error" ? p : "disconnected"));
          addLog("WebSocket disconnected.", "warning");
        };

      } catch (err) {
        const msg = err?.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : err?.message || "Failed to initialise live stream.";
        setStreamError(msg);
        setWsStatus("error");
        addLog(msg, "danger");
      }
    };

    init();
    return () => {
      unmounted = true;
      clearInterval(intervalRef.current);
      ws.current?.close();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [addLog, sendFrame]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Live Spatial HUD
          </h2>
          <p className="text-zinc-500 font-medium text-lg">
            YOLOv8 · ByteTrack · Monocular Depth · Collision Vector
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowOverlay((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all duration-200 ${
              showOverlay
                ? "bg-sky-500/10 border-sky-500/40 text-sky-400 hover:bg-sky-500/20"
                : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10 hover:text-white"
            }`}
          >
            {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showOverlay ? "HUD ON" : "HUD OFF"}
          </button>

          <div className="hidden md:flex items-center gap-4 bg-black/40 backdrop-blur-md px-5 py-3 border border-white/10 rounded-2xl shadow-xl">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tracker</span>
              <span className="text-sm font-bold text-white font-mono">ByteTrack</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tracked</span>
              <span className="text-sm font-bold text-green-400 font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                {detections.length}
              </span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">FPS</span>
              <span className="text-sm font-bold text-sky-400 font-mono">
                {wsStatus === "connected" ? "~10" : "--"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">

        {/* ── Video + HUD ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <Card className="flex-1 overflow-hidden glass-card border-none shadow-2xl flex flex-col relative group">
            <div className="bg-[#050505] flex-1 relative flex items-center justify-center overflow-hidden m-1.5 rounded-[0.8rem] border border-white/5">

              {/* Subtle grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay" />

              {/* Status badges */}
              <div className="absolute top-4 left-4 flex gap-2 z-20 flex-wrap">
                <Badge className="bg-red-500 text-white border border-red-400 animate-pulse flex items-center gap-1.5 px-3 py-1.5 shadow-[0_0_20px_rgba(239,68,68,0.6)] font-black tracking-widest text-[10px]">
                  <Radio className="w-3.5 h-3.5" /> LIVE RECON
                </Badge>
                <Badge variant="secondary" className="bg-black/60 text-zinc-300 border border-white/10 backdrop-blur-xl px-4 py-1.5 font-bold tracking-widest uppercase text-[10px]">
                  Cam 01 · Node Alpha
                </Badge>
                {collisionVec && (
                  <Badge className="bg-red-600/90 text-white border border-red-400 animate-pulse flex items-center gap-1.5 px-3 py-1.5 font-black tracking-widest text-[10px]">
                    ⚡ COLLISION VECTOR
                  </Badge>
                )}
              </div>

              <div className="absolute top-4 right-4 z-20">
                <Badge variant="secondary" className="bg-black/60 text-green-400 border border-green-500/30 backdrop-blur-xl font-mono flex gap-1.5 px-3 py-1.5 shadow-[0_0_20px_rgba(34,197,94,0.2)] font-bold text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  {wsStatus === "connected" ? "~10 FPS" : "-- FPS"}
                </Badge>
              </div>

              {/* Full-screen hazard overlay */}
              {hazardAlert && showOverlay && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(239,68,68,0.4) 100%)" }}
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-600/95 border-2 border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.9)] backdrop-blur-sm animate-pulse">
                      <AlertTriangle className="w-6 h-6 text-white" />
                      <span className="text-white font-black text-base tracking-[0.15em] uppercase">
                        HAZARD — COLLISION IMMINENT
                      </span>
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-red-300 font-mono text-xs font-bold tracking-widest uppercase">
                      Approaching vehicle &lt; 3m
                    </span>
                  </div>
                </div>
              )}

              {/* ── Video element — base layer ─────────────────────────── */}
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Hidden encode canvas */}
              <canvas ref={sendCanvasRef} className="hidden" />

              {/* HUD overlay canvas — absolute, pixel-synced to video */}
              <canvas
                ref={overlayRef}
                className="absolute top-0 left-0 pointer-events-none z-10"
                style={{ imageRendering: "pixelated" }}
              />

              {/* Offline overlay */}
              {wsStatus !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
                  <Scan className="w-16 h-16 text-zinc-500 mb-4 animate-[spin_12s_linear_infinite]" />
                  <p className="text-sm font-bold tracking-widest uppercase text-zinc-300">
                    {wsStatus === "connecting" ? "Initialising Spatial Engine..." : "Stream Offline"}
                  </p>
                  {streamError && <p className="mt-2 text-xs text-red-300">{streamError}</p>}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Telemetry panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
          <Card className="h-full flex flex-col glass-card border-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-zinc-500 to-transparent" />

            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                  <ShieldAlert className="w-4 h-4 text-zinc-300" />
                </div>
                <span className="font-black text-[13px] text-white tracking-widest uppercase">
                  Spatial Telemetry
                </span>
              </div>
              {detections.length > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {detections.length} tracked
                </span>
              )}
            </div>

            <ScrollArea className="flex-1 p-4 bg-[#050505]/95 backdrop-blur-3xl">
              <div className="space-y-3 font-mono text-[11px] leading-relaxed">

                {/* Per-vehicle table */}
                {Array.isArray(detections) && detections.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
                    <div className="grid grid-cols-[24px_1fr_48px_52px] border-b border-white/5 px-3 py-2">
                      {["ID", "Status", "Dist", "Vel"].map((h) => (
                        <span key={h} className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{h}</span>
                      ))}
                    </div>
                    {detections.map((d) => {
                      const tc =
                        d.distance > 0 && d.distance < DIST_HAZARD ? "text-red-400" :
                        d.distance > 0 && d.distance < DIST_SAFE   ? "text-orange-400" :
                        "text-sky-400";
                      const icon =
                        d.status === "approaching" ? "▼" :
                        d.status === "receding"    ? "▲" : "●";
                      return (
                        <div
                          key={d.id}
                          className={`grid grid-cols-[24px_1fr_48px_52px] px-3 py-1.5 border-b border-white/5 last:border-0 ${
                            d.distance > 0 && d.distance < DIST_HAZARD ? "bg-red-500/[0.07]" : ""
                          }`}
                        >
                          <span className={`font-black ${tc}`}>{d.id}</span>
                          <span className={`${tc} flex items-center gap-1`}>
                            <span className="text-[9px]">{icon}</span>{d.status}
                          </span>
                          <span className={`font-black tabular-nums ${tc}`}>
                            {d.distance > 0 ? `${d.distance}m` : "—"}
                          </span>
                          <span className={`font-black tabular-nums ${tc}`}>
                            {d.velocity !== undefined ? `${Math.abs(d.velocity)}` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Raw telemetry */}
                <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-zinc-400">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2">
                    {telemetry?.providerTitle || "System Loading..."}
                  </p>
                  {Object.keys(telemetry).length === 0 ? (
                    <p className="text-gray-500 italic text-[10px]">Initializing Neural Engine...</p>
                  ) : (
                    <pre className="max-h-32 overflow-auto text-[10px] whitespace-pre-wrap break-words">
                      {JSON.stringify(telemetry, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Event log */}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-zinc-700 shrink-0">[{log.time}]</span>
                    <span className={
                      log.type === "system"  ? "text-blue-400" :
                      log.type === "success" ? "text-green-400" :
                      log.type === "warning" ? "text-yellow-400 font-bold" :
                      log.type === "danger"  ? "text-red-400 font-black drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]" :
                      "text-zinc-400"
                    }>{log.msg}</span>
                  </div>
                ))}

                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <span className="text-zinc-700 shrink-0">
                    [{new Date().toLocaleTimeString("en-US", { hour12: false })}]
                  </span>
                  <span className="text-zinc-600 flex items-center gap-1.5 font-bold tracking-widest uppercase text-[9px]">
                    Awaiting tensor data
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
