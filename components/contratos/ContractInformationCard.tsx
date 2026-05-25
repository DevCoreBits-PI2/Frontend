"use client";

import { Calendar, ClipboardList, Clock4, Infinity as InfinityIcon, Lock } from "lucide-react";
import ContractTypeSelect from "./ContractTypeSelect";
import { TipoContrato } from "@/services/contratosService";

interface ContractInformationCardProps {
  tipo: TipoContrato;
  fechaInicio: string;
  fechaFin: string;
  onTipoChange: (tipo: TipoContrato) => void;
  onFechaInicioChange: (fecha: string) => void;
  onFechaFinChange: (fecha: string) => void;
}

function calcularDuracionDias(inicio: string, fin: string): number | null {
  if (!inicio || !fin) return null;
  const a = new Date(inicio).getTime();
  const b = new Date(fin).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function formatDuracion(dias: number): string {
  if (dias < 30) return `${dias} Días`;
  const meses = Math.round(dias / 30);
  return `${meses} Meses (${dias} días)`;
}

export default function ContractInformationCard({
  tipo,
  fechaInicio,
  fechaFin,
  onTipoChange,
  onFechaInicioChange,
  onFechaFinChange,
}: ContractInformationCardProps) {
  const esIndefinido = tipo === "INDEFINIDO";
  const dias = !esIndefinido ? calcularDuracionDias(fechaInicio, fechaFin) : null;

  const tituloCard = esIndefinido ? "Detalles del Contrato" : "Información del Contrato";

  return (
    <section className="bg-white rounded-2xl border border-[#e8eef0] p-6">
      {/* Encabezado */}
      <header className="flex items-center gap-2 mb-5">
        <ClipboardList size={16} className="text-emerald-500" />
        <h2 className="text-sm font-bold text-[#0F1819]">{tituloCard}</h2>
      </header>

      {/* Tipo de contrato */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-xs font-medium text-[#0F1819]">Tipo de Contrato</label>
        <ContractTypeSelect valor={tipo} onChange={onTipoChange} />
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0F1819]">Fecha de Inicio</label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none"
            />
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => onFechaInicioChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#d1dde2] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 text-[#0F1819] bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0F1819]">Fecha de Fin</label>
          {esIndefinido ? (
            <>
              <div className="relative">
                <input
                  type="text"
                  value="N/A"
                  disabled
                  readOnly
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#e8eef0] rounded-lg bg-[#f4f7f8] text-[#8aa3ad] cursor-not-allowed"
                />
                <Lock
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad]"
                />
              </div>
              <span className="text-[11px] text-[#8aa3ad]">
                No aplica para contratos de término indefinido.
              </span>
            </>
          ) : (
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => onFechaFinChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-[#d1dde2] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 text-[#0F1819] bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Duracion calculada */}
      {esIndefinido ? (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <InfinityIcon size={20} className="text-emerald-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              Duración Calculada
            </span>
            <span className="text-sm font-semibold text-[#0F1819]">
              Duración: Indefinida — Sin fecha de vencimiento
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Clock4 size={16} className="text-emerald-500" />
            <span className="text-sm font-semibold text-[#0F1819]">Duración Calculada</span>
          </div>
          <span className="text-sm font-bold text-[#0F1819]">
            {dias !== null ? formatDuracion(dias) : "—"}
          </span>
        </div>
      )}
    </section>
  );
}
