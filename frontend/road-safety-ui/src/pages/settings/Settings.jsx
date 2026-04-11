import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw, Cpu, Server, RadioReceiver } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-1.5 relative">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">System Configuration</h2>
        <p className="text-zinc-500 font-medium text-lg">Orchestrate automated dispatch rules and telemetry notification parameters.</p>
      </div>

      <Card className="glass-card border-none shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
          <Server className="w-48 h-48 text-white" />
        </div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
        <CardHeader className="bg-black/60 border-b border-white/5 pb-6 pt-8 px-10 backdrop-blur-xl z-10 relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-inner group-hover:bg-white/10 transition-colors">
              <RadioReceiver className="w-6 h-6 text-zinc-300" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-white">Emergency Dispatch Routing</CardTitle>
          </div>
          <CardDescription className="text-zinc-500 font-medium text-base ml-14">
            Configure automated API payloads for severe collision events <Badge className="bg-red-500/10 text-red-500 border-red-500/20 ml-2 shadow-[0_0_10px_rgba(239,68,68,0.2)]">Severity Level 5</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8 bg-[#050505]/80 backdrop-blur-md relative z-10">
          <div className="space-y-3">
            <Label htmlFor="hospital-email" className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Primary Medical Webhook</Label>
            <Input
              id="hospital-email"
              type="text"
              placeholder="https://api.cityhospital.org/v1/dispatch"
              defaultValue="https://api.cityhospital.org/v1/dispatch"
              className="bg-black/50 border-white/10 shadow-inner h-14 px-5 rounded-xl font-mono text-zinc-300 focus-visible:ring-1 focus-visible:ring-white/20 transition-all hover:bg-white/5 focus:bg-white/5 text-sm"
            />
            <p className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase pl-2 mt-2">Format: JSON Payload • Protocol: HTTPS Only</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="police-email" className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Law Enforcement Socket</Label>
            <Input
              id="police-email"
              type="text"
              placeholder="wss://emergency.police.gov/stream"
              defaultValue="wss://emergency.police.gov/stream"
              className="bg-black/50 border-white/10 shadow-inner h-14 px-5 rounded-xl font-mono text-zinc-300 focus-visible:ring-1 focus-visible:ring-white/20 transition-all hover:bg-white/5 focus:bg-white/5 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
          <Cpu className="w-48 h-48 text-white animate-[spin_60s_linear_infinite]" />
        </div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
        <CardHeader className="bg-black/60 border-b border-white/5 pb-6 pt-8 px-10 backdrop-blur-xl z-10 relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-inner group-hover:bg-white/10 transition-colors">
              <RefreshCw className="w-6 h-6 text-zinc-300" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-white">Notification Parameters</CardTitle>
          </div>
          <CardDescription className="text-zinc-500 font-medium text-base ml-14">
            Control the frequency and delivery method of systemic alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8 bg-[#050505]/80 backdrop-blur-md relative z-10">

          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="space-y-1">
              <Label className="text-lg text-white font-extrabold tracking-tight">Instant SMS Push</Label>
              <p className="text-sm font-medium text-zinc-500">Twilio integration for real-time mobile push notifications.</p>
            </div>
            <Switch defaultChecked id="sms-alerts" className="data-[state=checked]:bg-white data-[state=checked]:shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-125 border-white/10" />
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div className="space-y-1">
              <Label className="text-lg text-white font-extrabold tracking-tight">Daily Summary Digest</Label>
              <p className="text-sm font-medium text-zinc-500">Aggregated network health PDF delivered at 08:00 UTC.</p>
            </div>
            <Switch id="email-reports" className="data-[state=checked]:bg-white data-[state=checked]:shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-125 border-white/10" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1 flex flex-col justify-center">
              <Label className="text-lg text-white font-extrabold flex items-center gap-3 tracking-tight">
                Raw Telemetry Stream
                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] font-black tracking-widest text-[9px] uppercase">Alpha</Badge>
              </Label>
              <p className="text-sm font-medium text-zinc-500">Subscribe to the unparsed inference event queue.</p>
            </div>
            <Switch defaultChecked id="push-alerts" className="data-[state=checked]:bg-white data-[state=checked]:shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-125 border-white/10" />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-5 pt-8">
        <Button variant="outline" className="text-zinc-500 bg-black/40 border-white/10 hover:bg-white/5 hover:text-white rounded-full px-8 font-bold shadow-inner transition-all h-14">
          Revert Defaults
        </Button>
        <Button className="bg-white hover:bg-zinc-200 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-full px-10 h-14 font-extrabold text-base transition-all transform hover:scale-[1.02] active:scale-95">
          <Save className="w-5 h-5 mr-3" /> Commit Configuration
        </Button>
      </div>

    </div>
  );
}