// components/empleados/RegisterWorkChangeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Calendar, ChevronDown, TrendingUp } from "lucide-react";
import { obtenerAreas, Area } from "@/services/areasService";
import { obtenerPosiciones, Position } from "@/services/positionsService";

// "Contract Modification" se quitó: el backend no permite tocar contratos desde
// este flujo. La modificación contractual real se hace en el módulo de Contratos.
type TipoCambio = "traslado" | "ascenso" | "cambio_salarial";

const TIPOS_CAMBIO: { valor: TipoCambio; etiqueta: string }[] = [
  { valor: "traslado", etiqueta: "Transfer" },
  { valor: "ascenso", etiqueta: "Promotion" },
  { valor: "cambio_salarial", etiqueta: "Salary Increase" },
];

// Política: solo se permiten aumentos salariales desde acá; los recortes
// requieren un proceso distinto (legal/contractual) y se manejan editando el
// contrato vigente. Por eso ya no existe `tipoCambioSalarial`.
export interface FormData {
  tipo: TipoCambio | "";
  fechaEfectiva: string;
  areaDestino: string;
  nuevaPosicion: string;
  justificacion: string;
  porcentajeAjuste: string;
}

interface Props {
  isOpen: boolean;
  onCerrar: () => void;
  onGuardar: (datos: FormData) => Promise<void>;
  /** Salario base del CARGO actual del empleado (positions.base_salary). El
   *  backend no guarda salario por empleado; este es el único dato salarial
   *  estructurado disponible. `null` si el cargo no lo tiene definido. */
  salarioBaseCargo?: number | null;
  /** Cargo actual del empleado (para mostrar en la UI de Promotion). */
  cargoActualNombre?: string;
  /** Cargo padre en la jerarquía. null si el cargo actual es raíz (no se puede
   *  promover). Cuando es Promotion, el handler envía este id al backend. */
  cargoSuperiorId?: number | null;
  cargoSuperiorNombre?: string | null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RegisterWorkChangeModal({
  isOpen,
  onCerrar,
  onGuardar,
  salarioBaseCargo,
  cargoActualNombre,
  cargoSuperiorId,
  cargoSuperiorNombre,
}: Props) {
  const [form, setForm] = useState<FormData>({
    tipo: "",
    fechaEfectiva: "",
    areaDestino: "",
    nuevaPosicion: "",
    justificacion: "",
    porcentajeAjuste: "",
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [posiciones, setPosiciones] = useState<Position[]>([]);
  const [posicionesFiltradas, setPosicionesFiltradas] = useState<Position[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    obtenerAreas().then(setAreas);
    // Solo posiciones activas son destino válido para traslados / cambios.
    obtenerPosiciones({ pageSize: 100, status: "Active" }).then((res) => setPosiciones(res.data));
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
  const esAscenso = form.tipo === "ascenso";

  const porcentajeNum = parseFloat(form.porcentajeAjuste) || 0;
  // Solo aumentos. Si el cargo no tiene base_salary definido, no podemos
  // calcular el estimado: se muestra como N/A y se bloquea el guardado.
  const tieneSalarioBase = typeof salarioBaseCargo === "number" && salarioBaseCargo > 0;
  const salarioEstimado = tieneSalarioBase
    ? (salarioBaseCargo as number) * (1 + porcentajeNum / 100)
    : 0;

  // Promotion solo es válida si el cargo actual tiene un cargo padre definido
  // en `positions.parent_position_id`. La UI lo bloquea cuando no.
  const tieneCargoSuperior = typeof cargoSuperiorId === "number";

  const puedeGuardar =
    form.tipo !== "" &&
    form.fechaEfectiva !== "" &&
    form.justificacion.trim() !== "" &&
    (!esTraslado || (form.areaDestino !== "" && form.nuevaPosicion !== "")) &&
    (!esAscenso || tieneCargoSuperior) &&
    (!esCambioSalarial || (form.porcentajeAjuste !== "" && porcentajeNum > 0 && tieneSalarioBase));

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

          {/* Promotion — siempre al cargo padre en la jerarquía. El admin no
              elige cargo destino; se infiere de positions.parent_position_id. */}
          {esAscenso && (
            <div className={`rounded-xl border px-4 py-3 ${
              tieneCargoSuperior
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4f98b0]">
                Cambio de cargo (ascenso)
              </p>
              {tieneCargoSuperior ? (
                <>
                  <p className="text-sm text-[#0F1819] mt-1 leading-snug">
                    Promover de{" "}
                    <strong>{cargoActualNombre ?? "cargo actual"}</strong> a{" "}
                    <strong>{cargoSuperiorNombre}</strong>.
                  </p>
                  <p className="text-[11px] text-[#576975] leading-relaxed mt-1.5">
                    Al guardar se actualizará el cargo del empleado al cargo superior en la jerarquía organizacional.
                  </p>
                </>
              ) : (
                <p className="text-sm text-amber-800 mt-1 leading-snug">
                  El cargo actual {cargoActualNombre ? <strong>({cargoActualNombre})</strong> : ""} no tiene un cargo superior definido en la jerarquía. No se puede promover desde acá.
                </p>
              )}
            </div>
          )}

          {/* Salary Change fields — solo aumentos */}
          {esCambioSalarial && (
            <>
              {/* Salario base actual del cargo */}
              <div className="rounded-xl bg-[#f4f7f8] border border-[#d1dde2] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4f98b0]">
                  Salario base del cargo
                </p>
                <p className="text-base font-bold text-[#0F1819] leading-tight mt-0.5">
                  {tieneSalarioBase ? formatCurrency(salarioBaseCargo as number) : "No definido"}
                </p>
                <p className="text-[11px] text-[#8aa3ad] leading-relaxed mt-1.5">
                  Es el salario de referencia del cargo del empleado. El aumento se registra
                  en su trayectoria y no modifica el salario base del cargo (no afecta a otros
                  empleados con el mismo cargo).
                </p>
              </div>

              {/* Adjustment Percentage — solo aumento */}
              <div>
                <label className="block text-xs font-semibold text-[#0F1819] mb-1">
                  Porcentaje de aumento
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
                    disabled={!tieneSalarioBase}
                    className="w-full pl-3 pr-8 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] placeholder:text-[#c5d5db] disabled:cursor-not-allowed disabled:bg-[#f8fafb]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#8aa3ad] pointer-events-none">%</span>
                </div>
                {!tieneSalarioBase && (
                  <p className="mt-1 text-[11px] text-amber-600">
                    El cargo no tiene un salario base definido. Edita el cargo desde el módulo
                    de Posiciones para poder registrar aumentos individuales.
                  </p>
                )}
              </div>

              {/* New Estimated Salary */}
              {tieneSalarioBase && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                      Salario nuevo estimado
                    </p>
                    <p className="text-lg font-bold text-[#0F1819] leading-tight">
                      {formatCurrency(salarioEstimado)}
                    </p>
                  </div>
                </div>
              )}
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
