"use client";

/**
 * Gráfica de barras horizontales con el promedio por competencia del reporte
 * consolidado de desempeño. Recibe el `data` que devuelve el backend
 * (`{ id_employee, averages: { communication, ... }, overall_score, evaluations }`)
 * y promedia las competencias entre todos los empleados del reporte.
 *
 * Implementación en SVG inline (sin libs externas) para mantener el bundle
 * pequeño. Estilo alineado con la card de desempeño individual.
 */

interface EmployeeAverages {
  communication?: number;
  technical_proficiency?: number;
  leadership_influence?: number;
  innovation?: number;
  reliability?: number;
}

interface EmployeeRow {
  id_employee?: number;
  averages?: EmployeeAverages;
  overall_score?: number;
  evaluations?: number;
}

interface Props {
  data: EmployeeRow[];
  /** Puntaje promedio global del reporte (viene en meta.overallScore). */
  overallScore?: number | null;
  /** Cantidad total de evaluaciones consideradas (viene en meta.totalEvaluations). */
  totalEvaluations?: number;
}

const COMPETENCIAS: Array<{ key: keyof EmployeeAverages; label: string }> = [
  { key: "communication", label: "Comunicación" },
  { key: "technical_proficiency", label: "Técnica" },
  { key: "leadership_influence", label: "Liderazgo" },
  { key: "innovation", label: "Innovación" },
  { key: "reliability", label: "Confianza" },
];

// Escala de evaluaciones: 0 a 5. Cambiar acá si el backend cambia el rango.
const ESCALA_MAX = 5;

function colorBar(score: number): string {
  if (score >= 4) return "#10b981"; // emerald
  if (score >= 3) return "#3b82f6"; // blue
  if (score >= 2) return "#f59e0b"; // amber
  return "#ef4444"; // rose
}

export default function ReporteGraficaBarras({ data, overallScore, totalEvaluations }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e4ebee] bg-white p-6 shadow-sm">
        <p className="py-6 text-center text-sm text-[#8aa3ad]">
          No hay datos suficientes para graficar.
        </p>
      </div>
    );
  }

  // Promedio por competencia sobre TODOS los empleados del reporte.
  const promedios: Record<string, number> = {};
  for (const { key } of COMPETENCIAS) {
    let sum = 0;
    let count = 0;
    for (const row of data) {
      const v = row.averages?.[key];
      if (typeof v === "number" && Number.isFinite(v)) {
        sum += v;
        count += 1;
      }
    }
    promedios[key] = count > 0 ? sum / count : 0;
  }

  return (
    <div className="rounded-2xl border border-[#e4ebee] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#0F1819]">Promedio por competencia</h3>
          <p className="text-xs text-[#8aa3ad] mt-0.5">
            Promedio agregado sobre {data.length}{" "}
            {data.length === 1 ? "empleado" : "empleados"}
            {typeof totalEvaluations === "number" && (
              <> · {totalEvaluations} {totalEvaluations === 1 ? "evaluación" : "evaluaciones"}</>
            )}
          </p>
        </div>
        {typeof overallScore === "number" && (
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">Global</p>
            <p className="text-2xl font-bold text-[#0F1819] leading-none">
              {overallScore.toFixed(2)}
              <span className="text-sm font-medium text-[#8aa3ad]"> / {ESCALA_MAX}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {COMPETENCIAS.map(({ key, label }) => {
          const score = promedios[key];
          const pct = Math.max(0, Math.min(100, (score / ESCALA_MAX) * 100));
          const color = colorBar(score);
          return (
            <div key={key} className="grid grid-cols-[140px_1fr_60px] items-center gap-3">
              <span className="text-xs font-medium text-[#576975] truncate">{label}</span>
              <div className="relative h-6 w-full rounded-md bg-[#f4f7f8] overflow-hidden">
                <div
                  className="h-full rounded-md transition-[width] duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  aria-label={`${label}: ${score.toFixed(2)} sobre ${ESCALA_MAX}`}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={ESCALA_MAX}
                  aria-valuenow={Number(score.toFixed(2))}
                />
              </div>
              <span className="text-xs font-bold text-[#0F1819] tabular-nums text-right">
                {score.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 border-t border-[#f0f4f5] pt-4 text-[10px]">
        <Leyenda color="#10b981" label="≥ 4.0 Excelente" />
        <Leyenda color="#3b82f6" label="3.0 – 3.99 Bueno" />
        <Leyenda color="#f59e0b" label="2.0 – 2.99 Aceptable" />
        <Leyenda color="#ef4444" label="< 2.0 Bajo" />
      </div>
    </div>
  );
}

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-[#8aa3ad]">{label}</span>
    </div>
  );
}
