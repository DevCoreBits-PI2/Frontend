"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, Download, Plus, Calendar } from "lucide-react";

import { Empleado, obtenerEmpleadoPorId } from "@/services/empleadosService";
import { Contrato, EstadoContrato, ValidezContrato, obtenerContratosPorEmpleado } from "@/services/contratosService";
import ContratosTable from "@/components/contratos/ContratosTable";
import ContractToast from "@/components/contratos/ContractToast";

export default function PaginaContratosEmpleado() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const empleadoId = params.id;

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El toast se inicializa en el primer render leyendo la query string,
  // y un efecto separado limpia la URL (sin re-renders en cascada).
  const [toast, setToast] = useState<string | null>(() => {
    if (searchParams.get("creado") === "1") return "Contract created successfully.";
    if (searchParams.get("actualizado") === "1") return "Contract updated successfully.";
    return null;
  });

  const recargarContratos = () => {
    obtenerContratosPorEmpleado(empleadoId)
      .then(setContratos)
      .catch(() => setError("No se pudieron cargar los contratos."));
  };

  const handleContratoRenovado = () => {
    recargarContratos();
    setToast("Contrato renovado con éxito");
  };

  const filtroEstado = searchParams.get("estado") ?? "ALL";

  useEffect(() => {
    Promise.all([
      obtenerEmpleadoPorId(empleadoId),
      obtenerContratosPorEmpleado(empleadoId),
    ])
      .then(([emp, contr]) => {
        if (!emp) {
          setError("Empleado no encontrado.");
          return;
        }
        setEmpleado(emp);
        setContratos(contr);
      })
      .catch(() => setError("No se pudieron cargar los contratos."))
      .finally(() => setCargando(false));
  }, [empleadoId]);

  useEffect(() => {
    if (searchParams.get("creado") === "1" || searchParams.get("actualizado") === "1") {
      const url = new URL(window.location.href);
      url.searchParams.delete("creado");
      url.searchParams.delete("actualizado");
      router.replace(url.pathname + (url.search || ""));
    }
  }, [searchParams, router]);

  const contratosFiltrados =
    filtroEstado === "ALL"
      ? contratos
      : contratos.filter((c) => c.estado === filtroEstado);

  const iniciales = empleado
    ? `${empleado.nombre.charAt(0)}${empleado.apellidos.charAt(0)}`.toUpperCase()
    : "";

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f7f8]">
      {/* Barra superior con breadcrumb */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#d1dde2] shrink-0">
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <Link
            href="/dashboard"
            className="hover:text-[#203D47] cursor-pointer transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <Link
            href="/dashboard/empleados"
            className="hover:text-[#203D47] cursor-pointer transition-colors"
          >
            Employee Directory
          </Link>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="text-[#0F1819] font-semibold">Contracts</span>
        </nav>
      </header>

      <main className="flex-1 px-6 py-6 overflow-auto">
        {cargando && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#203D47] border-t-emerald-400 animate-spin" />
              <span className="text-xs text-[#8aa3ad]">Cargando contratos...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-xl px-6 py-4 border border-rose-200 text-sm text-rose-500">
            {error}
          </div>
        )}

        {!cargando && !error && empleado && (
          <>
            {/* Cabecera con datos del empleado */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#203D47] to-[#0F1819] flex items-center justify-center text-white text-lg font-semibold">
                  {iniciales}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#0F1819]">
                    {empleado.nombre} {empleado.apellidos}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
                    Active
                  </span>
                </div>
                <p className="text-sm text-[#576975]">
                  {empleado.cargo} | {empleado.departamento}
                </p>
                <p className="text-xs text-[#8aa3ad]">
                  ID: {empleado.codigoEmpleado} • {empleado.tipoEmpleo}
                </p>
              </div>
            </div>

            <div className="mb-6 flex items-center justify-between border-b border-[#e8eef0] pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">Section</p>
                <h2 className="text-base font-semibold text-[#0F1819]">Contracts</h2>
              </div>
            </div>

            {/* Filtros y boton */}
            <div className="flex items-end justify-between gap-4 mb-5">
              <div className="flex items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">
                    Status
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => {
                      const url = new URL(window.location.href);
                      if (e.target.value === "ALL") url.searchParams.delete("estado");
                      else url.searchParams.set("estado", e.target.value);
                      router.replace(url.pathname + (url.search || ""));
                    }}
                    className="bg-white border border-[#d1dde2] rounded-lg px-3 py-2 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[160px]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVO">Active</option>
                    <option value="RENOVADO">Renewed</option>
                    <option value="EXPIRADO">Expired</option>
                    <option value="ANULADO">Voided</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">
                    Date Range
                  </label>
                  <button
                    type="button"
                    className="flex items-center gap-2 bg-white border border-[#d1dde2] rounded-lg px-3 py-2 text-sm text-[#8aa3ad] min-w-[180px] hover:border-[#a7b5be] transition-colors"
                  >
                    <Calendar size={14} />
                    Select dates
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-[#203D47] border border-[#d1dde2] rounded-xl hover:bg-[#ECEFF1] transition-colors"
                >
                  <Download size={14} />
                  Export History
                </button>
                <Link
                  href={`/dashboard/empleados/${empleadoId}/contratos/registrar`}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
                >
                  <Plus size={15} />
                  Register Contract
                </Link>
              </div>
            </div>

            <ContratosTable
              contratos={contratosFiltrados}
              onVoidSuccess={(id) => {
                setContratos((prev) =>
                  prev.map((c) =>
                    c.id === id
                      ? { ...c, estado: "ANULADO" as EstadoContrato, validez: "VOIDED" as ValidezContrato }
                      : c
                  )
                );
                setToast("Contract voided successfully.");
              }}
              empleadoNombre={`${empleado.nombre} ${empleado.apellidos}`}
              empleadoCodigo={empleado.codigoEmpleado}
              onContratoRenovado={handleContratoRenovado}
            />

            <p className="text-xs text-[#8aa3ad] mt-4">
              Showing {contratosFiltrados.length} contracts of historical records
            </p>
          </>
        )}
      </main>

      {toast && (
        <ContractToast mensaje={toast} onCerrar={() => setToast(null)} />
      )}
    </div>
  );
}
