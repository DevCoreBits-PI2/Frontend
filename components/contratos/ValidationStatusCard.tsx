"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { ResultadoValidacion } from "@/services/contratosService";

interface ValidationStatusCardProps {
  resultado: ResultadoValidacion;
  nombreEmpleado: string;
}

export default function ValidationStatusCard({
  resultado,
  nombreEmpleado,
}: ValidationStatusCardProps) {
  const items = [
    {
      titulo: "Rango de Fechas Válido",
      descripcion: "La fecha de fin debe ser posterior a la de inicio (o no aplicar si es indefinido).",
      ok: resultado.rangoFechasValido,
    },
    {
      titulo: "Sin Contratos Solapados",
      descripcion: `${nombreEmpleado} no tiene otros contratos activos durante este período.`,
      ok: resultado.sinSolapamiento,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e8eef0] p-5">
      <h3 className="text-sm font-bold text-[#0F1819] mb-4">Estado de Validación</h3>
      <ul className="flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item.titulo} className="flex items-start gap-2.5">
            {item.ok ? (
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            ) : (
              <XCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#0F1819]">{item.titulo}</span>
              <span className="text-[11px] text-[#8aa3ad] leading-snug">
                {item.descripcion}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
