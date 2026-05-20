"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Lock, DollarSign, CheckCircle2, Info } from "lucide-react";

import { Empleado, obtenerEmpleadoPorId } from "@/services/empleadosService";
import {
  Contrato,
  ResultadoValidacion,
  actualizarContrato,
  obtenerContratoPorId,
  validarContrato,
} from "@/services/contratosService";

const VALIDACION_INICIAL: ResultadoValidacion = {
  rangoFechasValido: true,
  sinSolapamiento: true,
  presupuestoAprobado: true,
};

function etiquetaTipo(tipo: Contrato["tipo"]): string {
  switch (tipo) {
    case "INDEFINIDO":    return "Tiempo Completo Permanente";
    case "FIJO":          return "Término Fijo";
    case "SERVICIO":      return "Contrato de Servicios";
    case "TIEMPO_PARCIAL":return "Tiempo Parcial";
  }
}

function formatIsoToDisplay(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { month: "long", day: "2-digit", year: "numeric" });
}

// ── Locked input (read-only, with padlock icon) ───────────────────────────────
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

// ── Validation status card ────────────────────────────────────────────────────
function ValidationCard({ resultado }: { resultado: ResultadoValidacion }) {
  const items = [
    { label: "Integridad del Contrato", ok: resultado.rangoFechasValido && resultado.sinSolapamiento },
    { label: "Cumplimiento Salarial",   ok: resultado.presupuestoAprobado },
    { label: "Verificación de Solapamiento", ok: resultado.sinSolapamiento },
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
                item.ok
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-500"
              }`}
            >
              {item.ok ? "Válido" : "Inválido"}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#8aa3ad] leading-relaxed border-t border-[#f0f4f5] pt-3">
        {allValid
          ? "Todas las condiciones del contrato cumplen los estándares de la organización. La validación del sistema está completa y lista para enviar."
          : "Algunas condiciones no se cumplen. Por favor revisa los campos resaltados antes de guardar."}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PaginaEditarContrato() {
  const params = useParams<{ id: string; contratoId: string }>();
  const router = useRouter();
  const { id: empleadoId, contratoId } = params;

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [fechaFin, setFechaFin] = useState("");
  const [salario, setSalario] = useState<number | "">("");
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
        setFechaFin(con.fechaFin ?? "");
        setSalario(con.salarioBase);
        setNotas(con.notas);
      })
      .catch(() => setError("Error cargando los datos."))
      .finally(() => setCargando(false));
  }, [empleadoId, contratoId]);

  useEffect(() => {
    if (!contrato) return;
    const salarioNum = typeof salario === "number" ? salario : 0;
    validarContrato(empleadoId, contrato.fechaInicio, fechaFin || null, salarioNum, contratoId).then(setValidacion);
  }, [empleadoId, contrato, fechaFin, salario]);

  const formularioValido = useMemo(
    () =>
      typeof salario === "number" &&
      salario > 0 &&
      validacion.rangoFechasValido &&
      validacion.sinSolapamiento &&
      validacion.presupuestoAprobado,
    [salario, validacion],
  );

  const handleGuardar = async () => {
    if (!formularioValido || guardando) return;
    setGuardando(true);
    try {
      await actualizarContrato(contratoId, {
        fechaFin: fechaFin || null,
        salarioBase: typeof salario === "number" ? salario : 0,
        notas,
      });
      router.push(`/dashboard/empleados/${empleadoId}/contratos?actualizado=1`);
    } catch {
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
      {/* Breadcrumb */}
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
        {/* Title row */}
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

        {/* Info banner */}
        {contrato.estado === "ACTIVO" && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5">
            <Info size={16} className="mt-0.5 shrink-0 text-sky-500" />
            <div>
              <p className="text-sm font-semibold text-sky-700">Contrato Activo</p>
              <p className="text-xs text-sky-600">
                Estás editando un contrato activo. Los cambios quedarán registrados para auditoría.
              </p>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

          {/* ── Contract Details card ── */}
          <div className="rounded-2xl border border-[#e8eef0] bg-white p-6">
            <h2 className="mb-5 text-sm font-bold text-[#0F1819]">Detalles del Contrato</h2>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              {/* Contract Type — locked */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Tipo de Contrato</label>
                <LockedInput value={etiquetaTipo(contrato.tipo)} />
              </div>

              {/* Start Date — locked */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Fecha de Inicio</label>
                <LockedInput value={formatIsoToDisplay(contrato.fechaInicio)} />
              </div>

              {/* End Date — editable */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Fecha de Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full rounded-lg border border-[#d1dde2] bg-white px-3.5 py-2.5 text-sm text-[#0F1819] outline-none transition focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20"
                />
              </div>

              {/* Salary — editable */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Salario Base (Anual)</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8aa3ad]" />
                  <input
                    type="number"
                    min={0}
                    value={salario}
                    onChange={(e) => setSalario(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-[#d1dde2] bg-white py-2.5 pl-9 pr-3.5 text-sm text-[#0F1819] outline-none transition focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20"
                  />
                </div>
              </div>
            </div>

            {/* Notes — full width */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#576975]">Notas del Contrato</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
                placeholder="Añade cualquier nota o condición adicional..."
                className="w-full resize-none rounded-lg border border-[#d1dde2] bg-white px-3.5 py-2.5 text-sm text-[#0F1819] outline-none transition focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20 placeholder:text-[#c5d5db]"
              />
            </div>
          </div>

          {/* ── Validation Status card ── */}
          <ValidationCard resultado={validacion} />
        </div>
      </main>
    </div>
  );
}
