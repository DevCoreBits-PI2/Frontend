// components/empleados/RegisterWorkChangeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Calendar, ChevronDown } from "lucide-react";
import { obtenerAreas, Area } from "@/services/areasService";
import { obtenerPosiciones, Position } from "@/services/positionsService";

type TipoCambio = "traslado" | "ascenso" | "modificacion_contractual" | "cambio_salarial";

const TIPOS_CAMBIO: { valor: TipoCambio; etiqueta: string }[] = [
  { valor: "traslado", etiqueta: "Transfer" },
  { valor: "ascenso", etiqueta: "Promotion" },
  { valor: "modificacion_contractual", etiqueta: "Contract Modification" },
  { valor: "cambio_salarial", etiqueta: "Salary Change" },
];

interface FormData {
  tipo: TipoCambio | "";
  fechaEfectiva: string;
  areaDestino: string;
  nuevaPosicion: string;
  justificacion: string;
}

interface Props {
  isOpen: boolean;
  onCerrar: () => void;
  onGuardar: (datos: FormData) => Promise<void>;
}

export default function RegisterWorkChangeModal({ isOpen, onCerrar, onGuardar }: Props) {
  const [form, setForm] = useState<FormData>({
    tipo: "",
    fechaEfectiva: "",
    areaDestino: "",
    nuevaPosicion: "",
    justificacion: "",
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

  const esTraslado = form.tipo === "traslado";
  const puedeGuardar =
    form.tipo !== "" &&
    form.fechaEfectiva !== "" &&
    form.justificacion.trim() !== "" &&
    (!esTraslado || (form.areaDestino !== "" && form.nuevaPosicion !== ""));

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
    setForm({ tipo: "", fechaEfectiva: "", areaDestino: "", nuevaPosicion: "", justificacion: "" });
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
            <h2 className="text-base font-semibold text-[#0F1819]">Registrar Cambio Laboral</h2>
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
              Tipo de Cambio
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
                  }))
                }
                className="w-full appearance-none px-3 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] cursor-pointer"
              >
                <option value="" disabled>Seleccionar tipo de cambio</option>
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
              Fecha Efectiva
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa3ad]" />
              <input
                type="date"
                value={form.fechaEfectiva}
                onChange={(e) => setForm((prev) => ({ ...prev, fechaEfectiva: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0]"
              />
            </div>
          </div>

          {/* Destination Area */}
          <div>
            <label className="block text-xs font-semibold text-[#0F1819] mb-1">
              Área de Destino
            </label>
            <div className="relative">
              <select
                value={form.areaDestino}
                onChange={(e) => setForm((prev) => ({ ...prev, areaDestino: e.target.value }))}
                className="w-full appearance-none px-3 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] cursor-pointer"
              >
                <option value="" disabled>Seleccionar área de destino</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
            </div>
          </div>

          {/* New Position */}
          <div>
            <label className="block text-xs font-semibold text-[#0F1819] mb-1">
              Nueva Posición
            </label>
            <div className="relative">
              <select
                value={form.nuevaPosicion}
                onChange={(e) => setForm((prev) => ({ ...prev, nuevaPosicion: e.target.value }))}
                disabled={!form.areaDestino}
                className="w-full appearance-none px-3 py-2 text-sm border border-[#d1dde2] rounded-xl text-[#0F1819] bg-white focus:outline-none focus:ring-1 focus:ring-[#4f98b0] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Seleccionar nueva posición</option>
                {posicionesFiltradas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] pointer-events-none" />
            </div>
            <p className="mt-1.5 text-xs text-[#8aa3ad]">
              Solo se muestran posiciones del área seleccionada
            </p>
          </div>

          {/* Reason / Justification */}
          <div>
            <label className="block text-xs font-semibold text-[#0F1819] mb-1">
              Razón / Justificación <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={form.justificacion}
              onChange={(e) => setForm((prev) => ({ ...prev, justificacion: e.target.value }))}
              placeholder="Explica por qué se está realizando este cambio..."
              rows={2}
              className="w-full px-3 py-2 text-sm text-[#0F1819] border border-[#d1dde2] rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-[#4f98b0] placeholder:text-[#c5d5db]"
            />
          </div>
        </div>

        {/* Warning */}
        <div className="mx-5 mb-3 flex items-start gap-2 bg-[#f4f7f8] border border-[#d1dde2] rounded-xl px-3 py-2.5 shrink-0">
          <p className="text-xs text-[#8aa3ad]">
            Este evento se registrará permanentemente en el historial laboral del empleado y no se puede eliminar.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 pb-4 shrink-0">
          <button
            onClick={handleCerrar}
            disabled={cargando}
            className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!puedeGuardar || cargando}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? "Guardando..." : "Guardar Cambio"}
          </button>
        </div>

      </div>
    </div>
  );
}
