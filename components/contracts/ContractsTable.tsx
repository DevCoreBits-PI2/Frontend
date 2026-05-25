// components/contracts/ContractsTable.tsx
"use client";

import { ContratoUI } from "@/types/contract";
import ContractRow from "./ContractRow";

interface Props {
  contratos: ContratoUI[];
  totalEntradas: number;
  paginaActual: number;
  porPagina: number;
  onVer: (contrato: ContratoUI) => void;
  onEditar: (contrato: ContratoUI) => void;
  onRenovar: (contrato: ContratoUI) => void;
  onPagina: (pagina: number) => void;
}

const COLUMNAS = [
  "Empleado",
  "Tipo de Contrato",
  "Área",
  "Fechas",
  "Estado",
  "Validez",
  "Acciones",
];

export default function ContractsTable({
  contratos,
  totalEntradas,
  paginaActual,
  porPagina,
  onVer,
  onEditar,
  onRenovar,
  onPagina,
}: Props) {
  const totalPaginas = Math.ceil(totalEntradas / porPagina);
  const inicio = (paginaActual - 1) * porPagina + 1;
  const fin = Math.min(paginaActual * porPagina, totalEntradas);

  return (
    <div className="bg-white rounded-xl border border-[#e4ebee] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f5] bg-[#f9fbfc]">
              {COLUMNAS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[10px] font-semibold text-[#8aa3ad] uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contratos.map((contrato) => (
              <ContractRow
                key={contrato.idContrato}
                contrato={contrato}
                onVer={onVer}
                onEditar={onEditar}
                onRenovar={onRenovar}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#f0f4f5]">
        <p className="text-xs text-[#8aa3ad]">
          Mostrando {inicio} a {fin} de {totalEntradas.toLocaleString()} registros
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="px-2.5 py-1.5 text-xs text-[#8aa3ad] hover:text-[#203D47] disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPagina(p)}
              className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                p === paginaActual
                  ? "bg-emerald-500 text-white font-semibold"
                  : "text-[#8aa3ad] hover:bg-[#ECEFF1] hover:text-[#203D47]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="px-2.5 py-1.5 text-xs text-[#8aa3ad] hover:text-[#203D47] disabled:opacity-40 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}