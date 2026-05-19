import React, { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Camera, Clock, Navigation, Zap, RefreshCw, Trash2, ChevronDown, Ambulance, MapPin, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIncidents } from "@/hooks/useIncidents";

// ─── Task 1: Haversine spatial math engine ────────────────────────────────────
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AMBULANCE_SPEED_KMH = 40;

// ─── Task 2: Mock hospital database ──────────────────────────────────────────
const MOCK_HOSPITALS = [
  { id: 1, name: "KEM Hospital Mumbai",              lat: 18.9980, lng: 72.8400, type: "Trauma Centre" },
  { id: 2, name: "Lokmanya Tilak Municipal Hospital", lat: 19.0400, lng: 72.8700, type: "General Hospital" },
  { id: 3, name: "Hinduja Hospital Mahim",            lat: 19.0390, lng: 72.8430, type: "Multi-Specialty" },
  { id: 4, name: "Nanavati Max Super Speciality",     lat: 19.1000, lng: 72.8360, type: "Super Speciality" },
  { id: 5, name: "Fortis Hospital Mulund",            lat: 19.1720, lng: 72.9560, type: "Trauma Centre" },
];

// ─── Static camera nodes across India ────────────────────────────────────────
const CAMERA_NODES = [
  { id: "CAM-MUM-01", lat: 19.0760, lng: 72.8777, label: "Mumbai Central" },
  { id: "CAM-DEL-01", lat: 28.6139, lng: 77.2090, label: "Delhi NCR" },
  { id: "CAM-PUN-01", lat: 18.5204, lng: 73.8567, label: "Pune Ring Rd" },
  { id: "CAM-BLR-01", lat: 12.9716, lng: 77.5946, label: "Bengaluru ORR" },
  { id: "CAM-HYD-01", lat: 17.3850, lng: 78.4867, label: "Hyderabad NH65" },
  { id: "CAM-CHN-01", lat: 13.0827, lng: 80.2707, label: "Chennai ECR" },
  { id: "CAM-AHM-01", lat: 23.0225, lng: 72.5714, label: "Ahmedabad SG Hwy" },
  { id: "CAM-NAG-01", lat: 21.1458, lng: 79.0882, label: "Nagpur Zero Mile" },
];

// ─── 18 Verified Indian Accident Blackspots (Danger Zones) ───────────────────
const DANGER_ZONES = [
  { label: "Delhi-Gurugram Expressway (Rajokri)",       lat: 28.5025, lng: 77.1069 },
  { label: "Yamuna Expressway (Km 55 Mathura)",         lat: 27.8000, lng: 77.6000 },
  { label: "Mumbai-Pune Expressway Khandala Ghat",      lat: 18.7700, lng: 73.3800 },
  { label: "Mumbai-Pune Expressway Khopoli",            lat: 18.7800, lng: 73.3400 },
  { label: "Bengaluru-Mysuru Expressway",               lat: 12.6500, lng: 76.8500 },
  { label: "Chennai-Bengaluru NH48 (Vellore)",          lat: 12.9300, lng: 79.1300 },
  { label: "Jaipur-Ajmer NH8",                          lat: 26.6700, lng: 75.4100 },
  { label: "Lucknow-Agra Expressway (Km 55)",           lat: 27.0000, lng: 80.3500 },
  { label: "NH44 Hyderabad-Bengaluru (Kurnool)",        lat: 15.8300, lng: 78.0500 },
  { label: "Ahmedabad-Vadodara Expressway",             lat: 22.5300, lng: 72.9200 },
  { label: "Pune-Satara NH4 (Katraj Ghat)",             lat: 18.4300, lng: 73.8500 },
  { label: "Chandigarh-Manali NH21 (Bilaspur)",         lat: 31.3400, lng: 76.7600 },
  { label: "Kolkata-Siliguri NH34 (Malda)",             lat: 25.0100, lng: 88.1400 },
  { label: "Agra-Delhi NH2 (Palwal)",                   lat: 28.1500, lng: 77.3300 },
  { label: "Nagpur-Hyderabad NH7 (Adilabad)",           lat: 19.6600, lng: 78.5300 },
  { label: "Surat-Vadodara NH8",                        lat: 21.7100, lng: 72.9900 },
  { label: "Kanpur-Lucknow NH2 (Unnao)",                lat: 26.5500, lng: 80.4900 },
  { label: "Mumbai Eastern Express Hwy (Thane)",        lat: 19.1800, lng: 72.9700 },
];

// ─── Severity helpers ─────────────────────────────────────────────────────────
function sevPercent(inc) {
  // Derive a percentage from severity string or raw score
  if (typeof inc.raw?.severity_pct === "number") return inc.raw.severity_pct;
  if (inc.severity === "Severe") return 90;
  if (inc.severity === "Moderate") return 65;
  return 30;
}

function sevStyle(s) {
  if (s > 80) return { color: "#ef4444", bar: "bg-red-500",   text: "text-red-400",   border: "border-red-500/30",   bg: "bg-red-500/5"   };
  if (s > 50) return { color: "#fbbf24", bar: "bg-amber-400", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5" };
  return       { color: "#fde047",       bar: "bg-yellow-300",text: "text-yellow-300",border: "border-yellow-500/20",bg: "bg-yellow-500/5"};
}

// ─── Filter options ───────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all",      label: "All Incidents" },
  { key: "critical", label: "Critical (>80%)" },
  { key: "moderate", label: "Moderate" },
];

// ─── Map controller — enables flyTo from outside MapContainer ─────────────────
function MapController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 14, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveIncidentMap() {
  const { incidents: rawIncidents, loading, deleteIncident, updateIncidentStatus } = useIncidents("accidents");
  const [dispatching, setDispatching] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const prevCountRef = useRef(0);
  const [newIds, setNewIds] = useState(new Set());

  // ── Task 3: Autonomous Golden Hour Dispatch state ─────────────────────────
  const [dispatchData, setDispatchData] = useState(null); // { hospital, distKm, etaMin, crash }

  // Update last-updated timestamp when data changes
  useEffect(() => {
    if (rawIncidents.length > 0) {
      setLastUpdated(new Date());
    }
    // Detect new critical incidents for pulse animation
    if (rawIncidents.length > prevCountRef.current) {
      const currentIds = new Set(rawIncidents.map((i) => i.id));
      const added = rawIncidents
        .filter((i) => !prevCountRef.current || rawIncidents.indexOf(i) < rawIncidents.length - prevCountRef.current)
        .filter((i) => sevPercent(i) > 80)
        .map((i) => i.id);
      if (added.length > 0) {
        setNewIds(new Set(added));
        setTimeout(() => setNewIds(new Set()), 4000);
      }
    }
    prevCountRef.current = rawIncidents.length;
  }, [rawIncidents]);

  // ── Task 3: Auto-dispatch nearest hospital for latest critical incident ───
  useEffect(() => {
    const criticals = rawIncidents.filter(
      (inc) => sevPercent(inc) > 80 && inc.lat && inc.lng
    );
    if (!criticals.length) { setDispatchData(null); return; }

    const latest = criticals[0]; // most recent critical (sorted desc by timestamp)

    let nearest = null;
    let minDist = Infinity;
    for (const hospital of MOCK_HOSPITALS) {
      const dist = calculateHaversineDistance(latest.lat, latest.lng, hospital.lat, hospital.lng);
      if (dist < minDist) { minDist = dist; nearest = hospital; }
    }

    if (!nearest) return;
    const etaMin = Math.ceil((minDist / AMBULANCE_SPEED_KMH) * 60);
    setDispatchData({ hospital: nearest, distKm: minDist.toFixed(1), etaMin, crash: latest });
  }, [rawIncidents]);

  // Map incidents with severity percentage
  const incidents = rawIncidents.map((inc) => ({
    ...inc,
    severityPct: sevPercent(inc),
  }));

  // Apply filter
  const filtered = incidents.filter((inc) => {
    if (filter === "critical") return inc.severityPct > 80;
    if (filter === "moderate") return inc.severityPct > 50 && inc.severityPct <= 80;
    return true;
  });

  // ── Dispatch handler — updates Firestore status ──────────────────────────
  const handleDispatch = useCallback(async (id) => {
    if (dispatching === id) return;
    setDispatching(id);
    try {
      await updateIncidentStatus(id, "resolved");
    } catch (err) {
      console.error("Dispatch failed:", err);
    } finally {
      setDispatching(null);
    }
  }, [dispatching, updateIncidentStatus]);

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm(`Permanently delete incident ${id.slice(0, 8).toUpperCase()}?\n\nThis action cannot be undone.`)) return;
    try {
      await deleteIncident(id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }, [deleteIncident]);

  // ── Card click → flyTo ─────────────────────────────────────────────────────
  const handleCardClick = useCallback((inc) => {
    setSelectedId(inc.id);
    if (inc.lat && inc.lng) {
      setFlyTarget({ lat: inc.lat, lng: inc.lng, _ts: Date.now() });
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Live Incident Map
          </h2>
          <p className="text-zinc-500 font-medium text-lg mt-1">
            Real-time geospatial tracking — Firebase-synced incidents and nationwide danger zones.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-500">
              {lastUpdated.toLocaleTimeString("en-US", { hour12: false })}
            </span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5">
            <Zap className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
              {filtered.filter(i => i.severityPct > 80).length} Critical
            </span>
          </div>
        </div>
      </div>

      {/* ── Map + Drawer container ── */}
      <div className="relative w-full rounded-2xl border border-slate-700 overflow-hidden shadow-2xl" style={{ height: "620px" }}>

        {/* Leaflet map — full bleed */}
        <MapContainer
          center={[21.1458, 79.0882]}
          zoom={5}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution=""
          />
          <MapController target={flyTarget} />

          {/* Danger Zones — semi-transparent red circles */}
          {DANGER_ZONES.map((zone) => (
            <Circle
              key={zone.label}
              center={[zone.lat, zone.lng]}
              radius={2000}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.08,
                weight: 1,
                dashArray: "6 4",
                opacity: 0.4,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs">
                  <p className="font-bold text-red-500">⚠ Danger Zone</p>
                  <p className="text-zinc-600 font-medium">{zone.label}</p>
                </div>
              </Tooltip>
            </Circle>
          ))}

          {/* Static camera nodes — green */}
          {CAMERA_NODES.map((node) => (
            <CircleMarker
              key={node.id}
              center={[node.lat, node.lng]}
              radius={6}
              pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.9, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <span className="text-xs font-bold">{node.label}</span>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Task 4: Rescue Vector — glowing dashed line from hospital to crash */}
          {dispatchData && (
            <>
              {/* Hospital marker — blue */}
              <CircleMarker
                center={[dispatchData.hospital.lat, dispatchData.hospital.lng]}
                radius={9}
                pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 2 }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="text-xs font-bold">
                    <p className="text-blue-500">🏥 {dispatchData.hospital.name}</p>
                    <p className="text-zinc-400 font-normal">{dispatchData.hospital.type}</p>
                  </div>
                </Tooltip>
              </CircleMarker>

              {/* Rescue vector line */}
              <Polyline
                positions={[
                  [dispatchData.hospital.lat, dispatchData.hospital.lng],
                  [dispatchData.crash.lat,    dispatchData.crash.lng],
                ]}
                pathOptions={{
                  color: "#3b82f6",
                  weight: 3,
                  opacity: 0.9,
                  dashArray: "10 8",
                }}
              />
            </>
          )}

          {/* Dynamic Firebase incident markers */}
          {filtered.map((inc) => {
            if (!inc.lat || !inc.lng) return null;
            const s = sevStyle(inc.severityPct);
            const radius = inc.severityPct > 80 ? 10 : inc.severityPct > 50 ? 8 : 6;
            const isNew = newIds.has(inc.id);
            return (
              <CircleMarker
                key={inc.id}
                center={[inc.lat, inc.lng]}
                radius={radius}
                pathOptions={{
                  color: s.color,
                  fillColor: s.color,
                  fillOpacity: 0.85,
                  weight: 2,
                  className: isNew ? "animate-ping" : "",
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="text-xs font-bold">
                    <p>{inc.type}</p>
                    <p className="text-zinc-400 font-normal">{inc.location}</p>
                    <p>Severity: {inc.severity}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* ── Task 5: Autonomous Rescue Dispatch overlay — top centre ── */}
        {dispatchData && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] w-80">
            <div className="rounded-2xl border border-blue-500/30 bg-slate-900/90 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.2)] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 border-b border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    Autonomous Rescue Dispatch
                  </span>
                </div>
                <button
                  onClick={() => setDispatchData(null)}
                  className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors"
                >✕</button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                {/* Assigned facility */}
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Assigned Facility</p>
                    <p className="text-sm font-black text-white mt-0.5">{dispatchData.hospital.name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono">{dispatchData.hospital.type}</p>
                  </div>
                </div>

                {/* Distance + ETA */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-black/40 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Straight-Line Dist.</p>
                    <p className="text-lg font-black text-blue-400 tabular-nums">{dispatchData.distKm} km</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/40 px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Est. Arrival</p>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                      </span>
                      <p className="text-lg font-black text-blue-400 tabular-nums">{dispatchData.etaMin} min</p>
                    </div>
                  </div>
                </div>

                {/* Crash reference */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
                  <Zap className="w-3 h-3 text-red-400 shrink-0" />
                  <p className="text-[9px] font-mono text-red-300 truncate">
                    Responding to: {dispatchData.crash.location || dispatchData.crash.id?.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Legend — bottom left ── */}
        <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-4 shadow-2xl z-[1000]">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Map Legend</p>
          <div className="space-y-2.5">
            {[
              { color: "bg-green-500",  shadow: "shadow-[0_0_6px_rgba(34,197,94,0.8)]",  label: "Active Camera Node", pulse: true  },
              { color: "bg-yellow-300", shadow: "shadow-[0_0_6px_rgba(253,224,71,0.7)]",  label: "Minor Incident (<50%)",  pulse: false },
              { color: "bg-amber-400",  shadow: "shadow-[0_0_6px_rgba(251,191,36,0.8)]",  label: "Moderate (50–80%)",      pulse: false },
              { color: "bg-red-500",    shadow: "shadow-[0_0_8px_rgba(239,68,68,0.9)]",   label: "Critical Collision (>80%)", pulse: true },
              { color: "bg-red-500/30", shadow: "",                                         label: "Danger Zone (Historical)", pulse: false, ring: true },
              { color: "bg-blue-500",   shadow: "shadow-[0_0_6px_rgba(59,130,246,0.8)]",  label: "Assigned Hospital",        pulse: true  },
            ].map(({ color, shadow, label, pulse, ring }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className={`relative flex h-2.5 w-2.5 ${!pulse ? "inline-flex" : ""}`}>
                  {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-70`} />}
                  <span className={`${pulse ? "relative" : ""} inline-flex rounded-full h-2.5 w-2.5 ${color} ${shadow} ${ring ? "ring-1 ring-red-500/40" : ""}`} />
                </span>
                <span className="text-xs text-zinc-300 font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5">
            <Camera className="w-3 h-3 text-zinc-600" />
            <span className="text-[9px] font-mono text-zinc-600">
              {CAMERA_NODES.length} nodes · {filtered.length} incidents · {DANGER_ZONES.length} zones
            </span>
          </div>
        </div>

        {/* ── Recent Detections drawer — right ── */}
        <div className="absolute top-0 right-0 h-full w-72 border-l border-white/5 bg-slate-900/80 backdrop-blur-md flex flex-col z-[1000]">
          {/* Header + Severity Filter */}
          <div className="px-4 py-4 border-b border-white/5 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                  <Zap className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Recent Detections</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                {filtered.length} Active
              </span>
            </div>

            {/* ── Severity filter dropdown ── */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-black/40 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/5 transition-colors"
              >
                {FILTERS.find((f) => f.key === filter)?.label}
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              </button>
              {filterOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-white/10 bg-slate-900 shadow-2xl overflow-hidden z-50">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => { setFilter(f.key); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-widest transition-colors ${
                        filter === f.key
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Incident cards ── */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {filtered.map((inc) => {
                const c = sevStyle(inc.severityPct);
                const isDispatched  = inc.status === "resolved";
                const isDispatching = dispatching === inc.id;
                const isSelected    = selectedId === inc.id;
                return (
                  <motion.div
                    key={inc.id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onClick={() => handleCardClick(inc)}
                    className={`rounded-xl border p-3.5 space-y-2.5 transition-all duration-300 cursor-pointer ${c.border} ${c.bg} ${
                      isSelected ? "ring-1 ring-white/30 shadow-lg" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* ID + type + time + delete */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-white">{inc.id.slice(0, 8).toUpperCase()}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${c.border} ${c.text}`}>
                          {inc.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-mono">{inc.time}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(inc.id); }}
                          className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete incident"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-1.5">
                      <Navigation className="w-3 h-3 text-zinc-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-zinc-300 font-medium leading-tight">{inc.location}</p>
                    </div>

                    {/* Severity bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Severity</p>
                        <span className={`text-[10px] font-black tabular-nums ${c.text}`}>{inc.severity}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-700/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${inc.severityPct}%` }} />
                      </div>
                    </div>

                    {/* Dispatch button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDispatch(inc.id); }}
                      disabled={isDispatched || isDispatching}
                      className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                        isDispatched  ? "bg-green-500/10 text-green-400 border border-green-500/30 cursor-default" :
                        isDispatching ? "bg-zinc-800 text-zinc-500 border border-white/5 cursor-wait" :
                        inc.severityPct > 80
                          ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
                          : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {isDispatched ? "✓ Unit Dispatched" : isDispatching ? "Dispatching..." : "Dispatch Unit"}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
                <Zap className="w-6 h-6 mb-2 opacity-30" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No incidents match filter</p>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/5 shrink-0">
            <p className="text-[9px] font-mono text-zinc-600 text-center">
              Firebase Real-Time · YOLOv8 ByteTrack
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
