"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileDown, Filter } from "lucide-react";
import toast from "react-hot-toast";

import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import {
  generarReporteConsolidado,
  generarReportePorArea,
} from "@/services/evaluacionService";
import { obtenerAreas, type Area } from "@/services/areasService";
import { translateBackendError } from "@/lib/api/translateError";

type Modo = "consolidado" | "area";

export default function ReportesPage() {
  return (
    <RouteGuard requireHumanTalent>
      <ReportesContenido />
    </RouteGuard>
  );
}

function ReportesContenido() {
  const [modo, setModo] = useState<Modo>("consolidado");
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areaId, setAreaId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formato, setFormato] = useState<"json" | "csv">("csv");
  const [generando, setGenerando] = useState(false);
  const [resultadoJson, setResultadoJson] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;
    obtenerAreas()
      .then((data) => { if (mounted) setAreas(data); })
      .catch(() => { if (mounted) setAreas([]); })
      .finally(() => { if (mounted) setAreasLoading(false); });
    return () => { mounted = false; };
  }, []);

  const validar = (): string | null => {
    if (modo === "area" && !areaId) return "Seleccioná un área para generar el reporte.";
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return "La fecha inicial no puede ser mayor a la final.";
    }
    return null;
  };

  // Descarga un archivo CSV en cliente. Si el backend devolvió un objeto con
  // `csv: string`, lo usamos; si devolvió otra estructura, intentamos
  // serializar.
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

  const generar = async () => {
    const err = validar();
    if (err) {
      toast.error(err);
      return;
    }
    setGenerando(true);
    setResultadoJson(null);
    try {
      const fechaInicio = startDate || undefined;
      const fechaFin = endDate || undefined;

      const resp =
        modo === "consolidado"
          ? await generarReporteConsolidado({
              startDate: fechaInicio,
              endDate: fechaFin,
              export: formato,
            })
          : await generarReportePorArea({
              areaId: Number(areaId),
              startDate: fechaInicio,
              endDate: fechaFin,
              export: formato,
            });

      if (formato === "csv") {
        const nombre =
          modo === "consolidado"
            ? `desempeno-consolidado-${Date.now()}.csv`
            : `desempeno-area-${areaId}-${Date.now()}.csv`;
        descargarCsv(resp, nombre);
        toast.success("Reporte generado y descargado.");
      } else {
        setResultadoJson(resp);
        toast.success("Reporte generado en formato JSON.");
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      toast.error(translateBackendError(raw) || "No se pudo generar el reporte.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f8]">
      <Header user={null} />

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">
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
                  <option value="">Seleccioná un área</option>
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
                  JSON (mostrar acá)
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
          <div className="mt-6 rounded-2xl border border-[#e4ebee] bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-[#0F1819]">Resultado (JSON)</h3>
            <pre className="max-h-[400px] overflow-auto rounded-lg border border-[#f0f4f5] bg-[#fafcfc] p-4 text-xs text-[#576975]">
              {JSON.stringify(resultadoJson, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
