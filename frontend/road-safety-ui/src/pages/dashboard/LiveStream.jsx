import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Zap, Radio, Scan } from "lucide-react";

export default function LiveStream() {
  const [logs, setLogs] = useState([]);
  const [telemetry, setTelemetry] = useState({});
  const [annotatedFrame, setAnnotatedFrame] = useState("");
  const [wsStatus, setWsStatus] = useState("connecting");
  const [streamError, setStreamError] = useState("");
  const ws = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const addLog = (msg, type = "info") => {
    setLogs((prev) => {
      const next = [
        ...prev,
        { time: new Date().toLocaleTimeString("en-US", { hour12: false }), msg, type },
      ];
      return next.slice(-40);
    });
  };

  const buildWsUrl = () => {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const parsed = new URL(base);
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${parsed.host}/ws/live-feed`;
  };

  const drawAndSendFrame = () => {
    const socket = ws.current;
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!videoEl || !canvasEl || videoEl.readyState < 2) return;

    const width = 640;
    const height = 360;
    canvasEl.width = width;
    canvasEl.height = height;

    const context = canvasEl.getContext("2d");
    context.drawImage(videoEl, 0, 0, width, height);

    const frame = canvasEl.toDataURL("image/jpeg", 0.72);
    socket.send(JSON.stringify({ type: "frame", frame }));
  };

  useEffect(() => {
    let unmounted = false;

    const init = async () => {
      try {
        setWsStatus("connecting");
        addLog("Connecting to secure WebSocket...", "system");

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
          audio: false,
        });

        if (unmounted) return;

        mediaStreamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
        addLog("Camera stream active.", "success");

        const socket = new WebSocket(buildWsUrl());
        ws.current = socket;

        socket.onopen = () => {
          setWsStatus("connected");
          addLog("WebSocket connected. Streaming frames at ~12 FPS.", "success");

          intervalRef.current = setInterval(drawAndSendFrame, 83);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setTelemetry(data?.telemetry || data?.metrics || data || {});

            const incomingFrame = data?.annotated_frame || data?.frame || data?.image || "";
            if (incomingFrame) {
              const normalized = incomingFrame.startsWith("data:image")
                ? incomingFrame
                : `data:image/jpeg;base64,${incomingFrame}`;
              setAnnotatedFrame(normalized);
            }
          } catch {
            addLog("Received non-JSON websocket payload.", "warning");
          }
        };

        socket.onerror = () => {
          setWsStatus("error");
          setStreamError("WebSocket connection failed.");
          addLog("WebSocket error. Unable to reach live-feed endpoint.", "danger");
        };

        socket.onclose = () => {
          setWsStatus((prev) => (prev === "error" ? prev : "disconnected"));
          addLog("WebSocket disconnected.", "warning");
        };
      } catch (error) {
        const message = error?.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : error?.message || "Failed to initialize live stream.";

        setStreamError(message);
        setWsStatus("error");
        addLog(message, "danger");
      }
    };

    init();

    return () => {
      unmounted = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-8 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Live Feed Analysis</h2>
          <p className="text-zinc-500 font-medium text-lg">Real-time YOLOv8 spatial computing and trajectory prediction.</p>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-black/40 backdrop-blur-md px-5 py-3 border border-white/10 rounded-2xl shadow-xl shadow-black/50">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Model Profile</span>
            <span className="text-sm font-bold text-white tracking-widest font-mono">YOLOv8x-Seg</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Inference</span>
            <span className="text-sm font-bold text-green-400 font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">8.4ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-125">

        {/* Main Video Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <Card className="flex-1 overflow-hidden glass-card border-none shadow-2xl flex flex-col relative group">
            <div className="bg-[#050505] flex-1 relative flex items-center justify-center overflow-hidden m-1.5 rounded-[0.8rem] border border-white/5">

              {/* Decorative grid overlay for "tech" feel */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none mix-blend-overlay"></div>

              {/* Watermark/Status */}
              <div className="absolute top-6 left-6 flex gap-3 z-10">
                <Badge className="bg-red-500 text-white border border-red-400 animate-pulse flex items-center gap-1.5 px-3 py-1.5 shadow-[0_0_20px_rgba(239,68,68,0.6)] font-black tracking-widest text-[10px]">
                  <Radio className="w-3.5 h-3.5" /> LIVE RECON
                </Badge>
                <Badge variant="secondary" className="bg-black/60 text-zinc-300 border border-white/10 backdrop-blur-xl px-4 py-1.5 font-bold tracking-widest uppercase text-[10px]">
                  Cam 01: Node Alpha
                </Badge>
              </div>

              <div className="absolute top-6 right-6 z-10">
                <Badge variant="secondary" className="bg-black/60 text-green-400 border border-green-500/30 backdrop-blur-xl font-mono flex gap-1.5 px-3 py-1.5 shadow-[0_0_20px_rgba(34,197,94,0.2)] font-bold text-xs">
                  <Zap className="w-3.5 h-3.5" /> {wsStatus === "connected" ? "~12 FPS" : "-- FPS"}
                </Badge>
              </div>

              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {annotatedFrame && (
                <img src={annotatedFrame} alt="Annotated live feed" className="absolute inset-0 h-full w-full object-cover" />
              )}

              {wsStatus !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Scan className="w-16 h-16 text-zinc-500 mb-4 animate-[spin_12s_linear_infinite]" />
                  <p className="text-sm font-bold tracking-widest uppercase text-zinc-300">
                    {wsStatus === "connecting" ? "Connecting to Secure WebSocket..." : "Stream Offline"}
                  </p>
                  {streamError && <p className="mt-2 text-xs text-red-300">{streamError}</p>}
                </div>
              )}

            </div>
          </Card>
        </div>

        {/* Side Panel: AI Assistant Logs */}
        <div className="lg:col-span-1 h-full min-h-100">
          <Card className="h-full flex flex-col glass-card border-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-zinc-500 to-transparent"></div>
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                  <ShieldAlert className="w-4 h-4 text-zinc-300" />
                </div>
                <span className="font-black text-[13px] text-white tracking-widest uppercase items-center flex">Telemetry Stream</span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-5 bg-[#050505]/95 backdrop-blur-3xl relative">
              <div className="space-y-5 font-mono text-[11.5px] leading-relaxed">
                <div className="rounded-md border border-white/10 bg-black/40 p-3 text-zinc-300">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Live Telemetry JSON</p>
                  <pre className="max-h-40 overflow-auto text-[11px] whitespace-pre-wrap wrap-break-word">{JSON.stringify(telemetry, null, 2)}</pre>
                </div>

                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 group">
                    <span className="text-zinc-600/70 shrink-0 select-none">[{log.time}]</span>
                    <span className={`transition-all duration-300 ${log.type === "system" ? "text-blue-400 group-hover:text-blue-300 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" :
                      log.type === "info" ? "text-zinc-400 group-hover:text-zinc-300" :
                        log.type === "success" ? "text-green-400 group-hover:text-green-300 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" :
                          log.type === "warning" ? "text-yellow-400 group-hover:text-yellow-300 font-bold drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" :
                            "text-red-400 group-hover:text-red-300 font-black tracking-wide drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                      }`}>
                      {log.msg}
                    </span>
                  </div>
                ))}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <span className="text-zinc-600/70 shrink-0">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                  <span className="text-zinc-500 flex items-center gap-2 font-bold tracking-widest uppercase text-[10px]">
                    Awaiting Tensor Data
                    <span className="flex gap-1 ml-1">
                      <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
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