import React, { useMemo, useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle2, Plus, RadioTower, Save, Trash2, Wifi, WifiOff } from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const DISPATCH_COLLECTION = "dispatch_config";

const defaultRoutes = [
  { id: "police", agency: "City Police", endpoint: "wss://emergency.police.gov/stream", method: "WS", isActive: true, order: 1 },
  { id: "fire", agency: "Fire Brigade", endpoint: "mailto:dispatch@cityfire.gov", method: "Email", isActive: true, order: 2 },
  { id: "hospital", agency: "Trauma Center", endpoint: "https://api.cityhospital.org/v1/dispatch", method: "HTTPS", isActive: true, order: 3 },
];

function methodBadge(method) {
  if (method === "WS") return "bg-blue-500/10 text-blue-300 border-blue-500/30";
  if (method === "HTTPS") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  return "bg-orange-500/10 text-orange-300 border-orange-500/30";
}

export default function DispatchRouting() {
  const [routingMatrix, setRoutingMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const hideToastTimerRef = useRef(null);

  useEffect(() => {
    const dispatchRef = collection(db, DISPATCH_COLLECTION);

    const unsubscribe = onSnapshot(
      dispatchRef,
      async (snapshot) => {
        if (snapshot.empty) {
          await Promise.all(
            defaultRoutes.map((route) =>
              setDoc(doc(db, DISPATCH_COLLECTION, route.id), {
                agency: route.agency,
                endpoint: route.endpoint,
                method: route.method,
                isActive: route.isActive,
                order: route.order,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
              }),
            ),
          );
          return;
        }

        const rows = snapshot.docs
          .map((d) => ({
            id: d.id,
            agency: d.data().agency || "Unknown Agency",
            endpoint: d.data().endpoint || "",
            method: d.data().method || "HTTPS",
            isActive: Boolean(d.data().isActive),
            order: Number(d.data().order || 999),
          }))
          .sort((a, b) => a.order - b.order);

        setRoutingMatrix(rows);
        setLoading(false);
      },
      () => {
        setRoutingMatrix(defaultRoutes);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/`);
        setHealth(res.ok);
      } catch {
        setHealth(false);
      }
    };
    checkHealth();
  }, []);

  const activeCount = useMemo(() => routingMatrix.filter((r) => r.isActive).length, [routingMatrix]);

  const showSavedToast = (msg = "Saved") => {
    setToast({ type: "success", msg });
    if (hideToastTimerRef.current) {
      clearTimeout(hideToastTimerRef.current);
    }
    hideToastTimerRef.current = setTimeout(() => setToast(null), 1400);
  };

  const showErrorToast = (msg) => {
    setToast({ type: "error", msg });
    if (hideToastTimerRef.current) {
      clearTimeout(hideToastTimerRef.current);
    }
    hideToastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  const updateRouteConfig = async (id, field, value) => {
    setRoutingMatrix((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    try {
      await updateDoc(doc(db, DISPATCH_COLLECTION, id), {
        [field]: value,
        updatedAt: serverTimestamp(),
      });
      showSavedToast("Saved");
    } catch {
      showErrorToast("Save failed");
    }
  };

  const policeRoute = routingMatrix.find((r) => r.id === "police") || null;
  const hospitalRoute = routingMatrix.find((r) => r.id === "hospital") || null;

  const saveConfig = async () => {
    setSaving(true);
    try {
      await Promise.all(
        routingMatrix.map((route, idx) =>
          updateDoc(doc(db, DISPATCH_COLLECTION, route.id), {
            agency: route.agency,
            endpoint: route.endpoint,
            method: route.method,
            isActive: route.isActive,
            order: idx + 1,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      showSavedToast("Dispatch routing configuration saved.");
    } catch {
      showErrorToast("Could not persist dispatch config.");
    } finally {
      setSaving(false);
    }
  };

  const addRoute = async () => {
    try {
      await addDoc(collection(db, DISPATCH_COLLECTION), {
        agency: "New Agency",
        endpoint: "https://",
        method: "HTTPS",
        isActive: true,
        order: routingMatrix.length + 1,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      showSavedToast("Route added");
    } catch {
      showErrorToast("Could not add route");
    }
  };

  const removeRoute = async (id) => {
    try {
      await deleteDoc(doc(db, DISPATCH_COLLECTION, id));
      showSavedToast("Route removed");
    } catch {
      showErrorToast("Could not remove route");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {toast && (
        <div className={`fixed top-6 right-6 z-9999 flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl ${toast.type === "success" ? "border-emerald-500/40 bg-emerald-950 text-emerald-300" : "border-red-500/40 bg-red-950 text-red-300"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          Emergency Dispatch Routing
        </h2>
        <p className="text-zinc-500 font-medium text-lg">
          Dynamic response map for medical, police, and fire escalation channels.
        </p>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-black/40 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <RadioTower className="h-5 w-5 text-zinc-300" />
                Dispatch Control Plane
              </CardTitle>
              <CardDescription className="text-zinc-500 mt-1">
                Active routes: {activeCount} of {routingMatrix.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest">
              {health ? <Wifi className="h-3.5 w-3.5 text-green-400" /> : <WifiOff className="h-3.5 w-3.5 text-red-400" />}
              <span className={health ? "text-green-400" : "text-red-400"}>{health ? "API Online" : "API Offline"}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 bg-[#050505]/80 p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-black">Primary Medical Webhook</Label>
              <Input
                value={hospitalRoute?.endpoint || ""}
                onChange={(e) => {
                  if (!hospitalRoute) return;
                  updateRouteConfig(hospitalRoute.id, "endpoint", e.target.value);
                }}
                className="h-12 bg-black/50 border-white/10 text-zinc-200 font-mono"
                disabled={loading || !hospitalRoute}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-black">Law Enforcement Socket</Label>
              <Input
                value={policeRoute?.endpoint || ""}
                onChange={(e) => {
                  if (!policeRoute) return;
                  updateRouteConfig(policeRoute.id, "endpoint", e.target.value);
                }}
                className="h-12 bg-black/50 border-white/10 text-zinc-200 font-mono"
                disabled={loading || !policeRoute}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Agency Routing Matrix</h3>
              <Button type="button" variant="outline" onClick={addRoute} className="border-white/10 text-zinc-200">
                <Plus className="mr-2 h-4 w-4" /> Add Route
              </Button>
            </div>

            <div className="space-y-3">
              {loading && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
                  <div className="mt-3 h-10 w-full animate-pulse rounded bg-zinc-900" />
                  <div className="mt-2 h-10 w-full animate-pulse rounded bg-zinc-900" />
                </div>
              )}

              {!loading && routingMatrix.map((route) => (
                <div key={route.id} className="grid gap-3 rounded-xl border border-white/10 bg-black/40 p-4 md:grid-cols-[1.2fr_1.7fr_120px_90px_48px]">
                  <Input
                    value={route.agency}
                    onChange={(e) => updateRouteConfig(route.id, "agency", e.target.value)}
                    className="h-10 bg-zinc-950 border-white/10"
                  />
                  <Input
                    value={route.endpoint}
                    onChange={(e) => updateRouteConfig(route.id, "endpoint", e.target.value)}
                    className="h-10 bg-zinc-950 border-white/10 font-mono"
                  />
                  <select
                    value={route.method}
                    onChange={(e) => updateRouteConfig(route.id, "method", e.target.value)}
                    className="h-10 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-200"
                  >
                    <option value="HTTPS">HTTPS</option>
                    <option value="WS">WS</option>
                    <option value="Email">Email</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => updateRouteConfig(route.id, "isActive", !route.isActive)}
                    className={`rounded-md border px-3 text-xs font-bold ${route.isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"}`}
                  >
                    {route.isActive ? "ON" : "OFF"}
                  </button>
                  <Button type="button" variant="ghost" onClick={() => removeRoute(route.id)} className="text-zinc-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="md:col-span-5 pt-1">
                    <Badge className={methodBadge(route.method)}>{route.method}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveConfig} disabled={saving} className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold">
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Routing Config"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
