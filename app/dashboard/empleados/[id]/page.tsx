// app/dashboard/empleados/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmployeeProfileCard from "@/components/empleados/EmployeeProfileCard";
import { Empleado, EstadoEmpleado, obtenerEmpleadoPorId } from "@/services/empleadosService";
import { cambiarEstadoEmpleado } from "@/services/empleadoAdminService";
import { ForbiddenError } from "@/lib/api/client";

type ErrorTipo = "noEncontrado" | "sinPermiso" | "desconocido";

export default function PaginaDetalleEmpleado() {
  const { id } = useParams<{ id: string }>();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorTipo, setErrorTipo] = useState<ErrorTipo | null>(null);

  useEffect(() => {
    obtenerEmpleadoPorId(id)
      .then((data) => {
        if (!data) setErrorTipo("noEncontrado");
        else setEmpleado(data);
      })
      .catch((err) => {
        // El backend (ensureEmployeeAccess) deja entrar solo a admin/HT/
        // manager/self. Cualquier otro perfil que intente abrir este URL
        // recibe 403 → mostramos pantalla específica de acceso restringido.
        if (err instanceof ForbiddenError) setErrorTipo("sinPermiso");
        else setErrorTipo("desconocido");
      })
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

  if (errorTipo === "sinPermiso") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f7f8] px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
          <ShieldAlert size={26} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#0F1819]">Acceso restringido</h2>
          <p className="mt-1 max-w-md text-sm text-[#576975]">
            Solo Talento Humano, los administradores y el jefe directo del
            empleado pueden ver este perfil. Si crees que es un error, contacta
            a Talento Humano.
          </p>
        </div>
      </div>
    );
  }

  if (errorTipo || !empleado) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 px-6 py-4 text-sm text-rose-500 m-6">
        {errorTipo === "noEncontrado"
          ? "Empleado no encontrado."
          : "No se pudo cargar el perfil del empleado."}
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