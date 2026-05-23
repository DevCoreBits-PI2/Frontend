// app/dashboard/empleados/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmployeeProfileCard from "@/components/empleados/EmployeeProfileCard";
import { Empleado, EstadoEmpleado, obtenerEmpleadoPorId } from "@/services/empleadosService";
import { cambiarEstadoEmpleado } from "@/services/empleadoAdminService";

export default function PaginaDetalleEmpleado() {
  const { id } = useParams<{ id: string }>();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerEmpleadoPorId(id)
      .then((data) => {
        if (!data) setError("Empleado no encontrado.");
        else setEmpleado(data);
      })
      .catch(() => setError("No se pudo cargar el perfil del empleado."))
      .finally(() => setCargando(false));
  }, [id]);

  const handleEstadoCambiado = async (nuevoEstado: EstadoEmpleado, motivo: string) => {
    if (!empleado) return;
    const actualizado = await cambiarEstadoEmpleado(empleado.id, nuevoEstado, motivo);
    setEmpleado(actualizado);
  };

  // Re-fetch del empleado tras un cambio estructural (traslado de cargo, etc.).
  // `obtenerEmpleadoPorId` ya enriquece con position y area, así el header
  // muestra el cargo nuevo sin necesidad de F5.
  const recargarEmpleado = async () => {
    if (!empleado) return;
    const fresco = await obtenerEmpleadoPorId(empleado.id);
    if (fresco) setEmpleado(fresco);
  };

  if (cargando) return <LoadingSpinner mensaje="Cargando perfil del empleado..." />;

  if (error || !empleado) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 px-6 py-4 text-sm text-rose-500 m-6">
        {error ?? "No se pudo cargar el perfil del empleado."}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Header user={null} />
      <EmployeeProfileCard
        empleado={empleado}
        onEstadoCambiado={handleEstadoCambiado}
        onEmpleadoActualizado={recargarEmpleado}
      />
    </div>
  );
}