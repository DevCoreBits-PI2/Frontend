"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, FileText, MapPin, ClipboardList } from "lucide-react";
import { Empleado, obtenerEmpleados } from "@/services/empleadosService";

export default function PaginaDirectorioEmpleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerEmpleados()
      .then(setEmpleados)
      .catch(() => setError("No se pudo cargar el directorio de empleados."))
      .finally(() => setCargando(false));
  }, []);

  const empleadosFiltrados = empleados.filter((e) => {
    const t = busqueda.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(t) ||
      e.apellidos.toLowerCase().includes(t) ||
      e.cargo.toLowerCase().includes(t) ||
      e.departamento.toLowerCase().includes(t)
    );
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f7f8]">
      {/* Barra superior con breadcrumb */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#d1dde2] shrink-0">
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Panel</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="text-[#0F1819] font-semibold">Directorio de Empleados</span>
        </nav>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-6 py-6 overflow-auto">
        {/* Titulo */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0F1819]">Directorio de Empleados</h1>
            <p className="text-sm text-[#8aa3ad] mt-0.5">
              Consulta el personal activo y gestiona sus contratos.
            </p>
          </div>
          <div className="flex items-center justify-end mb-6">
            <Link
              href="/dashboard/empleados/register"
              className="inline-flex items-center gap-2 bg-[#2ECC71] hover:opacity-90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-opacity"
            >
              Crear Empleado
            </Link>
          </div>
        </div>

        { /* Botón de creación de empleado */}



        {/* Buscador */}
        <div className="bg-white rounded-2xl border border-[#e8eef0] px-5 py-4 mb-6 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-[#f8fafb] border border-[#e8eef0] rounded-xl px-3.5 py-2.5">
            <Search size={14} className="text-[#8aa3ad] shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar empleado por nombre, cargo o departamento..."
              className="flex-1 text-sm bg-transparent outline-none text-[#0F1819] placeholder:text-[#c5d5db]"
            />
          </div>
        </div>

        {cargando && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#203D47] border-t-emerald-400 animate-spin" />
              <span className="text-xs text-[#8aa3ad]">Cargando empleados...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-xl px-6 py-4 border border-rose-200 text-sm text-rose-500">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {empleadosFiltrados.length === 0 ? (
              <div className="col-span-full text-center text-sm text-[#8aa3ad] py-10">
                No se encontraron empleados con esa busqueda.
              </div>
            ) : (
              empleadosFiltrados.map((emp) => {
                const iniciales = `${emp.nombre.charAt(0)}${emp.apellidos.charAt(0)}`.toUpperCase();
                return (
                  <article
                    key={emp.id}
                    className="bg-white rounded-2xl border border-[#e8eef0] p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
                  >
                      <Link href={`/dashboard/empleados/${emp.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#203D47] to-[#0F1819] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {iniciales}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <h3 className="text-sm font-bold text-[#0F1819] truncate">
                            {emp.nombre} {emp.apellidos}
                          </h3>
                          <p className="text-xs text-[#8aa3ad] truncate">{emp.cargo}</p>
                        </div>
                      </Link>

                    <div className="flex flex-col gap-1.5 text-xs text-[#576975]">
                      <span className="font-mono text-[11px] text-[#8aa3ad]">
                        #{emp.codigoEmpleado}
                      </span>
                      <span>{emp.departamento}</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-[#8aa3ad]" />
                        {emp.ubicacion}
                      </span>
                    </div>


                    <div className="mt-auto flex gap-2">
                      <Link
                        href={`/dashboard/empleados/${emp.id}/contratos`}
                        className="mt-auto inline-flex items-center justify-center gap-2 bg-[#2ECC71] hover:opacity-90 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-opacity"
                      >
                        <FileText size={13} />
                        Ver Contratos
                      </Link>
                      <Link
                        href={`/dashboard/empleados/${emp.id}/evaluacion`}
                        className="flex-1 inline-flex items-center justify-center gap-2 border border-[#d1dde2] hover:bg-[#f0f4f5] text-[#203D47] text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors"
                      >
                        <ClipboardList size={13} />
                        Evaluar
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
