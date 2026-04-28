import React, { useState, useEffect, useRef } from "react";
import { Award, CheckCircle2, XCircle, RotateCcw, ChevronRight, Shield, AlertTriangle, BookOpen, ExternalLink } from "lucide-react";

// ─── Study References ─────────────────────────────────────────────────────────
const STUDY_REFS = [
  { title: "Motor Vehicles Act 1988 — Full Text", url: "https://morth.nic.in/motor-vehicle-act", source: "MoRTH India" },
  { title: "Mumbai RTO Official Driving Test Guide", url: "https://transport.maharashtra.gov.in", source: "Maharashtra Transport" },
  { title: "iRASTE Road Safety — Mumbai Blackspots", url: "https://iraste.in", source: "iRASTE Project" },
  { title: "MSRDC Expressway Rules & Speed Limits", url: "https://msrdc.org", source: "MSRDC" },
  { title: "National Road Safety Policy — India", url: "https://morth.nic.in/national-road-safety-policy", source: "MoRTH India" },
  { title: "YouTube: Mumbai RTO Driving Test 2024", url: "https://www.youtube.com/results?search_query=mumbai+rto+driving+test+2024", source: "YouTube" },
];

// ─── Question Bank — 10 Mumbai RTO Questions ─────────────────────────────────
const rtoQuestions = [
  {
    id: 1,
    category: "LEGAL LIMITS",
    question: "What is the legal Blood Alcohol Concentration (BAC) limit for driving in India?",
    options: ["0.00%", "0.03% (30mg/100ml)", "0.05%", "0.08%"],
    answer: "0.03% (30mg/100ml)",
    explanation: "Under the Motor Vehicles Act, the legal BAC limit is 30mg per 100ml of blood (0.03%). Exceeding this is a cognizable offence punishable with imprisonment up to 6 months.",
    ref: "Motor Vehicles Act 1988, Section 185",
  },
  {
    id: 2,
    category: "EMERGENCY PROTOCOL",
    question: 'What is the "Golden Hour" in road accidents?',
    options: [
      "The hour before sunset",
      "First hour after trauma where medical care has highest survival rate",
      "Peak traffic hour in Mumbai",
      "The time taken for police to arrive",
    ],
    answer: "First hour after trauma where medical care has highest survival rate",
    explanation: "The Golden Hour is the critical 60-minute window post-trauma where immediate medical intervention dramatically increases survival probability.",
    ref: "National Road Safety Policy, MoRTH India",
  },
  {
    id: 3,
    category: "SPEED REGULATIONS",
    question: "What is the maximum speed limit for a light motor vehicle on the Mumbai-Pune Expressway?",
    options: ["80 km/h", "100 km/h", "120 km/h", "No limit"],
    answer: "100 km/h",
    explanation: "The Mumbai-Pune Expressway has a maximum speed limit of 100 km/h for LMVs as per MSRDC regulations. Heavy vehicles are limited to 80 km/h.",
    ref: "MSRDC Expressway Rules, msrdc.org",
  },
  {
    id: 4,
    category: "TRAFFIC SIGNALS",
    question: "A flashing red traffic light means:",
    options: [
      "Slow down and proceed",
      "Stop completely and proceed only when safe",
      "Traffic light is out of order",
      "VIP movement ahead",
    ],
    answer: "Stop completely and proceed only when safe",
    explanation: "A flashing red signal is treated as a STOP sign. You must come to a complete halt and proceed only when the intersection is clear.",
    ref: "Central Motor Vehicles Rules 1989, Rule 15",
  },
  {
    id: 5,
    category: "DOCUMENTATION",
    question: "According to the Motor Vehicles Act, which of these is mandatory to carry while driving?",
    options: [
      "Driving License & RC only",
      "PUC & Insurance only",
      "DL, RC, PUC, and Valid Insurance",
      "Medical Certificate",
    ],
    answer: "DL, RC, PUC, and Valid Insurance",
    explanation: "Section 130 of the MV Act mandates carrying: Driving Licence (DL), Registration Certificate (RC), Pollution Under Control (PUC) certificate, and valid Insurance.",
    ref: "Motor Vehicles Act 1988, Section 130",
  },
  {
    id: 6,
    category: "ROAD SIGNS",
    question: "A circular sign with a red border and white background in India indicates:",
    options: [
      "A mandatory instruction you must follow",
      "A warning about road conditions ahead",
      "Information about a nearby facility",
      "A suggested speed limit",
    ],
    answer: "A mandatory instruction you must follow",
    explanation: "Circular signs with red borders are PROHIBITORY or MANDATORY signs in India. They must be obeyed — examples include 'No Entry', 'Speed Limit', and 'No Overtaking'.",
    ref: "IRC:67 — Code of Practice for Road Signs",
  },
  {
    id: 7,
    category: "MUMBAI SPECIFIC",
    question: "On Mumbai's Eastern Freeway, what is the speed limit for private cars?",
    options: ["60 km/h", "80 km/h", "100 km/h", "No speed limit posted"],
    answer: "80 km/h",
    explanation: "The Mumbai Eastern Freeway (Orange Gate to Ghatkopar) has a speed limit of 80 km/h for private cars. Heavy vehicles are restricted to 60 km/h.",
    ref: "Mumbai Traffic Police — Eastern Freeway Regulations",
  },
  {
    id: 8,
    category: "PENALTIES",
    question: "Under the amended Motor Vehicles Act 2019, what is the fine for driving without a valid driving licence in India?",
    options: ["₹500", "₹1,000", "₹5,000", "₹10,000"],
    answer: "₹5,000",
    explanation: "The MV Amendment Act 2019 increased the penalty for driving without a valid licence to ₹5,000 (up from ₹500). Repeat offences attract higher fines and imprisonment.",
    ref: "Motor Vehicles (Amendment) Act 2019, Section 3",
  },
  {
    id: 9,
    category: "SAFETY RULES",
    question: "According to Indian law, who must wear a helmet while riding a two-wheeler?",
    options: [
      "Only the rider",
      "Only the pillion passenger",
      "Both rider and pillion passenger",
      "Only on highways",
    ],
    answer: "Both rider and pillion passenger",
    explanation: "Section 129 of the MV Act mandates helmet use for BOTH the rider and pillion passenger on all roads. Maharashtra enforces this strictly with fines up to ₹1,500.",
    ref: "Motor Vehicles Act 1988, Section 129",
  },
  {
    id: 10,
    category: "FIRST AID",
    question: "If you witness a road accident in India, what is your legal obligation under the Good Samaritan Law?",
    options: [
      "You have no legal obligation",
      "You must call police only",
      "You can help the victim without fear of legal harassment",
      "You must wait for an ambulance before touching the victim",
    ],
    answer: "You can help the victim without fear of legal harassment",
    explanation: "India's Good Samaritan Law (2016) protects bystanders who help accident victims from civil and criminal liability. You are encouraged to provide first aid and transport victims to hospital.",
    ref: "Good Samaritan Guidelines, MoRTH India 2016",
  },
];

// ─── Circular progress SVG ────────────────────────────────────────────────────
function CircularScore({ pct, passed }) {
  const r   = 72;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    let frame;
    let start = null;
    const duration = 1200;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(pct * eased));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [pct]);

  const stroke = passed ? "#22c55e" : "#ef4444";
  const offset = circ - (animated / 100) * circ;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="absolute inset-0 -rotate-90" width="192" height="192" viewBox="0 0 192 192">
        <circle cx="96" cy="96" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="96" cy="96" r={r} fill="none"
          stroke={stroke} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 12px ${stroke})` }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-5xl font-black tabular-nums" style={{ color: stroke }}>{animated}%</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Score</span>
      </div>
    </div>
  );
}

// ─── Option button ────────────────────────────────────────────────────────────
function OptionButton({ label, state, onClick, disabled }) {
  const base = "w-full text-left px-5 py-4 rounded-xl border font-semibold text-sm transition-all duration-200 flex items-center gap-3 group";
  const styles = {
    idle:    "border-white/10 bg-slate-800/50 text-zinc-200 hover:bg-slate-700/70 hover:border-blue-500/50 hover:ring-2 hover:ring-blue-500/30 hover:text-white cursor-pointer",
    correct: "border-green-500/60 bg-green-500/15 text-green-300 ring-2 ring-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
    wrong:   "border-red-500/60 bg-red-500/15 text-red-300 ring-2 ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    dimmed:  "border-white/5 bg-slate-900/30 text-zinc-600 cursor-not-allowed",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[state]}`}
    >
      <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-black transition-colors ${
        state === "correct" ? "border-green-500 bg-green-500/20 text-green-300" :
        state === "wrong"   ? "border-red-500 bg-red-500/20 text-red-300" :
        state === "dimmed"  ? "border-zinc-700 text-zinc-700" :
                              "border-zinc-600 text-zinc-500 group-hover:border-blue-400 group-hover:text-blue-400"
      }`}>
        {state === "correct" ? "✓" : state === "wrong" ? "✗" : label.charCodeAt(0) - 64}
      </span>
      <span className="flex-1">{label}</span>
      {state === "correct" && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
      {state === "wrong"   && <XCircle      className="w-4 h-4 text-red-400 shrink-0" />}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SafetySimulator() {
  const [currentIdx,      setCurrentIdx]      = useState(0);
  const [score,           setScore]           = useState(0);
  const [selectedAnswer,  setSelectedAnswer]  = useState(null);
  const [showResults,     setShowResults]     = useState(false);
  const [animateIn,       setAnimateIn]       = useState(true);
  const timerRef = useRef(null);

  const total    = rtoQuestions.length;
  const question = rtoQuestions[currentIdx];
  const pct      = Math.round((score / total) * 100);
  const passed   = pct >= 80;

  const handleAnswer = (option) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);
    const correct = option === question.answer;
    if (correct) setScore((s) => s + 1);

    timerRef.current = setTimeout(() => {
      setAnimateIn(false);
      setTimeout(() => {
        if (currentIdx + 1 >= total) {
          setShowResults(true);
        } else {
          setCurrentIdx((i) => i + 1);
          setSelectedAnswer(null);
          setAnimateIn(true);
        }
      }, 300);
    }, 1200);
  };

  const handleRetake = () => {
    clearTimeout(timerRef.current);
    setCurrentIdx(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResults(false);
    setAnimateIn(true);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const getOptionState = (opt) => {
    if (selectedAnswer === null) return "idle";
    if (opt === question.answer)  return "correct";
    if (opt === selectedAnswer)   return "wrong";
    return "dimmed";
  };

  // ── Results screen ──────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            RTO Safety Simulator
          </h2>
          <p className="text-zinc-500 font-medium text-lg">Mumbai Regional Transport Office — Certification Assessment</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className={`rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden ${
            passed
              ? "border-green-500/30 bg-slate-900/80 shadow-[0_0_60px_rgba(34,197,94,0.1)]"
              : "border-red-500/30 bg-slate-900/80 shadow-[0_0_60px_rgba(239,68,68,0.1)]"
          }`}>
            {/* Header band */}
            <div className={`px-8 py-4 border-b ${passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Assessment Complete · {total} Questions
              </p>
            </div>

            <div className="px-8 py-10 flex flex-col items-center gap-8">
              {/* Circular score */}
              <CircularScore pct={pct} passed={passed} />

              {/* Verdict */}
              <div className="text-center space-y-3">
                {passed ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="text-2xl font-black tracking-tight">PASSED</span>
                    </div>
                    <p className="text-green-300 font-bold text-lg">RTO Certified Safe Driver</p>
                    <p className="text-zinc-400 text-sm max-w-sm">
                      You have demonstrated sufficient knowledge of Indian road safety regulations.
                      Drive responsibly.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 text-red-400">
                      <XCircle className="w-6 h-6" />
                      <span className="text-2xl font-black tracking-tight">FAILED</span>
                    </div>
                    <p className="text-red-300 font-bold text-lg">High-Risk Profile</p>
                    <p className="text-zinc-400 text-sm max-w-sm">
                      Mandatory retraining required. You must score ≥ 80% to obtain RTO certification.
                    </p>
                  </>
                )}
              </div>

              {/* Score breakdown */}
              <div className="w-full grid grid-cols-3 gap-3">
                {[
                  { label: "Correct",   value: score,         color: "text-green-400" },
                  { label: "Incorrect", value: total - score, color: "text-red-400" },
                  { label: "Pass Mark", value: "80%",         color: "text-zinc-300" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
                    <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Retake button */}
              <button
                onClick={handleRetake}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-white text-zinc-950 font-black text-sm tracking-widest uppercase hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Simulator
              </button>
            </div>
          </div>
        </div>

        {/* Study References */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-8 py-5 border-b border-white/5 flex items-center gap-3">
            <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Study Resources — Mumbai RTO</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {STUDY_REFS.map((ref) => (
              <a
                key={ref.url}
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-black/30 hover:bg-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{ref.title}</p>
                  <p className="text-[9px] font-mono text-zinc-600 mt-0.5">{ref.source}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            RTO Safety Simulator
          </h2>
          <p className="text-zinc-500 font-medium text-lg">
            Mumbai Regional Transport Office — Certification Assessment
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
          <Shield className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
            Question {currentIdx + 1} of {total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
          style={{ width: `${((currentIdx) / total) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div
        className={`transition-all duration-300 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="rounded-3xl border border-white/10 bg-slate-800/50 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Category chip + question number */}
          <div className="px-8 pt-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {question.category}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                {currentIdx + 1} / {total}
              </span>
            </div>
            <h3 className="text-xl font-black text-white leading-snug">
              {question.question}
            </h3>
          </div>

          {/* Options */}
          <div className="px-8 py-6 space-y-3">
            {question.options.map((opt, i) => (
              <OptionButton
                key={opt}
                label={String.fromCharCode(65 + i) + ". " + opt}
                state={getOptionState(opt)}
                onClick={() => handleAnswer(opt)}
                disabled={selectedAnswer !== null}
              />
            ))}
          </div>

          {/* Explanation (shown after answer) */}
          {selectedAnswer !== null && (
            <div className={`mx-8 mb-8 rounded-xl border px-5 py-4 text-sm font-mono leading-relaxed animate-in fade-in duration-300 ${
              selectedAnswer === question.answer
                ? "border-green-500/30 bg-green-500/5 text-green-300"
                : "border-orange-500/30 bg-orange-500/5 text-orange-300"
            }`}>
              <div className="flex items-start gap-2">
                {selectedAnswer === question.answer
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-400" />
                  : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                }
                <div>
                  <span>{question.explanation}</span>
                  {question.ref && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-2">
                      📖 Ref: {question.ref}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer — score tracker */}
          <div className="px-8 py-4 border-t border-white/5 bg-black/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Score: <span className="text-white">{score}</span> / {currentIdx + (selectedAnswer ? 1 : 0)}
              </span>
            </div>
            {selectedAnswer !== null && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 animate-pulse">
                <ChevronRight className="w-3.5 h-3.5" />
                Next question loading...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question dots */}
      <div className="flex items-center justify-center gap-2">
        {rtoQuestions.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < currentIdx
                ? "w-2.5 h-2.5 bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                : i === currentIdx
                ? "w-4 h-2.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                : "w-2.5 h-2.5 bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
