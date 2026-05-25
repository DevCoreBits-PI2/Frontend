// components/dashboard/CriticalContractAlerts.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { AlertaContrato } from "@/services/dashboardService";

interface Props {
  alertas: AlertaContrato[];
  loading?: boolean;
}

function colorPorDias(dias: number): string {
  if (dias <= 7) return "text-rose-500";
  if (dias <= 14) return "text-orange-500";
  return "text-blue-500";
}

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "N/A";
  try {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-CO", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  } catch {
    return fecha;
  }
}

export default function CriticalContractAlerts({ alertas, loading = false }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e4ebee] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="text-sm font-bold text-[#0F1819]">Alertas Críticas de Contratos</h2>
        </div>
        <span className="text-xs text-[#8aa3ad] font-medium">Próximos 30 días</span>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#f0f4f5]">
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-xl bg-[#ECEFF1] animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-[#e4ebee] rounded animate-pulse mb-1" />
                  <div className="h-3 bg-[#f0f4f5] rounded w-3/4 animate-pulse" />
                </div>
              </div>
              <div className="w-20 h-8 bg-[#e4ebee] rounded animate-pulse" />
            </div>
          ))
        ) : alertas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-5xl mb-3">✓</div>
            <p className="text-sm font-semibold text-[#0F1819]">Sin alertas críticas</p>
            <p className="text-xs text-[#8aa3ad] mt-1">
              Ningún contrato vence en los próximos 30 días
            </p>
          </div>
        ) : (
          alertas.map((alerta) => {
            const color = colorPorDias(alerta.diasRestantes);
            return (
              <div
                key={alerta.idContrato}
                className="flex items-center justify-between py-2 border-b border-[#f0f4f5] last:border-0 hover:bg-[#f9fafb] px-1 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#ECEFF1] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#203D47]">
                      {alerta.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F1819] leading-none">
                      {alerta.nombre || "Sin nombre"}
                    </p>
                    <p className="text-xs text-[#8aa3ad] mt-0.5">
                      {alerta.codigoContrato}
                      {alerta.departamento && ` • ${alerta.departamento}`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className={`text-xs font-bold ${color}`}>
                    Exp. en {alerta.diasRestantes} día{alerta.diasRestantes !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-[#8aa3ad]">{formatearFecha(alerta.fechaFin)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && alertas.length > 0 && (
        <button className="mt-4 text-xs text-[#8aa3ad] hover:text-[#203D47] transition-colors font-medium text-center w-full pt-3 border-t border-[#f0f4f5]">
          Ver todos los hitos contractuales
        </button>
      )}
    </div>
  );
}