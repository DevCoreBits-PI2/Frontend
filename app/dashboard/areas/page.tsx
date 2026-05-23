"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Area, obtenerAreas } from "@/services/areasService";
import AreasTable from "@/components/areas/AreasTable";
import NewAreaModal from "@/components/areas/NewAreaModal";
import EditAreaModal from "@/components/areas/EditAreaModal";
import DeleteAreaModal from "@/components/areas/DeleteAreaModal";
import ToastNotification from "@/components/ToastNotification";
import ViewAreaModal from "@/components/areas/ViewAreaModal";
import { ChevronRight, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { canManageHumanTalent } from "@/lib/auth/roles";

interface ToastInfo {
  title: string;
  message: string;
}

export default function PaginaAreas() {
  const { authUser } = useAuth();
  const puedeGestionar = authUser ? canManageHumanTalent(authUser) : false;
  const [areas, setAreas] = useState<Area[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Modales
  const [areaAVer, setAreaAVer] = useState<Area | null>(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [areaAEditar, setAreaAEditar] = useState<Area | null>(null);
  const [areaAEliminar, setAreaAEliminar] = useState<Area | null>(null);

  const mostrarToast = (title: string, message: string) => {
    setToast({ title, message });
  };

  const cargarAreas = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await obtenerAreas();
      setAreas(datos);
    } catch {
      setError("No se pudieron cargar las areas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarAreas(); }, [cargarAreas]);

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f7f8]">
      {/* Barra superior con breadcrumb */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#d1dde2] shrink-0">
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Dashboard</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Estructura Organizacional</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="text-[#0F1819] font-semibold">Areas</span>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 px-6 py-6 overflow-auto">
        {/* Titulo y boton */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0F1819]">Gestion de Areas</h1>
            <p className="text-sm text-[#8aa3ad] mt-0.5">
              Define y administra los departamentos y unidades de negocio de la organizacion.
            </p>
          </div>
          {puedeGestionar && (
            <button
              onClick={() => setMostrarCrear(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              <Plus size={15} />
              Nueva Área
            </button>
          )}
        </div>

        {cargando && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#203D47] border-t-emerald-400 animate-spin" />
              <span className="text-xs text-[#8aa3ad]">Cargando areas...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-xl px-6 py-4 border border-rose-200 text-sm text-rose-500">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <AreasTable
            areas={areas}
            onVer={(area) => setAreaAVer(area)}
            onEditar={(area) => setAreaAEditar(area)}
            onEliminar={(id) => {
              const area = areas.find((a) => a.id === id);
              if (area) setAreaAEliminar(area);
            }}
          />
        )}
      </main>

      {/* Modal — Ver detalles */}
      {areaAVer && (
        <ViewAreaModal
          area={areaAVer}
          onCerrar={() => setAreaAVer(null)}
        />
      )}

      {/* Modal — Crear area */}
      {mostrarCrear && (
        <NewAreaModal
          onCerrar={() => setMostrarCrear(false)}
          onCreada={async () => {
            setMostrarCrear(false);
            await cargarAreas();
            mostrarToast("Área creada con éxito", "La nueva área fue registrada correctamente.");
          }}
        />
      )}

      {/* Modal — Editar area */}
      {areaAEditar && (
        <EditAreaModal
          area={areaAEditar}
          todasLasAreas={areas}
          onCerrar={() => setAreaAEditar(null)}
          onEditada={async () => {
            setAreaAEditar(null);
            await cargarAreas();
            mostrarToast("Área editada con éxito", "Los cambios fueron guardados.");
          }}
        />
      )}

      {/* Modal — Eliminar area */}
      {areaAEliminar && (
        <DeleteAreaModal
          area={areaAEliminar}
          onCerrar={() => setAreaAEliminar(null)}
          onEliminada={async () => {
            setAreaAEliminar(null);
            await cargarAreas();
            mostrarToast("Área eliminada con éxito", "El área fue eliminada del sistema.");
          }}
        />
      )}

      {/* Toast de notificacion */}
      <ToastNotification
        isVisible={!!toast}
        onClose={() => setToast(null)}
        title={toast?.title}
        message={toast?.message}
      />
    </div>
  );
}