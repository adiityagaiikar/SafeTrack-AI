import React, { useState } from "react";

export default function ModelConfigPanel() {
  const [confidence, setConfidence] = useState(0.5);
  const [iou, setIou] = useState(0.45);
  const [frameSkip, setFrameSkip] = useState(3);
  const [deploying, setDeploying] = useState(false);

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setDeploying(false);
  };

  return (
    <section className="max-w-3xl rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">YOLOv8 Collision Parameters</h2>
          <p className="text-sm text-gray-400">Tune model behavior before deployment.</p>
        </div>
        <span className="px-3 py-1 text-xs rounded-md border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">Model Online</span>
      </div>

      <div className="space-y-5">
        <label className="block">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-300">Confidence Threshold</span>
            <span className="text-orange-300">{confidence.toFixed(2)}</span>
          </div>
          <input type="range" min="0.1" max="1.0" step="0.01" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full accent-orange-500" />
        </label>

        <label className="block">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-300">IoU Threshold</span>
            <span className="text-orange-300">{iou.toFixed(2)}</span>
          </div>
          <input type="range" min="0.1" max="1.0" step="0.01" value={iou} onChange={(e) => setIou(Number(e.target.value))} className="w-full accent-orange-500" />
        </label>

        <label className="block">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-300">Frame Skip Rate</span>
            <span className="text-orange-300">{frameSkip}</span>
          </div>
          <input type="range" min="1" max="10" step="1" value={frameSkip} onChange={(e) => setFrameSkip(Number(e.target.value))} className="w-full accent-orange-500" />
        </label>
      </div>

      <button
        onClick={handleDeploy}
        disabled={deploying}
        className="mt-6 inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-60"
      >
        {deploying ? "Deploying..." : "Deploy Weights"}
      </button>
    </section>
  );
}
