// components/empleados/RegisterWorkChangeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Calendar, ChevronDown, TrendingUp } from "lucide-react";
import { obtenerAreas, Area } from "@/services/areasService";
import { obtenerPosiciones, Position } from "@/services/positionsService";

type TipoCambio = "traslado" | "ascenso" | "modificacion_contractual" | "cambio_salarial";
type TipoCambioSalarial = "aumento" | "disminucion";

const TIPOS_CAMBIO: { valor: TipoCambio; etiqueta: string }[] = [
  { valor: "traslado", etiqueta: "Transfer" },
  { valor: "ascenso", etiqueta: "Promotion" },
  { valor: "modificacion_contractual", etiqueta: "Contract Modification" },
  { valor: "cambio_salarial", etiqueta: "Salary Modification" },
];

export interface FormData {
  tipo: TipoCambio | "";
  fechaEfectiva: string;
  areaDestino: string;
  nuevaPosicion: string;
  justificacion: string;
  tipoCambioSalarial: TipoCambioSalarial;
  porcentajeAjuste: string;
}

interface Props {
  isOpen: boolean;
  onCerrar: () => void;
  onGuardar: (datos: FormData) => Promise<void>;
  salarioActual?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RegisterWorkChangeModal({
  isOpen,
  onCerrar,
  onGuardar,
  salarioActual = 4_320_000,
}: Props) {
  const [form, setForm] = useState<FormData>({
    tipo: "",
    fechaEfectiva: "",
    areaDestino: "",
    nuevaPosicion: "",
    justificacion: "",
    tipoCambioSalarial: "aumento",
    porcentajeAjuste: "",
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [posiciones, setPosiciones] = useState<Position[]>([]);
  const [posicionesFiltradas, setPosicionesFiltradas] = useState<Position[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    obtenerAreas().then(setAreas);
    obtenerPosiciones({ pageSize: 100 }).then((res) => setPosiciones(res.data));
  }, [isOpen]);

  useEffect(() => {
    if (!form.areaDestino) {
      setPosicionesFiltradas([]);
      return;
    }
    const filtradas = posiciones.filter(
      (p) => p.areaId === `area-${form.areaDestino}`
    );
    setPosicionesFiltradas(filtradas);
    setForm((prev) => ({ ...prev, nuevaPosicion: "" }));
  }, [form.areaDestino, posiciones]);

  if (!isOpen) return null;

  const esCambioSalarial = form.tipo === "cambio_salarial";
  const esTraslado = form.tipo === "traslado";

  const porcentajeNum = parseFloat(form.porcentajeAjuste) || 0;
  const salarioEstimado =
    form.tipoCambioSalarial === "aumento"
      ? salarioActual * (1 + porcentajeNum / 100)
      : salarioActual * (1 - porcentajeNum / 100);

  const puedeGuardar =
    form.tipo !== "" &&
    form.fechaEfectiva !== "" &&
    form.justificacion.trim() !== "" &&
    (!esTraslado || (form.areaDestino !== "" && form.nuevaPosicion !== "")) &&
    (!esCambioSalarial || (form.porcentajeAjuste !== "" && porcentajeNum > 0));

  const handleGuardar = async () => {
    if (!puedeGuardar) return;
    setCargando(true);
    try {
      await onGuardar(form);
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    if (cargando) return;
    setForm({
      tipo: "",
      fechaEfectiva: "",
      areaDestino: "",
      nuevaPosicion: "",
      justificacion: "",
      tipoCambioSalarial: "aumento",
      porcentajeAjuste: "",
    });
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f4f5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#203D47] to-[#4f98b0] flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-[#0F1819]">Register Work Change</h2>
          </div>
          <button
            onClick={handleCerrar}
            disabled={cargando}
            className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto">

          {/* Change Type */}
          <div>
            <label className="block text-xs font-semibold text-[#0F1819] mb-1">
              Change Type
            </label>
            <div className="relative">
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tipo: e.target.value as TipoCambio | "",
                    areaDestino: "",
                    nuevaPosicion: "",
                    porcentajeAjuste: "",
                    tipoCambioSalarial: "aumento",
                  }))
                }
                className="w-full appearance-none px-3 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] cursor-pointer"
              >
                <option value="" disabled>Select change type</option>
                {TIPOS_CAMBIO.map((t) => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
            </div>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-xs font-semibold text-[#0F1819] mb-1">
              Effective Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={form.fechaEfectiva}
                onChange={(e) => setForm((prev) => ({ ...prev, fechaEfectiva: e.target.value }))}
                className="w-full pl-3 pr-9 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0]"
              />
              <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
            </div>
          </div>

          {/* Salary Change fields */}
          {esCambioSalarial && (
            <>
              {/* Increase / Decrease toggle */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, tipoCambioSalarial: "aumento" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    form.tipoCambioSalarial === "aumento"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white border-[#d1dde2] text-[#8aa3ad] hover:border-[#4f98b0]"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    form.tipoCambioSalarial === "aumento" ? "border-white" : "border-[#8aa3ad]"
                  }`}>
                    {form.tipoCambioSalarial === "aumento" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  Increase
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, tipoCambioSalarial: "disminucion" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    form.tipoCambioSalarial === "disminucion"
                      ? "bg-rose-500 border-rose-500 text-white"
                      : "bg-white border-[#d1dde2] text-[#8aa3ad] hover:border-rose-400"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    form.tipoCambioSalarial === "disminucion" ? "border-white" : "border-[#8aa3ad]"
                  }`}>
                    {form.tipoCambioSalarial === "disminucion" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  Decrease
                </button>
              </div>

              {/* Adjustment Percentage */}
              <div>
                <label className="block text-xs font-semibold text-[#0F1819] mb-1">
                  Adjustment Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.porcentajeAjuste}
                    onChange={(e) => setForm((prev) => ({ ...prev, porcentajeAjuste: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-3 pr-8 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] placeholder:text-[#c5d5db]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8aa3ad] pointer-events-none">%</span>
                </div>
              </div>

              {/* New Estimated Salary */}
              <div className="flex items-center gap-3 bg-[#f0f7fa] border border-[#bdd5ea] rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[#203D47] flex items-center justify-center shrink-0">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4f98b0]">
                    New Estimated Salary
                  </p>
                  <p className="text-lg font-bold text-[#0F1819] leading-tight">
                    {formatCurrency(salarioEstimado)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Area + Position — only for transfers */}
          {esTraslado && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#0F1819] mb-1">
                  Destination Area
                </label>
                <div className="relative">
                  <select
                    value={form.areaDestino}
                    onChange={(e) => setForm((prev) => ({ ...prev, areaDestino: e.target.value }))}
                    className="w-full appearance-none px-3 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] cursor-pointer"
                  >
                    <option value="" disabled>Select destination area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1819] mb-1">
                  New Position
                </label>
                <div className="relative">
                  <select
                    value={form.nuevaPosicion}
                    onChange={(e) => setForm((prev) => ({ ...prev, nuevaPosicion: e.target.value }))}
                    disabled={!form.areaDestino}
                    className="w-full appearance-none px-3 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Select new position</option>
                    {posicionesFiltradas.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
                </div>
                <p className="mt-1.5 text-xs text-[#8aa3ad]">
                  Only positions from the selected area are shown
                </p>
              </div>
            </>
          )}

          {/* Reason / Justification */}
          <div>
            <label className="block text-xs font-semibold text-[#0F1819] mb-1">
              Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={form.justificacion}
              onChange={(e) => setForm((prev) => ({ ...prev, justificacion: e.target.value }))}
              placeholder="Explain why this transfer is occurring..."
              rows={2}
              className="w-full px-3 py-2 text-sm text-[#0F1819] border border-[#d1dde2] rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-[#4f98b0] placeholder:text-[#c5d5db]"
            />
          </div>
        </div>

        {/* Warning */}
        <div className="mx-5 mb-3 flex items-start gap-2 bg-[#f4f7f8] border border-[#d1dde2] rounded-xl px-3 py-2.5 shrink-0">
          <p className="text-xs text-[#8aa3ad]">
            This event will be permanently recorded in the employee&apos;s labor history and cannot be deleted.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 pb-4 shrink-0">
          <button
            onClick={handleCerrar}
            disabled={cargando}
            className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGuardar}
            disabled={!puedeGuardar || cargando}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? "Saving..." : "Save Change"}
          </button>
        </div>

      </div>
    </div>
  );
}
