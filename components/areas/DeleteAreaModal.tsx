"use client";

import React, { useState } from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Area, eliminarArea } from "@/services/areasService";

interface DeleteAreaModalProps {
  area: Area;
  onCerrar: () => void;
  onEliminada: () => void;
}

export default function DeleteAreaModal({ area, onCerrar, onEliminada }: DeleteAreaModalProps) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tieneposiciones = area.posiciones > 0;

  const manejarEliminar = async () => {
    if (tieneposiciones) return;
    setEliminando(true);
    setError(null);
    try {
      await eliminarArea(area.id);
      onEliminada();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el área.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        {/* Icono y titulo */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0F1819]">Eliminar esta area?</h2>
            <p className="text-sm text-[#8aa3ad] mt-1 leading-relaxed">
              Esta seguro que quiere eliminar el{" "}
              <span className="font-semibold text-[#0F1819]">{area.nombre}</span>?
              Esta accion no se puede deshacer.
            </p>
          </div>
        </div>

        {tieneposiciones && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-600">
                Esta área tiene {area.posiciones} posición(es) activa(s).
              </p>
              <p className="text-xs text-rose-400 mt-0.5">
                Mueve o elimina las posiciones de esta área antes de eliminarla. El backend rechazará la operación mientras existan posiciones activas.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={manejarEliminar}
            disabled={eliminando || tieneposiciones}
            title={tieneposiciones ? "No puedes eliminar un área con posiciones activas." : undefined}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {eliminando ? "Eliminando..." : "Eliminar Área"}
          </button>
        </div>
      </div>
    </div>
  );
}