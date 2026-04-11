import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Video, ShieldAlert, Zap, Radio, Scan } from "lucide-react";

export default function LiveStream() {
  const [logs, setLogs] = useState([]);
  const [detections, setDetections] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    // Initiate WebSocket Connection to FastAPI Engine
    ws.current = new WebSocket("ws://localhost:8000/api/detection/ws");

    ws.current.onopen = () => {
      setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "WebSocket Connection Established. Initializing DeepSORT...", type: "system" }]);
      // Send a dummy frame trigger to kick off inference (the backend is expecting string)
      ws.current.send("START_INFERENCE");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setDetections(data.detections || []);
      setRiskAssessment(data.risk_assessment || null);

      if (data.risk_assessment && data.risk_assessment.warning !== "None") {
        setLogs((prev) => {
          const newLogs = [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: `🚨 ${data.risk_assessment.warning} (TTC: ${data.risk_assessment.ttc}s)`, type: "danger" }];
          return newLogs.slice(-15); // Keep last 15 logs
        });
      }

      // Request next frame inference simulating video loop
      setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send("NEXT_FRAME");
        }
      }, 500);
    };

    return () => {
      if (ws.current) ws.current.close();
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">

        {/* Main Video Area */}
        <div className="lg:col-span-3 flex flex-col h-full">
          <Card className="flex-1 overflow-hidden glass-card border-none shadow-2xl flex flex-col relative group">
            <div className="bg-[#050505] flex-1 relative flex items-center justify-center overflow-hidden m-1.5 rounded-[0.8rem] border border-white/5">

              {/* Decorative grid overlay for "tech" feel */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay"></div>

              {/* Dynamic Bounding Boxes from WebSocket */}
              {detections.map((det, idx) => {
                const colorClass = det.class === 'person' ? 'orange' : 'green';

                return (
                  <div key={idx} className={`absolute top-[${det.bbox[1]}px] left-[${det.bbox[0]}px] w-48 h-32 border-[1.5px] border-${colorClass}-500 bg-${colorClass}-500/10 flex items-start pointer-events-none transition-all duration-300 ease-out shadow-[0_0_30px_rgba(34,197,94,0.15)]`}
                    style={{ top: `${det.bbox[1] / 6}%`, left: `${det.bbox[0] / 6}%` }}>
                    <div className={`bg-${colorClass}-500 text-black font-mono text-[10px] font-bold px-1.5 py-0.5 shadow-[0_0_15px_rgba(34,197,94,0.8)] uppercase`}>
                      {det.class} {det.confidence}
                    </div>
                    {det.class === 'car' && riskAssessment && riskAssessment.warning !== 'None' && (
                      <div className="absolute -bottom-7 w-full text-center">
                        <span className="bg-black text-red-400 text-[10px] font-mono font-bold px-2 py-1 rounded backdrop-blur-md border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]">TTC: {riskAssessment.ttc}s</span>
                      </div>
                    )}
                    {/* Crosshairs */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white drop-shadow-[0_0_2px_rgba(255,255,255,1)]"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white drop-shadow-[0_0_2px_rgba(255,255,255,1)]"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white drop-shadow-[0_0_2px_rgba(255,255,255,1)]"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white drop-shadow-[0_0_2px_rgba(255,255,255,1)]"></div>
                  </div>
                );
              })}

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
                  <Zap className="w-3.5 h-3.5" /> 59.9 FPS
                </Badge>
              </div>

              {/* Center Placeholder Text */}
              <div className="flex flex-col items-center justify-center opacity-30 select-none">
                <Scan className="w-24 h-24 text-zinc-600 mb-6 animate-[spin_12s_linear_infinite]" />
                <span className="text-zinc-500 text-sm font-black tracking-[0.5em] uppercase bg-black/50 px-6 py-2 rounded-full border border-white/5 backdrop-blur-md">Tactical Feed</span>
              </div>

            </div>
          </Card>
        </div>

        {/* Side Panel: AI Assistant Logs */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
          <Card className="h-full flex flex-col glass-card border-none shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-500 to-transparent"></div>
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