import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmergencyModal({
  open,
  onCancel,
  onDispatch,
  initialSeconds = 10,
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(initialSeconds);
  }, [open, initialSeconds]);

  useEffect(() => {
    if (!open) return;

    if (secondsLeft <= 0) {
      onDispatch();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [open, secondsLeft, onDispatch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/40 bg-zinc-950 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="rounded-t-2xl border-b border-red-500/30 bg-red-600/20 px-6 py-4">
          <div className="flex items-center gap-3 text-red-200">
            <AlertTriangle className="h-6 w-6" />
            <h3 className="text-xl font-black tracking-tight">CRASH DETECTED</h3>
          </div>
          <p className="mt-1 text-sm text-red-100/80">Automatic SOS dispatch is armed. Cancel if this is a false positive.</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Auto dispatch in</p>
            <p className="mt-1 text-5xl font-black text-white">{secondsLeft}s</p>
          </div>

          <Button
            onClick={onDispatch}
            className="w-full h-14 rounded-xl bg-red-600 hover:bg-red-500 text-white text-lg font-black tracking-wide shadow-[0_0_20px_rgba(220,38,38,0.35)]"
          >
            <ShieldAlert className="h-5 w-5 mr-2" />
            DISPATCH SOS
          </Button>

          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full h-12 rounded-xl border-white/20 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          >
            Cancel Emergency Trigger
          </Button>
        </div>
      </div>
    </div>
  );
}
