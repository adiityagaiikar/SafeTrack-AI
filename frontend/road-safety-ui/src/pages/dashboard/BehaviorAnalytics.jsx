import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MOCK_DRIVERS = ["Priya", "Sarah", "Rahul", "Michael"];

function makeEmptyHourlyData() {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, incidents: 0 }));
}

function makeEmptyWeeklyData() {
  return DAYS.map((day) => ({ day, incidents: 0 }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeHourLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function classifyAnomaly(incident) {
  const rawText = [incident.type, incident.raw?.geminiReport, incident.raw?.summary, incident.raw?.report]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (rawText.includes("speed")) return "Speeding";
  if (rawText.includes("tail") || rawText.includes("following")) return "Tailgating";
  if (rawText.includes("brake")) return "Harsh Braking";
  if (rawText.includes("lane")) return "Lane Drift";
  if (rawText.includes("collision") || rawText.includes("accident")) return "Collision";
  return incident.accidentDetected ? "Collision" : "Other";
}

function normalizeSeverity(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("critical") || text.includes("severe") || text.includes("high")) return "Critical";
  if (text.includes("moderate") || text.includes("medium")) return "Moderate";
  return "Minor";
}

function toDateValue(rawTs) {
  if (!rawTs) return null;
  if (typeof rawTs?.toDate === "function") return rawTs.toDate();

  const parsed = new Date(rawTs);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getIncidentConfidence(raw) {
  const value = raw?.confidence ?? raw?.yoloConfidence ?? raw?.score ?? null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value <= 1 ? value * 100 : value;
}

function computeSafetyScoreFromSeverity(severity) {
  if (severity === "Critical") return 60;
  if (severity === "Moderate") return 82;
  return 95;
}

function safetyScoreColor(score) {
  if (score === null) return "#71717a";
  if (score > 80) return "#22c55e";
  if (score > 60) return "#facc15";
  return "#ef4444";
}

function buildDriverScores(baseScore, incidentCount, operatorName) {
  const safeBase = Number.isFinite(baseScore) ? baseScore : 100;

  const seededShift = (idx) => ((incidentCount * (idx + 3) + 17) % 31) - 15;
  const rivals = MOCK_DRIVERS.map((name, idx) => {
    const score = Math.max(45, Math.min(99, Math.round(safeBase + seededShift(idx))));
    return {
      name,
      score,
      trips: Math.max(12, Math.round(incidentCount * 0.45 + 18 + idx * 3)),
      isYou: false,
    };
  });

  const you = {
    name: `${operatorName || "Aditya"} (You)`,
    score: Math.round(safeBase),
    trips: Math.max(12, incidentCount),
    isYou: true,
  };

  return [you, ...rivals]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// ─── Shared Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-sm text-zinc-300">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
}

// ─── Safety Score Card ────────────────────────────────────────────────────────

function SafetyScoreCard({ score, recentTrend }) {
  const color = safetyScoreColor(score);
  const label = score === null ? "—" : score;
  const sublabel =
    score === null
      ? "Awaiting incident data"
      : score >= 75
      ? "Network operating safely"
      : score >= 50
      ? "Elevated risk detected"
      : "Critical risk threshold";

  return (
    <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
        <CardTitle className="text-lg font-extrabold text-white tracking-tight">Safety Rating</CardTitle>
        <CardDescription className="text-zinc-400">
          Composite score derived from incident frequency and severity index.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6 space-y-5">
        {/* Big score display */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-7 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5 rounded-2xl"
            style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)` }}
          />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
            Fleet Safety Score
          </p>
          <div
            className="text-7xl font-black tabular-nums transition-colors duration-700"
            style={{ color }}
          >
            {label}
          </div>
          <p className="text-xs font-bold text-zinc-500 mt-1">/ 100</p>
          <p className="mt-3 text-sm font-medium" style={{ color }}>
            {sublabel}
          </p>
        </div>

        {/* Trend sparkline */}
        <div className="w-full h-44 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2 pl-1">
            Recent Score Trend
          </p>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={recentTrend}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#f97316", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Detection Accuracy Gauge (Pie) ──────────────────────────────────────────

function DetectionAccuracyGauge({ avgConfidence }) {
  const value = avgConfidence !== null ? Math.round(avgConfidence) : 0;
  const remainder = 100 - value;
  const data = [
    { name: "Confidence", value },
    { name: "Gap", value: remainder },
  ];
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#f97316" : "#ef4444";

  return (
    <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
        <CardTitle className="text-lg font-extrabold text-white tracking-tight">
          Detection Accuracy
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Average YOLOv8 confidence across all recorded incidents.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6 flex flex-col items-center gap-4">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={-270}
                innerRadius={58}
                outerRadius={76}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={color} />
                <Cell fill="rgba(255,255,255,0.05)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black tabular-nums" style={{ color }}>
              {avgConfidence !== null ? `${value}%` : "N/A"}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">
              Avg Confidence
            </span>
          </div>
        </div>
        <div className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-center">
          <p className="text-xs text-zinc-400">
            {avgConfidence === null
              ? "No confidence data available yet."
              : value >= 80
              ? "Model performing at high accuracy."
              : value >= 60
              ? "Moderate accuracy — review edge cases."
              : "Low confidence — consider retraining."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Risk Heatmap (by day of week) ───────────────────────────────────────────

function RiskHeatmap({ dayOfWeekSeries }) {
  return (
    <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden lg:col-span-3">
      <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
        <CardTitle className="text-lg font-extrabold text-white tracking-tight">
          Weekly Risk Heatmap
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Incident distribution across days of the week — identify high-risk windows.
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full px-4 py-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dayOfWeekSeries} barCategoryGap="30%">
            <XAxis dataKey="day" stroke="#71717a" tick={{ fontSize: 11, fontWeight: 700 }} />
            <YAxis stroke="#71717a" allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="incidents" name="Incidents" radius={[6, 6, 0, 0]}>
              {dayOfWeekSeries.map((entry, index) => {
                const max = Math.max(...dayOfWeekSeries.map((d) => d.incidents), 1);
                const intensity = entry.incidents / max;
                const r = Math.round(249 * intensity + 56 * (1 - intensity));
                const g = Math.round(115 * intensity + 189 * (1 - intensity));
                const b = Math.round(22 * intensity + 248 * (1 - intensity));
                return <Cell key={index} fill={`rgb(${r},${g},${b})`} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Safety Leaderboard ───────────────────────────────────────────────────────

const LEADERBOARD = [
  { rank: 1, name: "Aditya (You)", trips: 84, score: 96 },
  { rank: 2, name: "Priya K.",     trips: 71, score: 91 },
  { rank: 3, name: "Sarah J.",     trips: 65, score: 83 },
  { rank: 4, name: "Rahul S.",     trips: 78, score: 74 },
  { rank: 5, name: "Michael W.",   trips: 59, score: 61 },
];

function gradeBadge(score) {
  if (score >= 90)
    return (
      <Badge className="bg-green-500/10 text-green-400 border border-green-500/30 font-black tracking-widest uppercase text-[9px] px-2.5 py-1 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
        A+
      </Badge>
    );
  if (score >= 75)
    return (
      <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-black tracking-widest uppercase text-[9px] px-2.5 py-1 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
        B
      </Badge>
    );
  return (
    <Badge className="bg-red-500/10 text-red-400 border border-red-500/30 font-black tracking-widest uppercase text-[9px] px-2.5 py-1 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
      C
    </Badge>
  );
}

function rankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function SafetyLeaderboard({ data }) {
  return (
    <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
        <CardTitle className="text-lg font-extrabold text-white tracking-tight">
          Safety Leaderboard
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Driver performance ranked by safety score across all recorded trips.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Column headers */}
        <div className="grid grid-cols-[56px_1fr_80px_100px] border-b border-white/5 px-6">
          {["Rank", "Driver Name", "Trips", "Safety Score"].map((h, i) => (
            <div
              key={h}
              className={`py-3.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 ${
                i >= 2 ? "text-right" : ""
              }`}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {data.map((driver) => {
          const isYou = driver.isYou;
          return (
            <div
              key={driver.rank}
              className={`grid grid-cols-[56px_1fr_80px_100px] border-b border-white/5 px-6 items-center transition-colors ${
                isYou
                  ? "bg-orange-500/5 hover:bg-orange-500/10"
                  : "hover:bg-white/3"
              }`}
            >
              {/* Rank */}
              <div className="py-4 text-base font-black text-zinc-300">
                {rankLabel(driver.rank)}
              </div>

              {/* Name */}
              <div className="py-4 flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${
                    isYou ? "text-orange-300" : "text-zinc-200"
                  }`}
                >
                  {driver.name}
                </span>
                {isYou && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">
                    You
                  </span>
                )}
              </div>

              {/* Trips */}
              <div className="py-4 text-right">
                <span className="font-mono text-sm font-bold text-zinc-400">
                  {driver.trips}
                </span>
              </div>

              {/* Score + Grade */}
              <div className="py-4 flex items-center justify-end gap-2">
                <span className="font-mono text-sm font-black text-white tabular-nums">
                  {driver.score}
                </span>
                {gradeBadge(driver.score)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Driver Risk Segmentation ─────────────────────────────────────────────────

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-xl font-mono text-xs">
      <p className="font-black text-white mb-1">{d.id}</p>
      <p className="text-zinc-300">Speed: {d.avg_speed} km/h</p>
      <p className="text-zinc-300">Hard Brakes: {d.hard_brakes}</p>
      <p className="text-zinc-300">Tailgating: {d.tailgating_s}s</p>
      <p className="mt-1 font-black" style={{ color: d.color }}>{d.risk_label}</p>
    </div>
  );
}

function DriverRiskSegmentation() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.getFleetSegmentation()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const byCluster = useMemo(() => {
    if (!data?.drivers) return [];
    const groups = {};
    for (const d of data.drivers) {
      if (!groups[d.risk_label]) groups[d.risk_label] = { name: d.risk_label, color: d.color, points: [] };
      groups[d.risk_label].points.push(d);
    }
    return Object.values(groups);
  }, [data]);

  const dist = data?.distribution ?? {};
  const total = Object.values(dist).reduce((s, v) => s + v, 0) || 1;

  return (
    <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden lg:col-span-3">
      <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-lg font-extrabold text-white tracking-tight">
              Driver Risk Segmentation
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-1">
              K-Means clustering (n=3) on speed, hard-brake events, and tailgating time.
            </CardDescription>
          </div>
          {/* Distribution summary chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Defensive", color: "#22c55e", bg: "bg-green-500/10 border-green-500/30 text-green-400" },
              { label: "Erratic",   color: "#f97316", bg: "bg-orange-500/10 border-orange-500/30 text-orange-400" },
              { label: "Aggressive",color: "#ef4444", bg: "bg-red-500/10 border-red-500/30 text-red-400" },
            ].map(({ label, bg }) => (
              <span key={label} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${bg}`}>
                {label}: {dist[label] ?? 0} ({Math.round(((dist[label] ?? 0) / total) * 100)}%)
              </span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 h-72">
        {loading && (
          <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
            Running K-Means segmentation...
          </div>
        )}
        {error && (
          <div className="flex h-full items-center justify-center text-red-400 text-sm font-mono">
            {error}
          </div>
        )}
        {!loading && !error && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <XAxis dataKey="avg_speed" name="Avg Speed" unit=" km/h" stroke="#71717a" tick={{ fontSize: 10 }} label={{ value: "Avg Speed (km/h)", position: "insideBottom", offset: -4, fill: "#71717a", fontSize: 10 }} />
              <YAxis dataKey="hard_brakes" name="Hard Brakes" stroke="#71717a" tick={{ fontSize: 10 }} label={{ value: "Hard Brakes", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 10 }} />
              <ZAxis range={[60, 60]} />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#ffffff20" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingTop: 8 }} />
              {byCluster.map((group) => (
                <Scatter
                  key={group.name}
                  name={group.name}
                  data={group.points}
                  fill={group.color}
                  opacity={0.85}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BehaviorAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardMetrics, setDashboardMetrics] = useState({
    safetyRating: 100,
    detectionAccuracy: null,
    totalIncidents: 0,
    anomalySeries: [],
    recentTrend: Array.from({ length: 8 }, (_, idx) => ({ label: `#${idx + 1}`, score: 100 })),
  });
  const [hourlyData, setHourlyData] = useState(makeEmptyHourlyData());
  const [weeklyData, setWeeklyData] = useState(makeEmptyWeeklyData());
  const [driverScores, setDriverScores] = useState(buildDriverScores(100, 0, user?.fullname || "Aditya"));

  useEffect(() => {
    setLoading(true);
    setError("");

    const incidentsRef = collection(db, "incidents");
    const unsubscribe = onSnapshot(
      incidentsRef,
      (snapshot) => {
        const docs = snapshot.docs.map((docItem) => {
          const raw = docItem.data();
          const timestampDate = toDateValue(raw.timestamp || raw.created_at || raw.createdAt);
          const severity = normalizeSeverity(raw.severity);

          return {
            id: docItem.id,
            raw,
            timestampDate,
            severity,
            accidentDetected: severity === "Critical",
            type: raw.type || raw.classification || raw.label || "Incident",
          };
        });

        const hourlyBuckets = makeEmptyHourlyData();
        const dowBuckets = makeEmptyWeeklyData();
        const anomalyCounts = {};
        let confidenceSum = 0;
        let confidenceCount = 0;
        let criticalCount = 0;
        let moderateCount = 0;

        docs.forEach((incident) => {
          if (incident.timestampDate) {
            hourlyBuckets[incident.timestampDate.getHours()].incidents += 1;
            dowBuckets[incident.timestampDate.getDay()].incidents += 1;
          }

          const confidence = getIncidentConfidence(incident.raw);
          if (confidence !== null) {
            confidenceSum += confidence;
            confidenceCount += 1;
          }

          if (incident.severity === "Critical") criticalCount += 1;
          if (incident.severity === "Moderate") moderateCount += 1;

          const anomalyType = classifyAnomaly(incident);
          anomalyCounts[anomalyType] = (anomalyCounts[anomalyType] || 0) + 1;
        });

        const detectionAccuracy = confidenceCount > 0 ? confidenceSum / confidenceCount : null;
        const computedSafety = Math.max(0, 100 - criticalCount * 5 - moderateCount * 2);
        const anomalySeries = Object.entries(anomalyCounts).map(([type, incidents]) => ({ type, incidents }));

        const recentTrend = docs
          .filter((item) => item.timestampDate)
          .sort((a, b) => a.timestampDate - b.timestampDate)
          .slice(-8)
          .map((incident, index) => ({
            label: `#${index + 1}`,
            score: computeSafetyScoreFromSeverity(incident.severity),
          }));

        const paddedTrend =
          recentTrend.length > 0
            ? recentTrend
            : Array.from({ length: 8 }, (_, idx) => ({ label: `#${idx + 1}`, score: computedSafety }));

        setDashboardMetrics({
          safetyRating: computedSafety,
          detectionAccuracy,
          totalIncidents: docs.length,
          anomalySeries,
          recentTrend: paddedTrend,
        });
        setHourlyData(hourlyBuckets);
        setWeeklyData(dowBuckets);
        setDriverScores(buildDriverScores(computedSafety, docs.length, user?.fullname || "Aditya"));
        setLoading(false);
      },
      (fetchErr) => {
        setError(fetchErr?.message || "Failed to load incidents from Firestore.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.fullname]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Page title */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          Behavior Analytics
        </h2>
        <p className="text-zinc-500 font-medium text-lg">
          Real incidents from Firestore drive the safety score, detection accuracy, and risk heatmaps.
        </p>
      </div>

      {(loading || error || dashboardMetrics.totalIncidents === 0) && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 text-sm text-zinc-300">
          {loading
            ? "Loading incident telemetry..."
            : error
            ? `Database connection failed: ${error}`
            : "No incident data yet — charts will populate automatically."}
        </div>
      )}

      {/* Row 0: Driver Risk Segmentation (K-Means) */}
      <div className="grid grid-cols-1 gap-6">
        <DriverRiskSegmentation />
      </div>

      {/* Row 1: Safety Score + Detection Accuracy + Time-of-Day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SafetyScoreCard score={dashboardMetrics.safetyRating} recentTrend={dashboardMetrics.recentTrend} />

        <DetectionAccuracyGauge avgConfidence={dashboardMetrics.detectionAccuracy} />

        <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-extrabold text-white tracking-tight">
              Time-of-Day Pattern
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Which hours produce the most alerts.
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full px-3 py-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <XAxis
                  dataKey="hour"
                  tickFormatter={safeHourLabel}
                  stroke="#71717a"
                  tick={{ fontSize: 9 }}
                  interval={3}
                />
                <YAxis stroke="#71717a" allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  content={<CustomTooltip />}
                  labelFormatter={(v) => safeHourLabel(v)}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="incidents" name="Incidents" fill="#f97316" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Weekly Risk Heatmap */}
      <div className="grid grid-cols-1 gap-6">
        <RiskHeatmap dayOfWeekSeries={weeklyData} />
      </div>

      {/* Row 3: Anomaly Breakdown */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-extrabold text-white tracking-tight">
              Anomaly Breakdown
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Detection categories inferred from incident records and AI reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full px-4 py-4 h-72">
            {dashboardMetrics.anomalySeries.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/50 text-zinc-500 text-sm">
                No anomaly data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardMetrics.anomalySeries}>
                  <XAxis dataKey="type" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#71717a" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="incidents" name="Incidents" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Safety Leaderboard */}
      <SafetyLeaderboard data={driverScores} />
    </div>
  );
}
