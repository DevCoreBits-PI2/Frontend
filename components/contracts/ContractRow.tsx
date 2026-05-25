// components/contracts/ContractRow.tsx
"use client";

import { Eye, Pencil, RefreshCw } from "lucide-react";
import { ContratoUI, EstadoContratoUI } from "@/types/contract";

interface Props {
  contrato: ContratoUI;
  onVer: (contrato: ContratoUI) => void;
  onEditar: (contrato: ContratoUI) => void;
  onRenovar: (contrato: ContratoUI) => void;
}

const BADGE: Record<EstadoContratoUI, string> = {
  Activo:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Vencido: "bg-rose-50 text-rose-700 border border-rose-200",
  Renovado: "bg-blue-50 text-blue-700 border border-blue-200",
  Anulado: "bg-slate-100 text-slate-500 border border-slate-200",
};

const BARRA: Record<EstadoContratoUI, string> = {
  Activo:   "bg-emerald-500",
  Vencido:  "bg-rose-500",
  Renovado: "bg-blue-500",
  Anulado:  "bg-slate-400",
};

export default function ContractRow({ contrato, onVer, onEditar, onRenovar }: Props) {
  return (
    <tr className="border-b border-[#f0f4f5] hover:bg-[#f9fbfc] transition-colors">
      {/* Empleado */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#203D47] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {contrato.funcionario.avatar}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#0F1819]">{contrato.funcionario.nombre}</p>
            <p className="text-[10px] text-[#8aa3ad]">{contrato.funcionario.idContrato}</p>
          </div>
        </div>
      </td>

      {/* Tipo */}
      <td className="px-4 py-3 text-xs text-[#0F1819]">{contrato.tipoUI}</td>

      {/* Área */}
      <td className="px-4 py-3 text-xs text-[#0F1819]">{contrato.area}</td>

      {/* Fechas */}
      <td className="px-4 py-3">
        <p className="text-[10px] text-[#8aa3ad]">{contrato.fechaInicio}</p>
        <p className="text-xs font-semibold text-[#0F1819]">{contrato.fechaFin}</p>
      </td>

      {/* Estado badge */}
      <td className="px-4 py-3">
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${BADGE[contrato.estadoUI]}`}>
          {contrato.estadoUI}
        </span>
      </td>

      {/* Validez */}
      <td className="px-4 py-3 min-w-[120px]">
        <div className="h-1.5 bg-[#ECEFF1] rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full transition-all ${BARRA[contrato.estadoUI]}`}
            style={{ width: `${contrato.validezPorcentaje}%` }}
          />
        </div>
        <p className="text-[10px] text-[#8aa3ad]">{contrato.validezTexto}</p>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVer(contrato)}
            className="p-1.5 rounded-lg hover:bg-[#ECEFF1] transition-colors text-[#8aa3ad] hover:text-[#203D47]"
          >
            <Eye size={13} />
          </button>
          {contrato.estadoUI === "Activo" && (
            <button
              onClick={() => onEditar(contrato)}
              className="p-1.5 rounded-lg hover:bg-[#ECEFF1] transition-colors text-[#8aa3ad] hover:text-[#203D47]"
            >
              <Pencil size={13} />
            </button>
          )}
          {(contrato.estadoUI === "Vencido" || contrato.estadoUI === "Anulado") && (
            <button
              onClick={() => onRenovar(contrato)}
              className="flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={10} />
              Renovar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}