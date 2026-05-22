"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import toast from "react-hot-toast";
import { Empleado, obtenerEmpleadoPorId } from "@/services/empleadosService";
import {
  ResultadoValidacion,
  TipoContrato,
  crearContrato,
  validarContrato,
} from "@/services/contratosService";
import { useAuth } from "@/lib/auth/AuthContext";

import EmpleadoInfoCard from "@/components/contratos/EmpleadoInfoCard";
import ValidationStatusCard from "@/components/contratos/ValidationStatusCard";
import ContractInformationCard from "@/components/contratos/ContractInformationCard";
import AdditionalInformationCard from "@/components/contratos/AdditionalInformationCard";

const VALIDACION_INICIAL: ResultadoValidacion = {
  rangoFechasValido: true,
  sinSolapamiento: true,
};

function fechaIsoHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function fechaIsoEnUnAnio(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function PaginaRegistrarContrato() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const empleadoId = params.id;
  const { authUser } = useAuth();

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario
  const [tipo, setTipo] = useState<TipoContrato>("FIJO");
  const [fechaInicio, setFechaInicio] = useState(fechaIsoHoy);
  const [fechaFin, setFechaFin] = useState(fechaIsoEnUnAnio);
  const [notas, setNotas] = useState("");
  const [documento, setDocumento] = useState<File | null>(null);

  const [validacion, setValidacion] = useState<ResultadoValidacion>(VALIDACION_INICIAL);
  const [guardando, setGuardando] = useState(false);

  // Carga inicial del empleado
  useEffect(() => {
    obtenerEmpleadoPorId(empleadoId)
      .then((emp) => {
        if (!emp) {
          setError("Empleado no encontrado.");
          return;
        }
        setEmpleado(emp);
      })
      .catch(() => setError("No se pudo cargar la informacion del empleado."))
      .finally(() => setCargando(false));
  }, [empleadoId]);

  // Validacion en vivo cada vez que cambian los datos relevantes
  useEffect(() => {
    const fechaFinReal = tipo === "INDEFINIDO" ? null : fechaFin;
    validarContrato(empleadoId, fechaInicio, fechaFinReal).then(setValidacion);
  }, [empleadoId, tipo, fechaInicio, fechaFin]);

  const formularioValido = useMemo(() => {
    if (!fechaInicio) return false;
    if (tipo !== "INDEFINIDO" && !fechaFin) return false;
    return validacion.rangoFechasValido && validacion.sinSolapamiento;
  }, [fechaInicio, fechaFin, tipo, validacion]);

  const handleGuardar = async () => {
    if (!formularioValido || guardando) return;
    if (!documento) {
      toast.error("Debes adjuntar el PDF del contrato.");
      return;
    }
    if (!authUser?.employeeId) {
      toast.error("Tu sesión no tiene empleado asociado para registrar contratos.");
      return;
    }
    setGuardando(true);
    try {
      await crearContrato({
        idEmpleado: empleadoId,
        idManager: empleado?.managerId ?? authUser.employeeId,
        tipo,
        fechaInicio,
        fechaFin: tipo === "INDEFINIDO" ? null : fechaFin,
        notas,
        archivoPdf: documento,
      });
      toast.success("Contrato registrado.");
      router.push(`/dashboard/empleados/${empleadoId}/contratos?creado=1`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo registrar el contrato.";
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f7f8]">
      {/* Barra superior con breadcrumb */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#d1dde2] shrink-0">
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <Link
            href="/dashboard"
            className="hover:text-[#203D47] cursor-pointer transition-colors"
          >
            Panel
          </Link>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <Link
            href="/dashboard/empleados"
            className="hover:text-[#203D47] cursor-pointer transition-colors"
          >
            Directorio de Empleados
          </Link>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <Link
            href={`/dashboard/empleados/${empleadoId}/contratos`}
            className="hover:text-[#203D47] cursor-pointer transition-colors"
          >
            Contratos
          </Link>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="text-[#0F1819] font-semibold">Registrar Contrato</span>
        </nav>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="px-6 py-6 pb-28">
          {cargando && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#203D47] border-t-emerald-400 animate-spin" />
                <span className="text-xs text-[#8aa3ad]">Cargando informacion...</span>
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
              {/* Titulo */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-[#0F1819]">Registrar Contrato</h1>
                <p className="text-sm text-[#8aa3ad] mt-0.5">
                  Crear un nuevo acuerdo legal de empleo para{" "}
                  <span className="text-[#0F1819] font-medium">
                    {empleado.nombre} {empleado.apellidos}
                  </span>
                  .
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                {/* Columna principal */}
                <div className="flex flex-col gap-6">
                  <ContractInformationCard
                    tipo={tipo}
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                    onTipoChange={setTipo}
                    onFechaInicioChange={setFechaInicio}
                    onFechaFinChange={setFechaFin}
                  />

                  <AdditionalInformationCard
                    notas={notas}
                    documento={documento}
                    onNotasChange={setNotas}
                    onDocumentoChange={setDocumento}
                  />
                </div>

                {/* Columna lateral */}
                <aside className="flex flex-col gap-4">
                  <EmpleadoInfoCard empleado={empleado} />
                  <ValidationStatusCard
                    resultado={validacion}
                    nombreEmpleado={`${empleado.nombre} ${empleado.apellidos}`}
                  />
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Barra inferior fija con acciones */}
      {!cargando && !error && empleado && (
        <footer className="border-t border-[#e8eef0] bg-white px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <Link
            href={`/dashboard/empleados/${empleadoId}/contratos`}
            className="text-sm font-medium text-[#576975] hover:text-[#0F1819] transition-colors px-4 py-2"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={!formularioValido || guardando}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-200 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {guardando ? "Guardando..." : "Guardar Contrato"}
          </button>
        </footer>
      )}
    </div>
  );
}
