import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIncidents } from "@/hooks/useIncidents";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

const SEVERITY_PENALTY = {
  Minor: 10,
  Moderate: 25,
  Severe: 45,
};

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

function severityScore(incident) {
  return Math.max(0, 100 - (SEVERITY_PENALTY[incident.severity] || 15) - (incident.accidentDetected ? 10 : 0));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-sm text-zinc-300">Incidents: {payload[0].value}</p>
    </div>
  );
}

export default function BehaviorAnalytics() {
  const { incidents, loading, error } = useIncidents("accidents");

  const analytics = useMemo(() => {
    if (!incidents.length) {
      return {
        safetyScore: null,
        timeSeries: [],
        anomalySeries: [],
        recentTrend: [],
      };
    }

    const safetyScores = incidents.map(severityScore);
    const safetyScore = Math.round(safetyScores.reduce((sum, value) => sum + value, 0) / safetyScores.length);

    const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, incidents: 0 }));
    incidents.forEach((incident) => {
      const hour = incident.timestampDate ? incident.timestampDate.getHours() : null;
      if (hour !== null) hourlyBuckets[hour].incidents += 1;
    });

    const anomalyCounts = incidents.reduce((accumulator, incident) => {
      const key = classifyAnomaly(incident);
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const anomalySeries = Object.entries(anomalyCounts).map(([type, incidentsCount]) => ({ type, incidents: incidentsCount }));

    const recentTrend = incidents
      .slice(0, 8)
      .reverse()
      .map((incident, index) => ({
        label: `Incident ${index + 1}`,
        score: severityScore(incident),
      }));

    return {
      safetyScore,
      timeSeries: hourlyBuckets,
      anomalySeries,
      recentTrend,
    };
  }, [incidents]);

  const scoreLabel = analytics.safetyScore === null ? "Not enough data to calculate risk score" : `${analytics.safetyScore} / 100`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">Behavior Analytics</h2>
        <p className="text-zinc-500 font-medium text-lg">Real incidents from Firestore drive the safety score, hourly risk profile, and anomaly breakdown.</p>
      </div>

      {(loading || error || !incidents.length) && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 text-sm text-zinc-300">
          {loading
            ? "Loading incident telemetry..."
            : error
              ? `Database connection failed: ${error}`
              : "Not enough data to calculate risk score."}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-extrabold text-white tracking-tight">Driver Safety Score</CardTitle>
            <CardDescription className="text-zinc-400">Calculated from incident frequency and severity.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-6 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Average Safety Score</p>
              <div className="text-5xl font-black text-white">{scoreLabel}</div>
              <p className="mt-3 text-sm text-zinc-400">
                {analytics.safetyScore === null
                  ? "Wait for more incident records before computing the driver safety score."
                  : "Higher values indicate fewer and less severe incidents."}
              </p>
            </div>

            <div className="w-full h-56 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.recentTrend}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: "#f97316" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden lg:col-span-2">
          <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-extrabold text-white tracking-tight">Time-of-Day Incident Pattern</CardTitle>
            <CardDescription className="text-zinc-400">Which hours currently produce the most alerts.</CardDescription>
          </CardHeader>
          <CardContent className="w-full px-4 py-4 h-90">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.timeSeries}>
                <XAxis dataKey="hour" tickFormatter={safeHourLabel} stroke="#71717a" />
                <YAxis stroke="#71717a" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} labelFormatter={(value) => safeHourLabel(value)} />
                <Bar dataKey="incidents" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 bg-slate-900/80 shadow-2xl overflow-hidden lg:col-span-3">
          <CardHeader className="border-b border-white/5 bg-slate-800/70 backdrop-blur-md pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-extrabold text-white tracking-tight">Anomaly Breakdown</CardTitle>
            <CardDescription className="text-zinc-400">Detection categories inferred from incident records and reports.</CardDescription>
          </CardHeader>
          <CardContent className="w-full px-4 py-4 h-90">
            {analytics.anomalySeries.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/50 text-zinc-500">
                No anomaly data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.anomalySeries}>
                  <XAxis dataKey="type" stroke="#71717a" />
                  <YAxis stroke="#71717a" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="incidents" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}