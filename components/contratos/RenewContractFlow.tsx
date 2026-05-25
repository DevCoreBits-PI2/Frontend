"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import {
  Contrato,
  TIPO_CONTRATO_LABEL,
  renovarContrato,
} from "@/services/contratosService";

// El endpoint del backend para renovar (PATCH /renew-contract/:id) solo acepta
// `newEndDate`. Mantiene tipo/notas/PDF del contrato anterior y crea uno nuevo
// con la nueva fecha de fin. Por eso este modal solo pide la nueva fecha.

interface Props {
  isOpen: boolean;
  contrato: Contrato;
  empleadoNombre: string;
  empleadoCodigo: string;
  onClose: () => void;
  onSuccess: () => void;
}

function formatFecha(fecha: string | null): string {
  if (!fecha) return "Sin vencimiento";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-CO", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function calcularDuracion(inicio: string, fin: string): string {
  if (!inicio || !fin) return "Selecciona la fecha de fin para calcular...";
  const i = new Date(inicio);
  const f = new Date(fin);
  if (Number.isNaN(i.getTime()) || Number.isNaN(f.getTime())) return "—";
  if (f <= i) return "La fecha de fin debe ser posterior al inicio";

  const ms = f.getTime() - i.getTime();
  const dias = Math.round(ms / (1000 * 60 * 60 * 24));
  const meses = Math.round(dias / 30);
  if (dias < 31) return `${dias} días`;
  if (meses < 12) return `${meses} meses`;
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  return mesesRestantes === 0
    ? `${anios} año${anios > 1 ? "s" : ""}`
    : `${anios} año${anios > 1 ? "s" : ""} ${mesesRestantes} meses`;
}

function siguienteDia(fecha: string | null): string {
  const base = fecha ? new Date(fecha) : new Date();
  if (Number.isNaN(base.getTime())) return new Date().toISOString().slice(0, 10);
  base.setDate(base.getDate() + 1);
  return base.toISOString().slice(0, 10);
}

export default function RenewContractFlow({
  isOpen,
  contrato,
  empleadoNombre,
  empleadoCodigo,
  onClose,
  onSuccess,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fechaInicio = useMemo(() => siguienteDia(contrato.fechaFin), [contrato.fechaFin]);
  const [fechaFin, setFechaFin] = useState<string>("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) return;
    setStep("form");
    setFechaFin("");
    setErrorMsg(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const duracion = calcularDuracion(fechaInicio, fechaFin);
  const formularioValido = !!fechaFin && new Date(fechaFin) > new Date(fechaInicio);

  const irAConfirmar = () => {
    if (!formularioValido) return;
    setStep("confirm");
  };

  const confirmarRenovacion = async () => {
    setEnviando(true);
    setErrorMsg(null);
    try {
      await renovarContrato({
        contratoActualId: contrato.id,
        nuevaFechaFin: fechaFin,
      });
      onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo renovar el contrato.");
      setStep("form");
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      {step === "form" ? (
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#f0f4f5]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <RefreshCw size={18} className="text-emerald-500" strokeWidth={2.3} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F1819]">Renovar Contrato</h2>
                <p className="text-xs text-[#8aa3ad] mt-0.5">
                  {empleadoNombre} — {empleadoCodigo}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="border border-[#e8eef0] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">
                  Términos Actuales
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">
                  Activo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad] mb-0.5">Tipo</p>
                  <p className="text-sm font-semibold text-[#0F1819]">{TIPO_CONTRATO_LABEL[contrato.tipo]}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad] mb-0.5">Inicio</p>
                  <p className="text-sm font-semibold text-[#0F1819]">{formatFecha(contrato.fechaInicio)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad] mb-0.5">Fin</p>
                  <p className="text-sm font-semibold text-[#0F1819]">{formatFecha(contrato.fechaFin)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <Info size={15} className="mt-0.5 shrink-0 text-sky-500" />
              <p className="text-xs text-sky-700 leading-relaxed">
                La renovación marca el contrato actual como "renovado" y crea uno nuevo conservando el tipo, las condiciones y el PDF del contrato anterior. Solo se requiere la nueva fecha de fin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Nueva Fecha de Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  readOnly
                  disabled
                  className="w-full rounded-lg border border-[#e8eef0] bg-[#f8fafb] px-3.5 py-2.5 text-sm text-[#8aa3ad] cursor-not-allowed"
                />
                <span className="text-[11px] text-[#8aa3ad]">
                  Día siguiente a la fecha de fin actual.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#576975]">Nueva Fecha de Fin *</label>
                <input
                  type="date"
                  value={fechaFin}
                  min={siguienteDia(fechaInicio)}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full rounded-lg border border-[#d1dde2] bg-white px-3.5 py-2.5 text-sm text-[#0F1819] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold mb-0.5">
                Duración calculada
              </p>
              <p className="text-sm text-[#0F1819]">{duracion}</p>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#f0f4f5] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#576975] hover:text-[#0F1819] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={irAConfirmar}
              disabled={!formularioValido}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-5 pb-4 border-b border-[#f0f4f5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-500" strokeWidth={2.3} />
              </div>
              <h2 className="text-base font-bold text-[#0F1819]">Confirmar Renovación</h2>
            </div>
          </div>
          <div className="px-6 py-5 space-y-3 text-sm text-[#203D47]">
            <p>
              Vas a renovar el contrato de <strong>{empleadoNombre}</strong> hasta el{" "}
              <strong>{formatFecha(fechaFin)}</strong>.
            </p>
            <p className="text-xs text-[#8aa3ad]">
              El contrato anterior se marcará como renovado y se creará uno nuevo con la nueva vigencia.
            </p>
          </div>
          <div className="px-6 py-4 border-t border-[#f0f4f5] flex items-center justify-end gap-3">
            <button
              onClick={() => setStep("form")}
              disabled={enviando}
              className="px-4 py-2 text-sm text-[#576975] hover:text-[#0F1819] transition-colors disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmarRenovacion}
              disabled={enviando}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? "Renovando..." : "Confirmar Renovación"}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
