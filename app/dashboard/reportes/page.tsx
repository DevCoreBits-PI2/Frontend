"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileDown, Filter } from "lucide-react";
import toast from "react-hot-toast";

import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/lib/auth/AuthContext";
import { canManageHumanTalent } from "@/lib/auth/roles";
import {
  generarReporteConsolidado,
  generarReportePorArea,
  listarEvaluacionesPorEmpleado,
} from "@/services/evaluacionService";
import { obtenerAreas, type Area } from "@/services/areasService";
import { translateBackendError } from "@/lib/api/translateError";
import ReporteGraficaBarras from "@/components/reportes/ReporteGraficaBarras";
import type { PerformanceEvaluationDto } from "@/types/api/career";

type Modo = "consolidado" | "area";

interface ReporteJson {
  data?: Array<{
    id_employee?: number;
    averages?: {
      communication?: number;
      technical_proficiency?: number;
      leadership_influence?: number;
      innovation?: number;
      reliability?: number;
    };
    overall_score?: number;
    evaluations?: number;
  }>;
  meta?: {
    totalEmployees?: number;
    totalEvaluations?: number;
    overallScore?: number | null;
  };
  message?: string;
}

/**
 * Página de Reportes — visible para todos los autenticados.
 *
 * Renderiza dos variantes según el rol:
 *   - Admin / HumanTalent → generador de reportes consolidados (lo que ya
 *     existía: filtros por rango/área, descarga CSV, gráfica agregada).
 *   - Empleado regular / Jefe sin perfil HT → vista "Mis evaluaciones":
 *     promedio de sus propias evaluaciones de desempeño, en la misma
 *     gráfica de barras pero alimentada solo con su data personal.
 *
 * No usamos RouteGuard porque cualquier autenticado puede entrar; la
 * división del contenido se hace acá según `canManageHumanTalent`.
 */
export default function ReportesPage() {
  const { ready, authUser } = useAuth();

  if (!ready) {
    return <LoadingSpinner mensaje="Cargando reportes..." />;
  }

  const esGestor = authUser ? canManageHumanTalent(authUser) : false;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f8]">
      <Header user={null} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">
        {esGestor ? <ReportesGestor /> : <MisEvaluaciones />}
      </main>
    </div>
  );
}

// ───────────────────────── Vista Admin / HumanTalent ─────────────────────────

function ReportesGestor() {
  const [modo, setModo] = useState<Modo>("consolidado");
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areaId, setAreaId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formato, setFormato] = useState<"json" | "csv">("csv");
  const [generando, setGenerando] = useState(false);
  const [resultadoJson, setResultadoJson] = useState<ReporteJson | null>(null);
  const [ultimoReporteCtx, setUltimoReporteCtx] = useState<{
    modo: Modo;
    areaId?: number;
    startDate?: string;
    endDate?: string;
  } | null>(null);
  const [descargandoCsv, setDescargandoCsv] = useState(false);

  useEffect(() => {
    let mounted = true;
    obtenerAreas()
      .then((data) => { if (mounted) setAreas(data); })
      .catch(() => { if (mounted) setAreas([]); })
      .finally(() => { if (mounted) setAreasLoading(false); });
    return () => { mounted = false; };
  }, []);

  const validar = (): string | null => {
    if (modo === "area" && !areaId) return "Selecciona un área para generar el reporte.";
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return "La fecha inicial no puede ser mayor a la final.";
    }
    return null;
  };

  const descargarCsv = (payload: unknown, nombre: string) => {
    let csvText = "";
    if (
      payload &&
      typeof payload === "object" &&
      "csv" in (payload as Record<string, unknown>) &&
      typeof (payload as { csv: unknown }).csv === "string"
    ) {
      csvText = (payload as { csv: string }).csv;
    } else if (typeof payload === "string") {
      csvText = payload;
    } else {
      csvText = JSON.stringify(payload, null, 2);
    }
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchReporte = async (fmt: "json" | "csv"): Promise<unknown> => {
    const fechaInicio = startDate || undefined;
    const fechaFin = endDate || undefined;
    if (modo === "consolidado") {
      return generarReporteConsolidado({
        startDate: fechaInicio,
        endDate: fechaFin,
        export: fmt,
      });
    }
    return generarReportePorArea({
      areaId: Number(areaId),
      startDate: fechaInicio,
      endDate: fechaFin,
      export: fmt,
    });
  };

  const generar = async () => {
    const err = validar();
    if (err) {
      toast.error(err);
      return;
    }
    setGenerando(true);
    setResultadoJson(null);
    try {
      const resp = await fetchReporte(formato);

      if (formato === "csv") {
        const nombre =
          modo === "consolidado"
            ? `desempeno-consolidado-${Date.now()}.csv`
            : `desempeno-area-${areaId}-${Date.now()}.csv`;
        descargarCsv(resp, nombre);
        toast.success("Reporte generado y descargado.");
      } else {
        setResultadoJson(resp as ReporteJson);
        setUltimoReporteCtx({
          modo,
          areaId: modo === "area" ? Number(areaId) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        toast.success("Reporte generado.");
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      toast.error(translateBackendError(raw) || "No se pudo generar el reporte.");
    } finally {
      setGenerando(false);
    }
  };

  const descargarCsvDelUltimo = async () => {
    if (!ultimoReporteCtx) return;
    setDescargandoCsv(true);
    try {
      const resp =
        ultimoReporteCtx.modo === "consolidado"
          ? await generarReporteConsolidado({
              startDate: ultimoReporteCtx.startDate,
              endDate: ultimoReporteCtx.endDate,
              export: "csv",
            })
          : await generarReportePorArea({
              areaId: ultimoReporteCtx.areaId!,
              startDate: ultimoReporteCtx.startDate,
              endDate: ultimoReporteCtx.endDate,
              export: "csv",
            });
      const nombre =
        ultimoReporteCtx.modo === "consolidado"
          ? `desempeno-consolidado-${Date.now()}.csv`
          : `desempeno-area-${ultimoReporteCtx.areaId}-${Date.now()}.csv`;
      descargarCsv(resp, nombre);
      toast.success("CSV descargado.");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      toast.error(translateBackendError(raw) || "No se pudo descargar el CSV.");
    } finally {
      setDescargandoCsv(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0F1819]">Reportes de Desempeño</h1>
        <p className="text-sm text-[#8aa3ad] mt-0.5">
          Genera reportes consolidados o por área a partir de las evaluaciones registradas.
        </p>
      </div>

      <div className="rounded-2xl border border-[#e4ebee] bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <BarChart3 size={18} className="text-emerald-500" />
          <h2 className="text-base font-semibold text-[#0F1819]">Configuración del reporte</h2>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            onClick={() => setModo("consolidado")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
              modo === "consolidado"
                ? "border-emerald-500 bg-emerald-50/40"
                : "border-[#e4ebee] hover:border-[#d1dde2]"
            }`}
          >
            <span className="text-sm font-semibold text-[#0F1819]">Consolidado (todos)</span>
            <span className="text-xs text-[#576975]">
              Incluye a todos los empleados con evaluaciones en el rango.
            </span>
          </button>
          <button
            onClick={() => setModo("area")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
              modo === "area"
                ? "border-emerald-500 bg-emerald-50/40"
                : "border-[#e4ebee] hover:border-[#d1dde2]"
            }`}
          >
            <span className="text-sm font-semibold text-[#0F1819]">Por área</span>
            <span className="text-xs text-[#576975]">
              Filtra evaluaciones por el área seleccionada.
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {modo === "area" && (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F1819]">
                Área <span className="text-rose-500">*</span>
              </label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                disabled={areasLoading}
                className="w-full rounded-lg border border-[#d1dde2] px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Selecciona un área</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">Fecha inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[#d1dde2] px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">Fecha final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[#d1dde2] px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-[#0F1819]">Formato</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-[#0F1819]">
                <input
                  type="radio"
                  name="formato"
                  value="csv"
                  checked={formato === "csv"}
                  onChange={() => setFormato("csv")}
                  className="accent-emerald-500"
                />
                CSV (descargable)
              </label>
              <label className="flex items-center gap-2 text-sm text-[#0F1819]">
                <input
                  type="radio"
                  name="formato"
                  value="json"
                  checked={formato === "json"}
                  onChange={() => setFormato("json")}
                  className="accent-emerald-500"
                />
                Gráfica (mostrar aquí)
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f0f4f5] pt-5">
          <button
            onClick={generar}
            disabled={generando}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400 disabled:opacity-60"
          >
            {generando ? (
              <>
                <Filter size={16} className="animate-pulse" />
                Generando...
              </>
            ) : (
              <>
                <FileDown size={16} />
                Generar reporte
              </>
            )}
          </button>
        </div>
      </div>

      {generando && (
        <div className="mt-6">
          <LoadingSpinner mensaje="Procesando datos del reporte..." />
        </div>
      )}

      {resultadoJson != null && (
        <div className="mt-6 flex flex-col gap-4">
          {resultadoJson.message && (!resultadoJson.data || resultadoJson.data.length === 0) ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {resultadoJson.message}
            </div>
          ) : (
            <ReporteGraficaBarras
              data={resultadoJson.data ?? []}
              overallScore={resultadoJson.meta?.overallScore ?? null}
              totalEvaluations={resultadoJson.meta?.totalEvaluations}
            />
          )}

          {(resultadoJson.data?.length ?? 0) > 0 && ultimoReporteCtx && (
            <div className="flex items-center justify-end">
              <button
                onClick={descargarCsvDelUltimo}
                disabled={descargandoCsv}
                className="flex items-center gap-2 rounded-xl border border-[#d1dde2] bg-white px-4 py-2 text-sm font-semibold text-[#0F1819] transition-colors hover:bg-[#f4f7f8] disabled:opacity-60"
              >
                <FileDown size={14} />
                {descargandoCsv ? "Descargando..." : "Descargar este reporte en CSV"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ───────────────────────── Vista Empleado / Jefe ─────────────────────────

/**
 * Vista personal de desempeño: muestra el promedio de las propias evaluaciones
 * del empleado autenticado en la misma gráfica de barras, sumarizando las 5
 * competencias del backend (`communication`, `technical_proficiency`,
 * `leadership_influence`, `innovation`, `reliability`).
 *
 * Backend: `GET /find-performance-evaluations-by-employee/:id`
 *   - Permitido para self / admin / HT / manager.
 *   - Cuando el empleado todavía no fue evaluado, devuelve `[]` y mostramos
 *     un mensaje claro.
 */
function MisEvaluaciones() {
  const { authUser } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState<PerformanceEvaluationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser?.employeeId) {
      setLoading(false);
      return;
    }
    let cancelado = false;
    setLoading(true);
    setError(null);
    listarEvaluacionesPorEmpleado(authUser.employeeId, 1, 100)
      .then((data) => {
        if (!cancelado) setEvaluaciones(data);
      })
      .catch(() => {
        if (!cancelado) setError("No pudimos cargar tus evaluaciones de desempeño.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => { cancelado = true; };
  }, [authUser?.employeeId]);

  // Agregamos las N evaluaciones del usuario en una sola "fila" promediada
  // (compatible con `ReporteGraficaBarras.data`). Si una evaluación no trae
  // un score puntual, lo tratamos como 0 (mismo criterio que el backend).
  const datosGrafica = useMemo(() => {
    if (evaluaciones.length === 0) return { data: [], overall: null as number | null };
    const sums = {
      communication: 0,
      technical_proficiency: 0,
      leadership_influence: 0,
      innovation: 0,
      reliability: 0,
    };
    let n = 0;
    for (const ev of evaluaciones) {
      // El endpoint puede devolver `{ performance_evaluations: {...} }` envuelto.
      const e = (ev as { performance_evaluations?: PerformanceEvaluationDto }).performance_evaluations ?? ev;
      sums.communication += e.communication ?? 0;
      sums.technical_proficiency += e.technical_proficiency ?? 0;
      sums.leadership_influence += e.leadership_influence ?? 0;
      sums.innovation += e.innovation ?? 0;
      sums.reliability += e.reliability ?? 0;
      n += 1;
    }
    if (n === 0) return { data: [], overall: null };
    const avg = (k: keyof typeof sums) => sums[k] / n;
    const overall =
      (avg("communication") +
        avg("technical_proficiency") +
        avg("leadership_influence") +
        avg("innovation") +
        avg("reliability")) /
      5;
    return {
      data: [
        {
          id_employee: authUser?.employeeId ?? 0,
          averages: {
            communication: Number(avg("communication").toFixed(2)),
            technical_proficiency: Number(avg("technical_proficiency").toFixed(2)),
            leadership_influence: Number(avg("leadership_influence").toFixed(2)),
            innovation: Number(avg("innovation").toFixed(2)),
            reliability: Number(avg("reliability").toFixed(2)),
          },
          overall_score: Number(overall.toFixed(2)),
          evaluations: n,
        },
      ],
      overall: Number(overall.toFixed(2)),
    };
  }, [evaluaciones, authUser?.employeeId]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0F1819]">Mis evaluaciones de desempeño</h1>
        <p className="text-sm text-[#8aa3ad] mt-0.5">
          Resumen agregado de todas las evaluaciones que has recibido. Si todavía no tienes
          evaluaciones registradas, aparecerá vacío.
        </p>
      </div>

      {loading && <LoadingSpinner mensaje="Cargando tus evaluaciones..." />}

      {error && !loading && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && evaluaciones.length === 0 && (
        <div className="rounded-2xl border border-[#e4ebee] bg-white p-10 shadow-sm text-center">
          <BarChart3 size={32} className="mx-auto text-[#c5d5db]" />
          <p className="mt-3 text-sm font-semibold text-[#0F1819]">
            Aún no tienes evaluaciones registradas
          </p>
          <p className="mt-1 text-xs text-[#8aa3ad]">
            Cuando un jefe o Talento Humano registre tu primera evaluación, podrás verla aquí.
          </p>
        </div>
      )}

      {!loading && !error && evaluaciones.length > 0 && (
        <ReporteGraficaBarras
          data={datosGrafica.data}
          overallScore={datosGrafica.overall}
          totalEvaluations={evaluaciones.length}
        />
      )}
    </>
  );
}
