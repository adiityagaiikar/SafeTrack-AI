import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Video, AlertTriangle, AlertOctagon, Timer, TrendingDown, ArrowUpRight } from "lucide-react";

export default function Overview() {
  const recentIncidents = [
    { id: "INC-001", time: "10:24 AM", location: "Main St & 5th Ave", type: "Vehicle too close", severity: "Moderate" },
    { id: "INC-002", time: "09:41 AM", location: "Highway 401 KM 23", type: "Collision Detected", severity: "Severe" },
    { id: "INC-003", time: "08:15 AM", location: "Downtown Plaza", type: "Pedestrian near miss", severity: "Moderate" },
    { id: "INC-004", time: "07:30 AM", location: "Elm St Intersection", type: "Speeding", severity: "Minor" },
    { id: "INC-005", time: "06:55 AM", location: "Highway 401 KM 12", type: "Sudden Braking", severity: "Minor" },
  ];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "Severe": return <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:bg-red-500/20 transition-colors uppercase tracking-widest text-[10px] py-1 font-bold">Severe Risk</Badge>;
      case "Moderate": return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:bg-orange-500/20 transition-colors uppercase tracking-widest text-[10px] py-1 font-bold">Moderate</Badge>;
      case "Minor": return <Badge className="bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-widest text-[10px] py-1 font-bold">Minor</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Overview Dashboard</h2>
        <p className="text-zinc-500 font-medium text-lg">Real-time transportation network health and inference analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] transition-all duration-500 border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
            <Video className="h-24 w-24 text-white" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Active Feeds</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner group-hover:bg-white/10 transition-colors">
              <Video className="h-4 w-4 text-zinc-300" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-5xl font-black text-white tracking-tighter mb-2">24<span className="text-2xl text-zinc-600 font-medium">/24</span></div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-green-500 mt-1 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              100% Uptime
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group hover:shadow-[0_0_30px_rgba(239,68,68,0.05)] transition-all duration-500 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Collisions (24h)</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 shadow-inner group-hover:bg-red-500/20 transition-colors">
              <AlertOctagon className="h-4 w-4 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-5xl font-black text-white tracking-tighter mb-2">3</div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-green-500 mt-1 flex items-center gap-1 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
              <TrendingDown className="h-3.5 w-3.5" /> 25% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group hover:shadow-[0_0_30px_rgba(249,115,22,0.05)] transition-all duration-500 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Avg Severity</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20 shadow-inner group-hover:bg-orange-500/20 transition-colors">
              <AlertTriangle className="h-4 w-4 text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-5xl font-black text-orange-400 tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.2)]">4.2</div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-1 flex items-center gap-1">
              Moderate Risk Index
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] transition-all duration-500 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Inference Delay</CardTitle>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner group-hover:bg-white/10 transition-colors">
              <Timer className="h-4 w-4 text-zinc-300" />
            </div>
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-5xl font-black text-white tracking-tighter mb-2">12<span className="text-2xl text-zinc-600 font-medium">ms</span></div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-1 flex items-center gap-1">
              YOLOv8 Edge Device
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <CardHeader className="border-b border-white/5 pb-5 pt-7 px-8 bg-black/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-extrabold text-white tracking-tight">Recent Validated Detections</CardTitle>
            <button className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">
              Complete Log <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-black/20 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-[120px] font-extrabold text-zinc-600 uppercase tracking-widest text-[10px] py-4 px-8">Audit ID</TableHead>
                <TableHead className="font-extrabold text-zinc-600 uppercase tracking-widest text-[10px] py-4 px-8">Timestamp</TableHead>
                <TableHead className="font-extrabold text-zinc-600 uppercase tracking-widest text-[10px] py-4 px-8">Geo-Location</TableHead>
                <TableHead className="font-extrabold text-zinc-600 uppercase tracking-widest text-[10px] py-4 px-8">Classification</TableHead>
                <TableHead className="text-right font-extrabold text-zinc-600 uppercase tracking-widest text-[10px] py-4 px-8">Risk Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentIncidents.map((incident) => (
                <TableRow key={incident.id} className="border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                  <TableCell className="font-bold text-white px-8 py-4 font-mono text-sm">{incident.id}</TableCell>
                  <TableCell className="font-semibold text-zinc-400 px-8 py-4">{incident.time}</TableCell>
                  <TableCell className="font-medium text-zinc-300 px-8 py-4">{incident.location}</TableCell>
                  <TableCell className="font-medium text-zinc-300 px-8 py-4">{incident.type}</TableCell>
                  <TableCell className="text-right px-8 py-4">{getSeverityBadge(incident.severity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}