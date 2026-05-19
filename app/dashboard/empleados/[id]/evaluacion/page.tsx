"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight, ChevronDown, TrendingUp } from "lucide-react";
import { Empleado, obtenerEmpleadoPorId, guardarEvaluacion, Evaluation } from "@/services/empleadosService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Competency {
  id: string;
  label: string;
  score: number;
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function EvalRadarChart({ scores }: { scores: number[] }) {
  const cx = 110, cy = 110, R = 78;
  const labels = ["COMM", "TECH", "LEAD", "INNO", "RELI"];
  const values  = scores.map((s) => s / 5);

  const angle = (i: number) => ((90 - i * 72) * Math.PI) / 180;
  const pt = (i: number, scale = 1) => ({
    x: cx + R * scale * Math.cos(angle(i)),
    y: cy - R * scale * Math.sin(angle(i)),
  });

  const polyPath = (scale: number) =>
    labels.map((_, i) => { const p = pt(i, scale); return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ") + " Z";

  const valuePath =
    values.map((v, i) => { const p = pt(i, v); return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ") + " Z";

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[190px] mx-auto">
      <path d={polyPath(0.78)} fill="none" stroke="#d1dde2" strokeWidth="1" strokeDasharray="4,3" />
      {[0.5, 1].map((s) => (
        <path key={s} d={polyPath(s)} fill="none" stroke="#e5eaed" strokeWidth="1" />
      ))}
      {labels.map((_, i) => {
        const p = pt(i);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#e5eaed" strokeWidth="1" />;
      })}
      <path d={valuePath} fill="#10b981" fillOpacity="0.18" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
      {labels.map((label, i) => {
        const lx = cx + (R + 18) * Math.cos(angle(i));
        const ly = cy - (R + 18) * Math.sin(angle(i));
        return (
          <text key={i} x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fontWeight="bold" fill={scores[i] < 3.5 ? "#f59e0b" : "#8aa3ad"}
            fontFamily="sans-serif" letterSpacing="0.04em">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  const W = 48, H = 20;
  const min = Math.min(...values), range = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / range) * H * 0.75 - H * 0.1,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 48, height: 20 }}>
      <path d={d} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Score Slider ─────────────────────────────────────────────────────────────

function ScoreSlider({ competency, onChange }: { competency: Competency; onChange: (id: string, v: number) => void }) {
  const pct      = ((competency.score - 1) / 4) * 100;
  const isLow    = competency.score < 3.5;
  const trackClr = isLow ? "#f59e0b" : "#10b981";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#203D47]">{competency.label}</span>
        <span className={`text-sm font-bold ${isLow ? "text-amber-500" : "text-emerald-500"}`}>
          {competency.score.toFixed(1)}
        </span>
      </div>
      <input
        type="range" min="1" max="5" step="0.1"
        value={competency.score}
        onChange={(e) => onChange(competency.id, parseFloat(e.target.value))}
        className="eval-slider w-full cursor-pointer"
        style={{ background: `linear-gradient(to right, ${trackClr} 0%, ${trackClr} ${pct}%, #e5eaed ${pct}%, #e5eaed 100%)` }}
      />
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_COMPETENCIES: Competency[] = [
  { id: "comm", label: "Communication",         score: 3.8 },
  { id: "tech", label: "Technical Proficiency",  score: 4.5 },
  { id: "lead", label: "Leadership & Influence", score: 3.2 },
  { id: "inno", label: "Innovation",             score: 4.1 },
  { id: "reli", label: "Reliability",            score: 4.7 },
];

const HISTORY = [
  { label: "Annual Review", date: "Dec 2023", score: 4.2, sparkline: [3.8, 4.0, 4.1, 4.2] },
  { label: "Q4 Feedback",   date: "Oct 2023", score: 3.9, sparkline: [3.6, 3.7, 3.9, 3.9] },
  { label: "Q3 Check-in",   date: "Jul 2023", score: 3.7, sparkline: [3.5, 3.6, 3.7, 3.7] },
];

const RECOMMENDATIONS = [
  "Retention & Skill Enhancement",
  "Performance Improvement Plan",
  "Leadership Development",
  "Promotion Candidate",
  "Lateral Transition",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvaluacionEmpleadoPage() {
  const router  = useRouter();
  const params  = useParams();
  const empId   = params?.id as string;

  const [empleado, setEmpleado]         = useState<Empleado | null>(null);
  const [cargando, setCargando]         = useState(true);
  const [competencies, setCompetencies] = useState<Competency[]>(INITIAL_COMPETENCIES);
  const [period, setPeriod]             = useState("Q1 - 2024");
  const [recommendation, setRecommendation] = useState(RECOMMENDATIONS[0]);
  const [observations, setObservations] = useState("");

  useEffect(() => {
    obtenerEmpleadoPorId(empId)
      .then(setEmpleado)
      .finally(() => setCargando(false));
  }, [empId]);

  const compositeScore = useMemo(
    () => (competencies.reduce((s, c) => s + c.score, 0) / competencies.length).toFixed(2),
    [competencies]
  );

  const setScore = (id: string, value: number) =>
    setCompetencies((prev) => prev.map((c) => (c.id === id ? { ...c, score: value } : c)));

  const iniciales = empleado
    ? `${empleado.nombre.charAt(0)}${empleado.apellidos.charAt(0)}`.toUpperCase()
    : "??";

  return (
    <>
      <style>{`
        .eval-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; }
        .eval-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: white; border: 2px solid #10b981; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
        .eval-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: white; border: 2px solid #10b981; cursor: pointer; }
      `}</style>

      <div className="flex flex-col min-h-screen bg-[#f4f7f8]">
        {/* Header */}
        <header className="flex items-center px-6 py-3.5 bg-white border-b border-[#d1dde2] shrink-0">
          <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
            <span className="hover:text-[#203D47] cursor-pointer transition-colors">Dashboard</span>
            <ChevronRight size={12} className="text-[#c5d5db]" />
            <span
              onClick={() => router.push("/dashboard/empleados")}
              className="hover:text-[#203D47] cursor-pointer transition-colors"
            >
              Employee Directory
            </span>
            <ChevronRight size={12} className="text-[#c5d5db]" />
            <span className="text-[#0F1819] font-semibold">
              {cargando ? "Cargando..." : `${empleado?.nombre} ${empleado?.apellidos}`}
            </span>
            <ChevronRight size={12} className="text-[#c5d5db]" />
            <span className="text-[#0F1819] font-semibold">Create Evaluation</span>
          </nav>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 pb-24">
          {cargando ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 rounded-full border-2 border-[#203D47] border-t-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_320px] gap-5 max-w-5xl mx-auto">

              {/* ── Left: Form ── */}
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-8">

                {/* Evaluation Context */}
                <section>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-4">
                    Evaluation Context
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Employee (pre-filled, read-only) */}
                    <div>
                      <label className="text-xs font-medium text-[#8aa3ad] mb-1.5 block">Employee</label>
                      <div className="flex items-center gap-2.5 border border-[#d1dde2] rounded-xl px-3 py-2.5 bg-[#fafcfc]">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#203D47] to-[#0F1819] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {iniciales}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0F1819] leading-none truncate">
                            {empleado?.nombre} {empleado?.apellidos}
                          </p>
                          <p className="text-[10px] text-[#8aa3ad] mt-0.5">{empleado?.codigoEmpleado}</p>
                        </div>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c5d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                    </div>

                    {/* Period */}
                    <div>
                      <label className="text-xs font-medium text-[#8aa3ad] mb-1.5 block">Evaluation Period</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full appearance-none border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#0F1819] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-7"
                          >
                            {["Q1 - 2024", "Q2 - 2024", "Q3 - 2024", "Q4 - 2024"].map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
                        </div>
                        <div className="relative">
                          <select className="w-full appearance-none border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#0F1819] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-7">
                            {["2024", "2023", "2022"].map((y) => <option key={y}>{y}</option>)}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Competency Scoring */}
                <section>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-4">
                    Competency Scoring
                  </h2>
                  <div className="space-y-5">
                    {competencies.map((c) => (
                      <ScoreSlider key={c.id} competency={c} onChange={setScore} />
                    ))}
                  </div>
                </section>

                {/* Evaluation Summary */}
                <section>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-4">
                    Evaluation Summary
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[#8aa3ad] mb-1.5 block">
                        Strategic Recommendation
                      </label>
                      <div className="relative">
                        <select
                          value={recommendation}
                          onChange={(e) => setRecommendation(e.target.value)}
                          className="w-full appearance-none border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#0F1819] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-8"
                        >
                          {RECOMMENDATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#8aa3ad] mb-1.5 block">
                        Qualitative Observations
                      </label>
                      <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        rows={4}
                        placeholder="Provide detailed feedback on performance metrics and cultural alignment..."
                        className="w-full border border-[#d1dde2] rounded-xl px-3 py-2.5 text-sm text-[#0F1819] placeholder:text-[#c5d5db] focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none bg-[#fafcfc]"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Right: Live Preview ── */}
              <div className="space-y-4">
                {/* Performance Profile */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F1819]">Performance Profile</h3>
                      <p className="text-[10px] text-[#8aa3ad] mt-0.5">Metric distribution vs. Benchmark</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest border border-emerald-200 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                      Live Preview
                    </span>
                  </div>

                  <EvalRadarChart scores={competencies.map((c) => c.score)} />

                  <div className="flex items-end justify-between mt-2 pt-3 border-t border-[#f0f4f5]">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-[#8aa3ad] font-bold">Composite Score</p>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-3xl font-extrabold text-[#0F1819] leading-none">{compositeScore}</span>
                        <span className="text-sm text-[#8aa3ad] mb-0.5">/5.0</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg px-2.5 py-1.5">
                      <TrendingUp size={11} />
                      <span className="text-[10px] font-bold">+12% vs LY</span>
                    </div>
                  </div>
                </div>

                {/* Evaluation History */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-bold text-[#0F1819] mb-4">Evaluation History</h3>
                  <div className="space-y-3">
                    {HISTORY.map((h) => (
                      <div key={h.label} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0F1819] leading-none">{h.label}</p>
                          <p className="text-[10px] text-[#8aa3ad] mt-0.5">{h.date}</p>
                        </div>
                        <Sparkline values={h.sparkline} />
                        <span className="text-sm font-bold text-[#0F1819] w-7 text-right shrink-0">
                          {h.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full text-center text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] hover:text-[#203D47] transition-colors pt-3 border-t border-[#f0f4f5]">
                    View Detailed Archive
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-[220px] right-0 bg-white border-t border-[#d1dde2] px-8 py-4 flex items-center justify-between z-10">
          <button
            onClick={() => router.back()}
            className="text-sm text-[#8aa3ad] hover:text-[#203D47] transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#d1dde2] text-[#203D47] hover:bg-gray-50 transition-colors">
              Save Draft
            </button>
            <button
              onClick={async () => {
                if (!empleado) return;
                // Construir payload de evaluación
                const evalObj: Evaluation = {
                  id: `${Date.now()}`,
                  title: `${period} Review`,
                  reviewer: "Current User",
                  date: new Date().toLocaleDateString(),
                  score: parseFloat(compositeScore),
                  isRecent: true,
                  competencies: competencies.map((c) => ({ name: c.label, score: parseFloat(c.score.toFixed(2)) })),
                  observations,
                };

                try {
                  await guardarEvaluacion(empId, evalObj);
                  // Redirigir al detalle del empleado para ver la evaluación en desempeño
                  router.push(`/dashboard/empleados/${empId}`);
                } catch (err) {
                  console.error("Error guardando evaluación:", err);
                }
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
            >
              Confirm Evaluation
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
