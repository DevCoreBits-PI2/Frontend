// app/dashboard/contratos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import ContractStatsBar from "@/components/contracts/ContractStatsBar";
import ContratosTable from "@/components/contratos/ContratosTable";
import ContractToast from "@/components/contratos/ContractToast";
import { RouteGuard } from "@/lib/auth/RouteGuard";

import {
  Contrato,
  EstadoContrato,
  ValidezContrato,
  obtenerTodosLosContratos,
} from "@/services/contratosService";
import { Empleado, obtenerEmpleados } from "@/services/empleadosService";
import { EstadisticasContratos } from "@/types/contract";

const ESTADOS: Array<EstadoContrato | "TODOS"> = [
  "TODOS",
  "ACTIVO",
  "RENOVADO",
  "EXPIRADO",
  "ANULADO",
];

const ETIQUETA_ESTADO: Record<EstadoContrato | "TODOS", string> = {
  TODOS:    "Todos los estados",
  ACTIVO:   "Activo",
  RENOVADO: "Renovado",
  EXPIRADO: "Expirado",
  ANULADO:  "Anulado",
};

function calcularEstadisticas(contratos: Contrato[]): EstadisticasContratos {
  const activos = contratos.filter((c) => c.estado === "ACTIVO").length;
  const renovados = contratos.filter((c) => c.estado === "RENOVADO").length;
  const vencidosAnulados = contratos.filter(
    (c) => c.estado === "EXPIRADO" || c.estado === "ANULADO",
  ).length;

  // Contratos activos que vencen dentro de los próximos 30 días
  const hoy = new Date();
  const en30Dias = new Date();
  en30Dias.setDate(hoy.getDate() + 30);

  const proxAVencer = contratos.filter((c) => {
    if (c.estado !== "ACTIVO" || !c.fechaFin) return false;
    const fin = new Date(c.fechaFin);
    return fin >= hoy && fin <= en30Dias;
  }).length;

  return { activos, proxAVencer, renovados, vencidosAnulados };
}

export default function PaginaContratos() {
  // Contratos: solo Admin. Cualquier otro rol que entre por URL directa
  // verá "Acceso restringido".
  return (
    <RouteGuard requireAdmin>
      <ContratosContenido />
    </RouteGuard>
  );
}

function ContratosContenido() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoContrato | "TODOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [contratosData, empleadosData] = await Promise.all([
        obtenerTodosLosContratos(),
        obtenerEmpleados(),
      ]);
      setContratos(contratosData);
      setEmpleados(empleadosData);
    } catch {
      setError("No se pudieron cargar los contratos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const empleadoLookup = useMemo(() => {
    const mapa = new Map(empleados.map((e) => [e.id, e]));
    return (idEmpleado: string) => {
      const emp = mapa.get(idEmpleado);
      if (!emp) return null;
      return {
        nombre: `${emp.nombre} ${emp.apellidos}`,
        codigo: emp.codigoEmpleado,
      };
    };
  }, [empleados]);

  const contratosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim();
    return contratos.filter((c) => {
      if (filtroEstado !== "TODOS" && c.estado !== filtroEstado) return false;
      if (termino) {
        const emp = empleadoLookup(c.idEmpleado);
        const haystack = [
          emp?.nombre ?? "",
          emp?.codigo ?? "",
          c.id,
          c.idEmpleado,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(termino)) return false;
      }
      return true;
    });
  }, [contratos, filtroEstado, busqueda, empleadoLookup]);

  const estadisticas = useMemo(() => calcularEstadisticas(contratos), [contratos]);

  const handleVoidSuccess = (id: string) => {
    setContratos((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, estado: "ANULADO" as EstadoContrato, validez: "VOIDED" as ValidezContrato }
          : c,
      ),
    );
    setToast("Contrato anulado con éxito.");
  };

  const handleContratoRenovado = async () => {
    await cargarDatos();
    setToast("Contrato renovado con éxito.");
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f7f8]">
      <Header user={null} />

      <main className="flex-1 px-6 py-6 overflow-auto">
        {/* Breadcrumb + Título */}
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad] mb-3">
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Panel</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="text-[#0F1819] font-semibold">Contratos</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#0F1819]">Contratos</h1>
          <p className="text-sm text-[#8aa3ad] mt-0.5">
            Registro completo de todos los contratos laborales institucionales.
          </p>
        </div>

        {cargando && <LoadingSpinner mensaje="Cargando contratos..." />}

        {error && (
          <div className="bg-white rounded-xl px-6 py-4 border border-rose-200 text-sm text-rose-500">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <>
            <ContractStatsBar estadisticas={estadisticas} />

            {/* Filtros */}
            <div className="bg-white rounded-2xl border border-[#e8eef0] px-5 py-4 mb-5 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[260px] bg-[#f8fafb] border border-[#e8eef0] rounded-xl px-3.5 py-2.5">
                <Search size={14} className="text-[#8aa3ad] shrink-0" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por empleado, código o ID de contrato..."
                  className="flex-1 text-sm bg-transparent outline-none text-[#0F1819] placeholder:text-[#c5d5db]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8aa3ad]">
                  Estado
                </label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as EstadoContrato | "TODOS")}
                  className="bg-white border border-[#d1dde2] rounded-lg px-3 py-2 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[160px]"
                >
                  {ESTADOS.map((est) => (
                    <option key={est} value={est}>
                      {ETIQUETA_ESTADO[est]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ContratosTable
              contratos={contratosFiltrados}
              lookupEmpleado={empleadoLookup}
              onVoidSuccess={handleVoidSuccess}
              onContratoRenovado={handleContratoRenovado}
            />

            <p className="text-xs text-[#8aa3ad] mt-4">
              Mostrando {contratosFiltrados.length} de {contratos.length} contratos
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
