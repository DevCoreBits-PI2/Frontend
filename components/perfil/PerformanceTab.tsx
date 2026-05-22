"use client";

import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, TrendingUp } from "lucide-react";

import type { PerformanceEvaluationDto } from "@/types/api/career";

// ─── Mapping del backend ──────────────────────────────────────────────────────
//
// El microservicio de trajectory expone evaluaciones con 5 competencias:
//   communication, technical_proficiency, leadership_influence, innovation, reliability
// La UI las muestra con etiquetas en español.

const FIELDS = [
  { key: "communication",         label: "Comunicación",          short: "COMU"  },
  { key: "technical_proficiency", label: "Competencia Técnica",   short: "TÉC"   },
  { key: "leadership_influence",  label: "Liderazgo e Influencia", short: "LIDER" },
  { key: "innovation",            label: "Innovación",            short: "INNOV" },
  { key: "reliability",           label: "Confiabilidad",         short: "CONF"  },
] as const;

type CompetencyKey = (typeof FIELDS)[number]["key"];

interface NormalizedEvaluation {
  id: string;
  evaluationDate: string;
  formattedDate: string;
  reviewer: string;
  observations: string;
  scoresByField: Partial<Record<CompetencyKey, number>>;
  averageScore: number;
}

function formatDateEs(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function getEvaluationId(dto: PerformanceEvaluationDto): number {
  return dto.id ?? dto.id_evaluation ?? 0;
}

// El endpoint `find-performance-evaluations-by-employee/:id` del backend
// devuelve filas de `career_history` con la evaluación anidada en
// `performance_evaluations`. Otros endpoints devuelven la evaluación "plana".
// Esta función reconoce ambas formas: si viene anidada, usamos los campos
// internos para puntajes/fecha del evaluador, y los del exterior como fallback.
type WrappedEvaluationDto = PerformanceEvaluationDto & {
  performance_evaluations?: PerformanceEvaluationDto | null;
  event_date?: string;
};

function unwrapEvaluation(dto: WrappedEvaluationDto): PerformanceEvaluationDto {
  if (dto.performance_evaluations) {
    const inner = dto.performance_evaluations;
    return {
      ...inner,
      // Si la evaluación interna no tiene fecha, caemos a la del career_history.
      evaluation_date: inner.evaluation_date ?? dto.event_date ?? dto.evaluation_date,
    };
  }
  return dto;
}

function normalizeEvaluation(rawDto: WrappedEvaluationDto): NormalizedEvaluation {
  const dto = unwrapEvaluation(rawDto);
  const scoresByField: Partial<Record<CompetencyKey, number>> = {};
  let sum = 0;
  let count = 0;
  for (const { key } of FIELDS) {
    const v = (dto as unknown as Record<string, unknown>)[key];
    if (typeof v === "number") {
      scoresByField[key] = v;
      sum += v;
      count += 1;
    }
  }
  return {
    id: String(getEvaluationId(dto)),
    evaluationDate: dto.evaluation_date,
    formattedDate: formatDateEs(dto.evaluation_date),
    reviewer: `Director ID ${dto.id_director}`,
    observations: dto.observations ?? "",
    scoresByField,
    averageScore: count > 0 ? Number((sum / count).toFixed(2)) : 0,
  };
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function PerformanceLineChart({ points }: { points: { label: string; score: number }[] }) {
  const W = 560, H = 130;
  const PAD = { top: 10, bottom: 28, left: 15, right: 15 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const n = points.length;

  if (n === 0) {
    return (
      <div className="flex h-[130px] items-center justify-center text-xs text-[#8aa3ad]">
        Sin datos de evaluaciones para graficar.
      </div>
    );
  }

  const scores = points.map((p) => p.score);
  const minY = Math.max(0, Math.min(...scores) - 0.3);
  const maxY = Math.min(5, Math.max(...scores) + 0.3);
  const denomY = maxY - minY || 1;
  const denomX = n - 1 || 1;

  const toX = (i: number) => PAD.left + (i / denomX) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minY) / denomY) * chartH;

  const scorePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.score).toFixed(1)}`).join(" ");
  const areaPath  = `${scorePath} L${toX(n - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
      <defs>
        <linearGradient id="perf-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {[1, 2, 3, 4, 5].filter((v) => v >= minY && v <= maxY).map((v) => (
        <line key={v} x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#f0f4f5" strokeWidth="1" />
      ))}

      <path d={areaPath}  fill="url(#perf-area)" />
      <path d={scorePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <circle
        cx={toX(n - 1).toFixed(1)}
        cy={toY(points[n - 1].score).toFixed(1)}
        r="3.5" fill="#10b981"
      />

      {points.map((p, i) => (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#8aa3ad" fontFamily="sans-serif">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: Partial<Record<CompetencyKey, number>> }) {
  const cx = 90, cy = 82, R = 55;
  const labels = FIELDS.map((f) => f.short);
  // Normalizamos a [0,1] sobre la escala 0..5 del backend.
  const values = FIELDS.map((f) => {
    const v = scores[f.key];
    return typeof v === "number" ? Math.max(0, Math.min(1, v / 5)) : 0;
  });

  const angle = (i: number) => ((90 - i * (360 / labels.length)) * Math.PI) / 180;
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
        <span className="text-[#8aa3ad] font-medium">{score.toFixed(2)}/5</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Helpers públicos ─────────────────────────────────────────────────────────

export function sortEvaluationsByDateAsc(items: PerformanceEvaluationDto[]): NormalizedEvaluation[] {
  return items
    .map((dto) => normalizeEvaluation(dto as WrappedEvaluationDto))
    .sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime());
}

// ─── Public exports ───────────────────────────────────────────────────────────

interface PerformanceProps {
  evaluations: PerformanceEvaluationDto[];
  loading?: boolean;
  error?: string | null;
}

export function PerformanceMain({ evaluations, loading, error }: PerformanceProps) {
  const asc = useMemo(() => sortEvaluationsByDateAsc(evaluations), [evaluations]);
  const desc = useMemo(() => [...asc].reverse(), [asc]);
  const chartPoints = useMemo(
    () => asc.map((e) => ({
      label: e.formattedDate.replace(",", "").split(" ").slice(1).join(" "),
      score: e.averageScore,
    })),
    [asc],
  );

  const [expanded, setExpanded] = useState<string | null>(desc[0]?.id ?? null);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm text-center text-sm text-[#8aa3ad]">
        Cargando evaluaciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-8 text-center text-sm text-rose-500">
        {error}
      </div>
    );
  }

  if (desc.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm text-center text-sm text-[#8aa3ad]">
        No hay evaluaciones registradas todavía.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0F1819]">
            Desempeño en el Tiempo
          </h2>
          <div className="flex items-center gap-4 text-[10px] text-[#8aa3ad]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded bg-emerald-500" />
              Puntuación promedio
            </span>
          </div>
        </div>
        <PerformanceLineChart points={chartPoints} />
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f0f4f5]">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#0F1819]">
            Historial de Evaluaciones
          </h2>
        </div>

        {desc.map((ev, idx) => {
          const isLatest = idx === 0;
          const competencies = FIELDS.filter((f) => typeof ev.scoresByField[f.key] === "number");
          return (
            <div key={ev.id} className="border-b border-[#f0f4f5] last:border-b-0">
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#fafcfc] transition-colors text-left"
                onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isLatest ? "bg-emerald-100" : "bg-gray-100"}`}>
                  {isLatest ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8aa3ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-[#0F1819] truncate">Evaluación · {ev.formattedDate}</p>
                  <p className="text-xs text-[#8aa3ad]">por {ev.reviewer}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-base font-bold text-[#0F1819] leading-none">{ev.averageScore.toFixed(2)}</p>
                    <p className="text-[9px] uppercase tracking-widest text-[#8aa3ad] mt-0.5">Puntuación Promedio</p>
                  </div>
                  {expanded === ev.id
                    ? <ChevronUp size={14} className="text-[#8aa3ad]" />
                    : <ChevronDown size={14} className="text-[#8aa3ad]" />
                  }
                </div>
              </button>

              {expanded === ev.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-5 pb-5 pt-4 bg-[#fafcfc] border-t border-[#f0f4f5]">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-3">
                      Desglose de Competencias
                    </p>
                    {competencies.length > 0 ? (
                      <div className="space-y-3">
                        {competencies.map((f) => (
                          <CompetencyBar key={f.key} name={f.label} score={ev.scoresByField[f.key] as number} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#8aa3ad]">Sin competencias registradas.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-3">
                      Observaciones
                    </p>
                    <p className="text-xs text-[#203D47] leading-relaxed italic">
                      {ev.observations || "Sin observaciones."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PerformanceSidebar({ evaluations }: PerformanceProps) {
  const asc = useMemo(() => sortEvaluationsByDateAsc(evaluations), [evaluations]);
  const latest = asc[asc.length - 1];
  const previous = asc[asc.length - 2];

  if (!latest) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm text-center text-xs text-[#8aa3ad]">
        Aún no hay evaluaciones.
      </div>
    );
  }

  const deltaPct = previous && previous.averageScore > 0
    ? ((latest.averageScore - previous.averageScore) / previous.averageScore) * 100
    : null;
  const trendUp = (deltaPct ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#0F1819] p-5 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -left-4 -bottom-4 w-14 h-14 rounded-full bg-white/5" />

        <div className="relative">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-3">
            Última Evaluación
          </p>

          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-4xl font-extrabold leading-none">{latest.averageScore.toFixed(2)}</span>
            <span className="text-sm text-white/50 mb-1">/5.0</span>
          </div>

          {deltaPct !== null && (
            <div className="flex items-center gap-1 mb-3">
              <TrendingUp size={11} className={trendUp ? "text-emerald-400" : "text-rose-400"} />
              <span className={`text-[10px] font-bold ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
                {trendUp ? "+" : ""}{deltaPct.toFixed(1)}% vs evaluación anterior
              </span>
            </div>
          )}

          <p className="text-[10px] text-white/50 leading-relaxed">
            Realizada el {latest.formattedDate}.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#8aa3ad] mb-1">
          Perfil de Competencias
        </p>
        <RadarChart scores={latest.scoresByField} />
      </div>
    </div>
  );
}
