"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, TrendingUp } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────

const CHART_POINTS = [
  { label: "Q3-2022", score: 3.5,  peer: 3.2  },
  { label: "Q4-2022", score: 3.6,  peer: 3.25 },
  { label: "Q1-2023", score: 3.7,  peer: 3.3  },
  { label: "Q2-2023", score: 3.75, peer: 3.35 },
  { label: "Q3-2023", score: 3.85, peer: 3.4  },
  { label: "Q4-2023", score: 3.92, peer: 3.45 },
  { label: "Q1-2024", score: 4.06, peer: 3.5  },
];

const EVALUATIONS = [
  {
    id: "1",
    title: "Revisión Trimestral Q1 - 2024",
    reviewer: "Sarah Chan",
    date: "14 Mar, 2024",
    score: 4.06,
    isRecent: true,
    competencies: [
      { name: "Competencia Técnica Core",        score: 3.8 },
      { name: "Liderazgo y Mentoría de Equipo",  score: 4.5 },
      { name: "Innovación Estratégica",           score: 3.2 },
      { name: "Impacto y Entrega",                score: 4.1 },
      { name: "Confiabilidad y Apropiación",      score: 4.7 },
    ],
    observations:
      '"Alex sigue siendo un pilar del equipo de infraestructura por su excepcional confiabilidad técnica. Su liderazgo durante la migración del Q1 fue clave. El enfoque para el Q2 debe ser una innovación arquitectónica más amplia y la alineación estratégica interdepartamental."',
  },
  {
    id: "2",
    title: "Auditoría de Desempeño Anual - 2023",
    reviewer: "James Morton",
    date: "20 Dic, 2023",
    score: 3.92,
    isRecent: false,
    competencies: [],
    observations: "",
  },
  {
    id: "3",
    title: "Revisión Trimestral Q3 - 2023",
    reviewer: "Sarah Chan",
    date: "15 Sep, 2023",
    score: 3.85,
    isRecent: false,
    competencies: [],
    observations: "",
  },
];

// ─── Line Chart ───────────────────────────────────────────────────────────────

function PerformanceLineChart() {
  const W = 560, H = 130;
  const PAD = { top: 10, bottom: 28, left: 15, right: 15 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const minY = 2.8, maxY = 4.6;
  const n = CHART_POINTS.length;

  const toX = (i: number) => PAD.left + (i / (n - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minY) / (maxY - minY)) * chartH;

  const scorePath = CHART_POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.score).toFixed(1)}`).join(" ");
  const peerPath  = CHART_POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.peer).toFixed(1)}`).join(" ");
  const areaPath  = `${scorePath} L${toX(n - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
      <defs>
        <linearGradient id="perf-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {[3.0, 3.5, 4.0, 4.5].map((v) => (
        <line key={v} x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#f0f4f5" strokeWidth="1" />
      ))}

      <path d={areaPath}  fill="url(#perf-area)" />
      <path d={peerPath}  fill="none" stroke="#c5d5db" strokeWidth="1.5" strokeDasharray="4,3" />
      <path d={scorePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <circle
        cx={toX(n - 1).toFixed(1)}
        cy={toY(CHART_POINTS[n - 1].score).toFixed(1)}
        r="3.5" fill="#10b981"
      />

      {CHART_POINTS.map((p, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#8aa3ad" fontFamily="sans-serif">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart() {
  const cx = 90, cy = 82, R = 55;
  const labels = ["CORE", "LIDER", "ESTRAT", "IMPACTO", "PROP"];
  const values  = [0.76,   0.90,   0.64,    0.82,      0.94];

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
    <svg viewBox="0 0 180 162" className="w-full">
      {[0.5, 1].map((s) => (
        <path key={s} d={polyPath(s)} fill="none" stroke="#e5eaed" strokeWidth="1" />
      ))}

      {labels.map((_, i) => {
        const p = pt(i);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)} stroke="#e5eaed" strokeWidth="1" />;
      })}

      <path d={valuePath} fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />

      {labels.map((label, i) => {
        const p = pt(i, 1.33);
        return (
          <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fontWeight="bold" fill="#8aa3ad" fontFamily="sans-serif" letterSpacing="0.04em">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Competency bar ───────────────────────────────────────────────────────────

function CompetencyBar({ name, score }: { name: string; score: number }) {
  const pct   = (score / 5) * 100;
  const color = score >= 4.0 ? "#10b981" : score >= 3.5 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#203D47]">{name}</span>
        <span className="text-[#8aa3ad] font-medium">{score}/5</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Public exports ───────────────────────────────────────────────────────────

export function PerformanceMain() {
  const [expanded, setExpanded] = useState<string | null>("1");

  return (
    <div className="space-y-4">
      {/* Performance Over Time */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0F1819]">
            Desempeño en el Tiempo
          </h2>
          <div className="flex items-center gap-4 text-[10px] text-[#8aa3ad]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded bg-emerald-500" />
              Puntuación General
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded" style={{ background: "repeating-linear-gradient(90deg,#c5d5db 0,#c5d5db 3px,transparent 3px,transparent 6px)" }} />
              Promedio de Pares
            </span>
          </div>
        </div>
        <PerformanceLineChart />
      </div>

      {/* Evaluation History */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f0f4f5]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0F1819]">
            Historial de Evaluaciones
          </h2>
        </div>

        {EVALUATIONS.map((ev) => (
          <div key={ev.id} className="border-b border-[#f0f4f5] last:border-b-0">
            {/* Row */}
            <button
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafcfc] transition-colors text-left"
              onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
            >
              {/* Icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ev.isRecent ? "bg-emerald-100" : "bg-gray-100"}`}>
                {ev.isRecent ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8aa3ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-[#0F1819] truncate">{ev.title}</p>
                <p className="text-xs text-[#8aa3ad]">por {ev.reviewer} · {ev.date}</p>
              </div>

              {/* Score */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-base font-bold text-[#0F1819] leading-none">{ev.score.toFixed(2)}</p>
                  <p className="text-[9px] uppercase tracking-widest text-[#8aa3ad] mt-0.5">Puntuación Ponderada</p>
                </div>
                {expanded === ev.id
                  ? <ChevronUp size={14} className="text-[#8aa3ad]" />
                  : <ChevronDown size={14} className="text-[#8aa3ad]" />
                }
              </div>
            </button>

            {/* Expanded detail */}
            {expanded === ev.id && ev.competencies.length > 0 && (
              <div className="grid grid-cols-2 gap-5 px-5 pb-5 pt-4 bg-[#fafcfc] border-t border-[#f0f4f5]">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-3">
                    Desglose de Competencias
                  </p>
                  <div className="space-y-3">
                    {ev.competencies.map((c) => <CompetencyBar key={c.name} {...c} />)}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-3">
                    Observaciones del Auditor
                  </p>
                  <p className="text-xs text-[#203D47] leading-relaxed italic">{ev.observations}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformanceSidebar() {
  return (
    <div className="space-y-4">
      {/* Latest Audit Result */}
      <div className="rounded-xl bg-[#0F1819] p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -left-4 -bottom-4 w-14 h-14 rounded-full bg-white/5" />

        <div className="relative">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-3">
            Última Auditoría
          </p>

          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-4xl font-extrabold leading-none">4.06</span>
            <span className="text-sm text-white/50 mb-1">/5.0</span>
          </div>

          <div className="flex items-center gap-1 mb-3">
            <TrendingUp size={11} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">+3.5% VS PERÍODO ANTERIOR</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {["SUPERA OBJETIVOS", "ALTA CONFIANZA"].map((tag) => (
              <span key={tag} className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
            <span className="text-[9px] font-bold border border-white/20 text-white/60 px-2 py-0.5 rounded">
              TOP TIER
            </span>
          </div>

          <p className="text-[10px] text-white/50 leading-relaxed">
            Alex se encuentra actualmente en el percentil 94 de Arquitectos Senior dentro de la División de Ingeniería.
          </p>
        </div>
      </div>

      {/* Competency Profile */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-1">
          Perfil de Competencias
        </p>
        <RadarChart />
        <button className="w-full text-center text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] hover:text-[#203D47] transition-colors mt-1">
          Ver Métricas Detalladas
        </button>
      </div>

      {/* Leadership Insights */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-3">
          Insights de Liderazgo
        </p>
        <div className="flex items-start gap-3">
          <span className="text-2xl font-extrabold text-emerald-500 leading-none">4</span>
          <div>
            <p className="text-sm font-semibold text-[#0F1819]">Mentees Activos</p>
            <p className="text-xs text-[#8aa3ad] leading-snug">Alto feedback de pares por compartir conocimiento</p>
          </div>
        </div>
      </div>
    </div>
  );
}
