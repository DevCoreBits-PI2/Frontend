// components/contracts/ContractStatsBar.tsx
"use client";

import { CheckCircle, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { EstadisticasContratos } from "@/types/contract";

interface Props {
  estadisticas: EstadisticasContratos;
}

const STATS = [
  {
    key: "activos" as const,
    etiqueta: "Activos",
    icono: CheckCircle,
    colorIcono: "text-emerald-500",
    colorBarra: "bg-emerald-500",
  },
  {
    key: "proxAVencer" as const,
    etiqueta: "Próximos a vencer",
    icono: AlertCircle,
    colorIcono: "text-rose-500",
    colorBarra: "bg-rose-500",
  },
  {
    key: "renovados" as const,
    etiqueta: "Renovados",
    icono: RefreshCw,
    colorIcono: "text-blue-500",
    colorBarra: "bg-blue-500",
  },
  {
    key: "vencidosAnulados" as const,
    etiqueta: "Vencidos / Anulados",
    icono: XCircle,
    colorIcono: "text-slate-400",
    colorBarra: "bg-slate-400",
  },
];

export default function ContractStatsBar({ estadisticas }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {STATS.map(({ key, etiqueta, icono: Icono, colorIcono, colorBarra }) => (
        <div key={key} className="bg-white rounded-xl border border-[#e4ebee] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#8aa3ad] mb-1">{etiqueta.toUpperCase()}</p>
              <p className="text-2xl font-bold text-[#0F1819]">
                {estadisticas[key].toLocaleString()}
              </p>
            </div>
            <Icono size={22} className={colorIcono} />
          </div>
          <div className={`h-1 w-full ${colorBarra}`} />
        </div>
      ))}
    </div>
  );
}