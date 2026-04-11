import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, CalendarDays, DownloadCloud, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncidents } from "@/hooks/useIncidents";
import { downloadInsurancePDF } from "@/utils/generateClaim";

export default function IncidentLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [compilingId, setCompilingId] = useState("");
  const { incidents, loading, error } = useIncidents("accidents");

  const filteredLogs = incidents.filter(log =>
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
        snapshotUrl: incident.raw?.snapshotUrl || incident.raw?.imageUrl || incident.raw?.frameUrl || "",
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 relative">
        <div className="absolute top-0 right-0 w-75 h-37.5 bg-zinc-800/10 blur-[80px] rounded-full -z-10 animate-pulse"></div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">Incident LEDGER</h2>
          <p className="text-zinc-500 font-medium text-lg">Immutable database of recorded safety anomalies and spatial violations.</p>
        </div>
        <Button className="bg-white hover:bg-zinc-200 text-zinc-950 border-none shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all rounded-full font-bold px-6">
          <DownloadCloud className="w-4 h-4 mr-2" /> Export JSON
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent pointer-events-none opacity-50"></div>
        <CardHeader className="bg-black/40 border-b border-white/5 pb-5 pt-6 px-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg shadow-inner">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-white tracking-widest uppercase text-[12px]">Global Archive | Mar '26</CardTitle>
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
              <Button variant="outline" className="shrink-0 border-white/10 bg-white/5 text-white hover:bg-white hover:text-zinc-950 rounded-full font-bold px-5 transition-all shadow-sm">
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="w-35 font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">System ID</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Timestamp (UTC)</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Spatial Coordinates</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Agent Identifier</TableHead>
                  <TableHead className="font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Anomaly Class</TableHead>
                  <TableHead className="text-right font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Threat Level</TableHead>
                  <TableHead className="text-right font-black text-zinc-600 uppercase tracking-widest text-[9px] py-5 px-8">Forensic PDF</TableHead>
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
                      <TableCell className="text-right px-8 py-5">
                        <Button
                          onClick={() => handleDownloadReport(log)}
                          disabled={Boolean(compilingId)}
                          className="rounded-full bg-zinc-950 border border-orange-500/50 text-orange-300 hover:bg-zinc-900 hover:text-orange-200 shadow-[0_0_14px_rgba(249,115,22,0.25)]"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          {compilingId === log.id ? "Compiling Evidence..." : "Download Forensic Report (PDF)"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
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