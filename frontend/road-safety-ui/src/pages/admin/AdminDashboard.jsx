import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RadioTower, Users, ActivitySquare, CheckCircle2 } from "lucide-react";

export default function AdminDashboard() {
  const statusCards = [
    {
      title: "Active Feeds",
      value: "42",
      detail: "Across all monitored zones",
      icon: RadioTower,
      accent: "text-zinc-300",
    },
    {
      title: "Database Health",
      value: "99.98%",
      detail: "MongoDB cluster availability",
      icon: Database,
      accent: "text-green-400",
    },
    {
      title: "Total Users",
      value: "1,284",
      detail: "Verified platform accounts",
      icon: Users,
      accent: "text-zinc-300",
    },
    {
      title: "Pending Audits",
      value: "17",
      detail: "Reports awaiting admin review",
      icon: ActivitySquare,
      accent: "text-orange-400",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">System Status Dashboard</h2>
        <p className="text-zinc-500 font-medium text-lg">Control plane telemetry and operational health for administrators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="glass-card relative overflow-hidden group hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] transition-all duration-500 border-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{card.title}</CardTitle>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner group-hover:bg-white/10 transition-colors">
                  <Icon className="h-4 w-4 text-zinc-300" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className={`text-5xl font-black tracking-tighter mb-2 ${card.accent}`}>{card.value}</div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{card.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card border-none shadow-2xl relative overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-5 pt-7 px-8 bg-black/40 backdrop-blur-md">
          <CardTitle className="text-xl font-extrabold text-white tracking-tight">Runtime Checks</CardTitle>
        </CardHeader>
        <CardContent className="p-8 bg-black/20 backdrop-blur-sm grid md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Detection API</p>
            <p className="text-sm text-zinc-200 font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" />Online</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Dispatch Queue</p>
            <p className="text-sm text-zinc-200 font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" />Healthy</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Webhook Listener</p>
            <p className="text-sm text-zinc-200 font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" />Receiving Events</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
