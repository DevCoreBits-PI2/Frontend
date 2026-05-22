"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Lock, CheckCircle2, Info } from "lucide-react";
import toast from "react-hot-toast";

import { Empleado, obtenerEmpleadoPorId } from "@/services/empleadosService";
import {
  Contrato,
  ResultadoValidacion,
  TipoContrato,
  TIPO_CONTRATO_LABEL,
  actualizarContrato,
  obtenerContratoPorId,
  validarContrato,
} from "@/services/contratosService";
import ContractTypeSelect from "@/components/contratos/ContractTypeSelect";

const VALIDACION_INICIAL: ResultadoValidacion = {
  rangoFechasValido: true,
  sinSolapamiento: true,
};

function formatIsoToDisplay(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { month: "long", day: "2-digit", year: "numeric" });
}

function LockedInput({ value }: { value: string }) {
  return (
    <div className="relative">
      <input
        readOnly
        value={value}
        className="w-full rounded-lg border border-[#e8eef0] bg-[#f8fafb] px-3.5 py-2.5 text-sm text-[#8aa3ad] pr-10 outline-none cursor-not-allowed"
      />
      <Lock size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c5d5db]" />
    </div>
  );
}

function ValidationCard({ resultado }: { resultado: ResultadoValidacion }) {
  const items = [
    { label: "Rango de fechas válido", ok: resultado.rangoFechasValido },
    { label: "Sin solapamiento con otros contratos activos", ok: resultado.sinSolapamiento },
  ];

  const allValid = items.every((i) => i.ok);

  return (
    <div className="bg-white rounded-2xl border border-[#e8eef0] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-[#0F1819]">Estado de Validación</h3>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={16}
                className={item.ok ? "text-[#2ECC71] shrink-0" : "text-rose-400 shrink-0"}
              />
              <span className="text-sm text-[#0F1819]">{item.label}</span>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                item.ok ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
              }`}
            >
              {item.ok ? "Válido" : "Inválido"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#8aa3ad] leading-relaxed border-t border-[#f0f4f5] pt-3">
        {allValid
          ? "Todas las condiciones del contrato cumplen las validaciones. Listo para guardar."
          : "Algunas condiciones no se cumplen. Revisa los campos resaltados antes de guardar."}
      </p>
    </div>
  );
}

export default function PaginaEditarContrato() {
  const params = useParams<{ id: string; contratoId: string }>();
  const router = useRouter();
  const { id: empleadoId, contratoId } = params;

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoContrato>("FIJO");
  const [fechaFin, setFechaFin] = useState("");
  const [notas, setNotas] = useState("");

  const [validacion, setValidacion] = useState<ResultadoValidacion>(VALIDACION_INICIAL);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([
      obtenerEmpleadoPorId(empleadoId),
      obtenerContratoPorId(contratoId),
    ])
      .then(([emp, con]) => {
        if (!emp || !con) { setError("No se encontró la información requerida."); return; }
        setEmpleado(emp);
        setContrato(con);
        setTipo(con.tipo);
        setFechaFin(con.fechaFin ?? "");
        setNotas(con.notas);
      })
      .catch(() => setError("Error cargando los datos."))
      .finally(() => setCargando(false));
  }, [empleadoId, contratoId]);

  // Si el tipo cambia a INDEFINIDO, limpiamos la fecha de fin.
  useEffect(() => {
    if (tipo === "INDEFINIDO") setFechaFin("");
  }, [tipo]);

  useEffect(() => {
    if (!contrato) return;
    const fechaFinReal = tipo === "INDEFINIDO" ? null : (fechaFin || null);
    validarContrato(empleadoId, contrato.fechaInicio, fechaFinReal, contratoId).then(setValidacion);
  }, [empleadoId, contrato, contratoId, fechaFin, tipo]);

  const formularioValido = useMemo(() => {
    if (tipo !== "INDEFINIDO" && !fechaFin) return false;
    return validacion.rangoFechasValido && validacion.sinSolapamiento;
  }, [tipo, fechaFin, validacion]);

  const handleGuardar = async () => {
    if (!formularioValido || guardando) return;
    setGuardando(true);
    try {
      await actualizarContrato(contratoId, {
        fechaFin: tipo === "INDEFINIDO" ? null : fechaFin,
        notas,
        tipo,
      });
      toast.success("Contrato actualizado.");
      router.push(`/dashboard/empleados/${empleadoId}/contratos?actualizado=1`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el contrato.";
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#203D47] border-t-[#2ECC71]" />
          <span className="text-xs text-[#8aa3ad]">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error || !contrato || !empleado) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-white px-6 py-4 text-sm text-rose-500">
          {error ?? "Error inesperado"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#f4f7f8]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#d1dde2] bg-white px-6 py-3.5">
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <Link href="/dashboard" className="transition-colors hover:text-[#203D47]">Panel</Link>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <Link href={`/dashboard/empleados/${empleadoId}/contratos`} className="transition-colors hover:text-[#203D47]">Contratos</Link>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="font-semibold text-[#0F1819]">Editar Contrato</span>
        </nav>
      </header>

      <main className="flex-1 overflow-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#0F1819]">
            Editar Contrato: {empleado.nombre} {empleado.apellidos}
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/empleados/${empleadoId}/contratos`}
              className="rounded-lg border border-[#d1dde2] bg-white px-4 py-2 text-sm font-medium text-[#576975] transition-colors hover:text-[#0F1819]"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={!formularioValido || guardando}
              className="rounded-lg bg-[#2ECC71] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

        {contrato.estado === "ACTIVO" && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5">
            <Info size={16} className="mt-0.5 shrink-0 text-sky-500" />
            <div>
              <p className="text-sm font-semibold text-sky-700">Contrato Activo</p>
              <p className="text-xs text-sky-600">
                Estás editando un contrato activo. Los cambios se reflejan inmediatamente.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-[#e8eef0] bg-white p-6">
            <h2 className="mb-5 text-sm font-bold text-[#0F1819]">Detalles del Contrato</h2>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Tipo de Contrato</label>
                <ContractTypeSelect valor={tipo} onChange={setTipo} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Fecha de Inicio</label>
                <LockedInput value={formatIsoToDisplay(contrato.fechaInicio)} />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-medium text-[#576975]">Fecha de Fin</label>
                {tipo === "INDEFINIDO" ? (
                  <>
                    <LockedInput value="N/A — indefinido" />
                    <span className="text-[11px] text-[#8aa3ad]">
                      No aplica para contratos de término indefinido.
                    </span>
                  </>
                ) : (
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-lg border border-[#d1dde2] bg-white px-3.5 py-2.5 text-sm text-[#0F1819] outline-none transition focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#576975]">Notas del Contrato</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
                placeholder="Añade cualquier nota o condición adicional..."
                className="w-full resize-none rounded-lg border border-[#d1dde2] bg-white px-3.5 py-2.5 text-sm text-[#0F1819] outline-none transition focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20 placeholder:text-[#c5d5db]"
              />
              <span className="text-[11px] text-[#8aa3ad]">
                Tipo actual: <strong>{TIPO_CONTRATO_LABEL[tipo]}</strong>
              </span>
            </div>
          </div>

          <ValidationCard resultado={validacion} />
        </div>
      </main>
    </div>
  );
}
