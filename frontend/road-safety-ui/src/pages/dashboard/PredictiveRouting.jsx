import SafetyMap from "@/components/SafetyMap";

export default function PredictiveRouting() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Predictive Routing</h2>
        <p className="text-zinc-500 font-medium text-lg">Click the map to place an origin pin and destination pin, then review route risk against live incident data.</p>
      </div>

      <SafetyMap />
    </div>
  );
}