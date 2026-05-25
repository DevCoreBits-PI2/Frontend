"use client";

import { Empleado } from "@/services/empleadosService";

interface EmpleadoInfoCardProps {
  empleado: Empleado;
}

export default function EmpleadoInfoCard({ empleado }: EmpleadoInfoCardProps) {
  const iniciales = `${empleado.nombre.charAt(0)}${empleado.apellidos.charAt(0)}`.toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-[#e8eef0] p-5">
      {/* Avatar y nombre */}
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#203D47] to-[#0F1819] flex items-center justify-center text-white text-xl font-semibold mb-3 overflow-hidden">
          {empleado.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={empleado.foto} alt={empleado.nombre} className="w-full h-full object-cover" />
          ) : (
            iniciales
          )}
        </div>
        <h3 className="text-base font-bold text-[#0F1819]">
          {empleado.nombre} {empleado.apellidos}
        </h3>
        <p className="text-xs text-[#8aa3ad] mt-0.5">{empleado.cargo}</p>
        {empleado.estado === "ACTIVO" && (
          <span className="mt-3 inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
            Empleado Activo
          </span>
        )}
      </div>

      {/* Datos */}
      <div className="mt-5 pt-4 border-t border-[#f0f4f5] flex flex-col gap-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#8aa3ad]">ID de Empleado</span>
          <span className="text-[#0F1819] font-semibold">#{empleado.codigoEmpleado}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#8aa3ad]">Departamento</span>
          <span className="text-[#0F1819] font-semibold">{empleado.departamento}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#8aa3ad]">Ubicación</span>
          <span className="text-[#0F1819] font-semibold">{empleado.ubicacion}</span>
        </div>
      </div>
    </div>
  );
}
