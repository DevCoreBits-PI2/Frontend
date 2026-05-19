"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  FileText,
  Info,
  Lock,
  RefreshCw,
  X,
} from "lucide-react";
import {
  Contrato,
  RenovarContratoDTO,
  TipoContrato,
  renovarContrato,
} from "@/services/contratosService";

interface Props {
  isOpen: boolean;
  contrato: Contrato;
  empleadoNombre: string;
  empleadoCodigo: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TIPOS_CONTRATO: { id: TipoContrato; nombre: string }[] = [
  { id: "FIJO", nombre: "Término Fijo" },
  { id: "INDEFINIDO", nombre: "Término Indefinido" },
  { id: "SERVICIO", nombre: "Prestación de Servicios" },
  { id: "TIEMPO_PARCIAL", nombre: "Tiempo Parcial" },
];

function etiquetaTipo(tipo: TipoContrato): string {
  return TIPOS_CONTRATO.find((t) => t.id === tipo)?.nombre ?? tipo;
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

  const startDateInicial = useMemo(() => siguienteDia(contrato.fechaFin), [contrato.fechaFin]);

  const [tipo, setTipo] = useState<TipoContrato>(contrato.tipo);
  const [fechaInicio] = useState<string>(startDateInicial);
  const [fechaFin, setFechaFin] = useState<string>("");
  const [salario, setSalario] = useState<string>(String(contrato.salarioBase || ""));
  const [notas, setNotas] = useState<string>("");
  const [documentoNombre, setDocumentoNombre] = useState<string | undefined>(undefined);

  useEffect(() => setMounted(true), []);

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
  const salarioNumero = Number(salario) || 0;
  const formularioValido =
    !!tipo &&
    !!fechaFin &&
    new Date(fechaFin) > new Date(fechaInicio) &&
    salarioNumero > 0 &&
    !!documentoNombre;

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDocumentoNombre(file.name);
  };

  const irAConfirmar = () => {
    if (!formularioValido) return;
    setStep("confirm");
  };

  const confirmarRenovacion = async () => {
    setEnviando(true);
    try {
      const datos: RenovarContratoDTO = {
        contratoActualId: contrato.id,
        tipo,
        fechaInicio,
        fechaFin: fechaFin || null,
        salarioBase: salarioNumero,
        notas: notas.trim(),
        documentoNombre,
      };
      await renovarContrato(datos);
      onSuccess();
    } finally {
      setEnviando(false);
    }
  };

  const fmtMoneda = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      {step === "form" ? (
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Términos actuales */}
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
                  <p className="text-sm font-semibold text-[#0F1819]">{etiquetaTipo(contrato.tipo)}</p>
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

            {/* Nuevo contrato */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">
                Detalles del Nuevo Contrato
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1819] mb-1.5">
                    Tipo de Contrato
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoContrato)}
                    className="w-full px-3 py-2.5 border border-[#d1dde2] rounded-lg text-sm text-[#0F1819] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {TIPOS_CONTRATO.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1819] mb-1.5">
                    Fecha de Inicio
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={fechaInicio}
                      disabled
                      className="w-full px-3 py-2.5 border border-[#d1dde2] rounded-lg text-sm text-[#576975] bg-[#f4f7f8] cursor-not-allowed pr-9"
                    />
                    <Lock
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1819] mb-1.5">
                    Fecha de Fin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    min={fechaInicio}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#d1dde2] rounded-lg text-sm text-[#0F1819] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1819] mb-1.5">
                    Duración
                  </label>
                  <input
                    type="text"
                    value={duracion}
                    readOnly
                    className="w-full px-3 py-2.5 border border-[#d1dde2] rounded-lg text-sm text-[#8aa3ad] bg-[#f4f7f8] cursor-default"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#0F1819] mb-1.5">
                  Salario Base (Anual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8aa3ad]">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 border border-[#d1dde2] rounded-lg text-sm text-[#0F1819] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#0F1819] mb-1.5">
                  Contrato Firmado <span className="text-rose-500">*</span>
                </label>
                <label className="block border-2 border-dashed border-[#d1dde2] hover:border-emerald-400 rounded-xl py-6 text-center cursor-pointer transition-colors">
                  <CloudUpload size={22} className="mx-auto text-[#8aa3ad] mb-1.5" />
                  <p className="text-xs font-semibold text-[#0F1819]">
                    {documentoNombre ?? "Haz clic para subir o arrastra y suelta"}
                  </p>
                  <p className="text-[10px] text-[#8aa3ad] mt-0.5">PDF, DOCX hasta 10MB</p>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleArchivo}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1819] mb-1.5">
                  Notas de Renovación
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Agrega cualquier nota específica sobre esta renovación..."
                  className="w-full px-3 py-2.5 border border-[#d1dde2] rounded-lg text-sm text-[#0F1819] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>
            </div>

            {/* Impacto del sistema */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2.5">
                <Info size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-700">Impacto en el Sistema</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    El contrato actual ({empleadoCodigo}) será marcado como Renovado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#f0f4f5] bg-[#fafbfc]">
            <p className="text-[11px] text-[#8aa3ad]">Esta acción no se puede deshacer.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-[#576975] hover:text-[#0F1819] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={irAConfirmar}
                disabled={!formularioValido}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#d1dde2] disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ── Modal de confirmación ────────────────────────────────────
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f0f4f5]">
            <h2 className="text-base font-bold text-[#0F1819]">Confirmar Detalles de Renovación</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              {/* Contrato actual */}
              <div className="relative bg-[#fafbfc] border border-[#e8eef0] rounded-xl p-4 overflow-hidden">
                <span
                  className="absolute inset-0 flex items-center justify-center text-3xl font-black text-[#0F1819]/5 pointer-events-none select-none"
                  style={{ transform: "rotate(-18deg)", letterSpacing: "0.15em" }}
                >
                  RENOVADO
                </span>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">
                      Estado Actual
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md">
                      Renovado
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0F1819] mb-3">Contrato Actual</h3>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad]">Tipo</p>
                      <p className="text-xs font-semibold text-[#0F1819]">
                        {etiquetaTipo(contrato.tipo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad]">Duración</p>
                      <p className="text-xs font-semibold text-[#0F1819]">
                        {formatFecha(contrato.fechaInicio)} - {formatFecha(contrato.fechaFin)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad]">Salario Anual</p>
                      <p className="text-xs font-semibold text-[#0F1819]">
                        {fmtMoneda(contrato.salarioBase)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <ArrowRight size={16} className="text-emerald-500" />
              </div>

              {/* Contrato nuevo */}
              <div className="bg-emerald-50/40 border-2 border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    Próximo Estado
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-md">
                    Activo
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F1819] mb-3">Nuevo Contrato</h3>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad]">Tipo</p>
                    <p className="text-xs font-semibold text-[#0F1819]">{etiquetaTipo(tipo)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad]">Nueva Duración</p>
                    <p className="text-xs font-semibold text-[#0F1819]">
                      {formatFecha(fechaInicio)} - {formatFecha(fechaFin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#8aa3ad]">Salario Actualizado</p>
                    <p className="text-xs font-bold text-emerald-600">{fmtMoneda(salarioNumero)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documento */}
            <div className="flex items-center justify-between bg-white border border-[#e8eef0] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <FileText size={16} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F1819]">
                    {documentoNombre ?? "documento.pdf"}
                  </p>
                  <p className="text-[11px] text-[#8aa3ad]">Documento generado y listo para archivar</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 size={14} />
                <span className="text-xs font-semibold">Verificado</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f0f4f5] bg-[#fafbfc]">
            <button
              onClick={() => setStep("form")}
              disabled={enviando}
              className="px-4 py-2 text-sm font-semibold text-[#576975] hover:text-[#0F1819] transition-colors disabled:opacity-50"
            >
              Volver
            </button>
            <button
              onClick={confirmarRenovacion}
              disabled={enviando}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#a7c5b6] disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {enviando ? "Procesando..." : "Confirmar y Crear"}
              {!enviando && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
