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
      descripcion: resultado.rangoFechasValido
        ? "La fecha de fin es posterior a la de inicio (o no aplica para indefinidos)."
        : "La fecha de fin debe ser posterior a la de inicio.",
      ok: resultado.rangoFechasValido,
    },
    {
      titulo: "Sin Contratos Solapados",
      descripcion: resultado.sinSolapamiento
        ? `${nombreEmpleado} no tiene otros contratos activos durante este período.`
        : `${nombreEmpleado} ya tiene un contrato activo que se solapa con estas fechas. Anula el vigente o ajusta las fechas para que no se crucen.`,
      ok: resultado.sinSolapamiento,
    },
    {
      titulo: "Duración Legal del Tipo",
      descripcion:
        resultado.mensajeDuracion ??
        "La duración del contrato cumple con las reglas legales para el tipo seleccionado.",
      ok: resultado.duracionValida,
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
