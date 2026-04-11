import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Car, GitMerge, BrainCircuit, TrendingUp, Loader2 } from "lucide-react";
import { api } from "../../api";

export default function BehaviorAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await api.getAnalytics(1); // placeholder user_id=1
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const overallScore = analytics?.overall_score || 0;

    const metrics = [
        { name: "Lane Discipline", score: analytics?.metrics?.lane_discipline || 0, gradient: "from-green-500 to-green-300", glow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]", icon: GitMerge },
        { name: "Braking Frequency", score: analytics?.metrics?.braking_frequency || 0, gradient: "from-yellow-500 to-yellow-300", glow: "shadow-[0_0_15px_rgba(234,179,8,0.3)]", icon: Activity },
        { name: "Acceleration Stability", score: analytics?.metrics?.acceleration_stability || 0, gradient: "from-green-500 to-green-300", glow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]", icon: Activity },
        { name: "Speed limit compliance", score: analytics?.metrics?.speed_limit_compliance || 0, gradient: "from-orange-500 to-orange-300", glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]", icon: Car },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="flex flex-col gap-1.5 relative">
                <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">Behavior Analytics</h2>
                <p className="text-zinc-500 font-medium text-lg">Macro-level predictive insights derived from network-wide telemetry.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Overall Score Card */}
                <div className="md:col-span-1">
                    <Card className="h-full glass-card border-none shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent pointer-events-none group-hover:from-green-500/20 transition-colors duration-1000"></div>
                        <CardContent className="h-full flex flex-col items-center justify-center p-12 text-center relative z-10">
                            <div className="mb-8 p-5 rounded-3xl bg-black border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative group-hover:scale-105 transition-transform duration-500">
                                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                                <BrainCircuit className="w-12 h-12 text-white relative z-10 drop-shadow-md" />
                            </div>
                            <h3 className="text-[11px] font-black tracking-widest uppercase text-zinc-500 mb-3">Neural Grid Score</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{overallScore}</span>
                                <span className="text-3xl font-bold text-zinc-600">/100</span>
                            </div>
                            <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)] px-5 py-2 text-xs font-bold tracking-widest uppercase rounded-full">
                                Optimal Standing
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                {/* Breakdown Card */}
                <div className="md:col-span-2">
                    <Card className="h-full glass-card border-none shadow-2xl">
                        <CardHeader className="pb-8 pt-8 px-10 border-b border-white/5 bg-black/40 backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-extrabold text-white tracking-tight">Kinematic Analysis Matrix</CardTitle>
                                <div className="flex items-center gap-2 text-xs font-black tracking-wide text-green-400 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                    <TrendingUp className="w-4 h-4" /> +4.2% MoM
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10 bg-black/20 backdrop-blur-xl">
                            {metrics.map((metric, i) => {
                                const Icon = metric.icon;
                                return (
                                    <div key={i} className="group cursor-pointer">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p - 2.5 rounded - xl bg - white / 5 border border - white / 10 transition - all duration - 300 group - hover: bg - white / 10 group - hover: scale - 110`}>
                                                    <Icon className="w-4 h-4 text-zinc-300" />
                                                </div>
                                                <span className="text-sm font-bold tracking-wide text-zinc-400 group-hover:text-white transition-colors">{metric.name}</span>
                                            </div>
                                            <span className="text-2xl font-black text-white">{metric.score}<span className="text-zinc-600 ml-0.5">%</span></span>
                                        </div>

                                        {/* Glowing Dark Progress Bar */}
                                        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                                            <div
                                                className={`absolute top - 0 left - 0 h - full rounded - full bg - gradient - to - r ${metric.gradient} ${metric.glow} transition - all duration - 1000 ease - out`}
                                                style={{ width: `${metric.score}% ` }}
                                            >
                                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.4)_75%,transparent_75%,transparent_100%)] bg-[length:1rem_1rem] opacity-30 animate-[progress_2s_linear_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card shadow-2xl border-none min-h-[350px] flex items-center justify-center bg-black/40 border-dashed border-[2px] border-white/10 group hover:bg-black/60 transition-colors">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="p-5 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-white/5 shadow-inner">
                            <Activity className="w-8 h-8 text-zinc-500" />
                        </div>
                        <p className="text-[11px] font-bold text-zinc-600 tracking-widest uppercase shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-black/50 px-4 py-2 rounded-full border border-white/5">
                            [Chart.js Vector Required]<br />
                            Temporal Trend Graph
                        </p>
                    </div>
                </Card>
                <Card className="glass-card shadow-2xl border-none min-h-[350px] flex items-center justify-center bg-black/40 border-dashed border-[2px] border-white/10 group hover:bg-black/60 transition-colors">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="p-5 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500 border border-white/5 shadow-inner">
                            <Car className="w-8 h-8 text-zinc-500" />
                        </div>
                        <p className="text-[11px] font-bold text-zinc-600 tracking-widest uppercase shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-black/50 px-4 py-2 rounded-full border border-white/5">
                            [MapBox GL Pipeline]<br />
                            Spatial Hotspot Renderer
                        </p>
                    </div>
                </Card>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
@keyframes progress {
    0 % { background- position: 1rem 0;
}
100 % { background- position: 0 0; }
        }
`}} />
        </div>
    );
}
