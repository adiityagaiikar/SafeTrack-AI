import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, CalendarDays, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IncidentLog() {
  const [searchTerm, setSearchTerm] = useState("");

  const logs = [
    { id: "LOG-01A94X", date: "2026-03-14", time: "10:24 AM", location: "Main St & 5th Ave", plate: "ABC-1234", type: "Vehicle too close", severity: "Moderate" },
    { id: "LOG-02B88Z", date: "2026-03-14", time: "09:41 AM", location: "Highway 401 KM 23", plate: "XYZ-9876", type: "Collision Detected", severity: "Severe" },
    { id: "LOG-03C77Y", date: "2026-03-14", time: "08:15 AM", location: "Downtown Plaza", plate: "UNKNOWN", type: "Pedestrian near miss", severity: "Moderate" },
    { id: "LOG-04D66X", date: "2026-03-14", time: "07:30 AM", location: "Elm St Intersection", plate: "LMN-4567", type: "Speeding", severity: "Minor" },
    { id: "LOG-05E55W", date: "2026-03-14", time: "06:55 AM", location: "Highway 401 KM 12", plate: "QWE-2345", type: "Sudden Braking", severity: "Minor" },
    { id: "LOG-06F44V", date: "2026-03-13", time: "11:20 PM", location: "Main St & 8th Ave", plate: "RTY-5678", type: "Red Light Running", severity: "Severe" },
    { id: "LOG-07G33U", date: "2026-03-13", time: "08:45 PM", location: "Airport Road", plate: "UIO-9012", type: "Speeding", severity: "Minor" },
  ];

  const filteredLogs = logs.filter(log =>
    log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "Severe": return <Badge className="bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] font-black tracking-widest uppercase text-[10px] py-1">Critical Threat</Badge>;
      case "Moderate": return <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)] font-bold tracking-widest uppercase text-[10px] py-1">Moderate</Badge>;
      case "Minor": return <Badge className="bg-white/5 text-zinc-300 border border-white/10 shadow-sm font-bold tracking-widest uppercase text-[10px] py-1">Minor</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 relative">
        <div className="absolute top-0 right-0 w-[300px] h-[150px] bg-zinc-800/10 blur-[80px] rounded-full -z-10 animate-pulse"></div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">Incident LEDGER</h2>
          <p className="text-zinc-500 font-medium text-lg">Immutable database of recorded safety anomalies and spatial violations.</p>
        </div>
        <Button className="bg-white hover:bg-zinc-200 text-zinc-950 border-none shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all rounded-full font-bold px-6">
          <DownloadCloud className="w-4 h-4 mr-2" /> Export JSON
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none opacity-50"></div>
        <CardHeader className="bg-black/40 border-b border-white/5 pb-5 pt-6 px-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg shadow-inner">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-white tracking-widest uppercase text-[12px]">Global Archive | Mar '26</CardTitle>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80 overflow-hidden rounded-full p-px bg-gradient-to-r from-white/10 via-white/30 to-white/10">
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
              <Button variant="outline" className="shrink-0 border-white/10 bg-white/5 text-white hover:bg-white hover:text-zinc-950 rounded-full font-bold px-5 transition-all shadow-sm">
                <Filter className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-black/20 backdrop-blur-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-[140px] font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">System ID</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Timestamp (UTC)</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Spatial Coordinates</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Agent Identifier</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Anomaly Class</TableHead>
                  <TableHead className="text-right font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Threat Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                      <TableCell className="font-bold text-white px-8 py-5">
                        <span className="bg-zinc-900 border border-white/10 text-zinc-300 px-2.5 py-1 rounded shadow-sm font-mono text-xs group-hover:bg-zinc-800 transition-colors">{log.id}</span>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-zinc-200">{log.date}</span>
                          <span className="text-xs font-medium text-zinc-500">{log.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-300 px-8 py-5 tracking-tight">{log.location}</TableCell>
                      <TableCell className="px-8 py-5">
                        {log.plate === "UNKNOWN" ? (
                          <span className="text-xs font-bold text-zinc-600 italic tracking-wider">UNIDENTIFIED</span>
                        ) : (
                          <span className="font-mono font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">{log.plate}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-zinc-300 px-8 py-5">{log.type}</TableCell>
                      <TableCell className="text-right px-8 py-5">{getSeverityBadge(log.severity)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-zinc-600">
                        <Search className="w-8 h-8 mb-4 opacity-30" />
                        <p className="font-bold text-zinc-500 tracking-wide">No telemetry records match your parameters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}