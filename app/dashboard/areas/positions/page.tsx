"use client";
import DeletePositionModal from "@/components/areas/positions/DeletePositionModal";
import EditPositionModal from "@/components/areas/positions/EditPositionModal";
import ToastNotification from "@/components/ToastNotification";

import ViewPositionModal from "@/components/areas/positions/viewPositionModal";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  MoreVertical,
  X,
  Pencil,
  Trash2,
  Eye,
  Plus,
} from "lucide-react";
import {
  obtenerPosiciones,
  crearPosicion,
  editarPosicion,
  eliminarPosicion,
  type Position,
} from "@/services/positionsService";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

type ActiveTab = "All" | "Hierarchy" | "Archived";

interface ToastMessage {
  title: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = [
  "#8aa3ad",
  "#2ECC71",
  "#3498db",
  "#e74c3c",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#34495e",
  "#e67e22",
  "#2c3e50",
  "#16a085",
  "#c0392b",
];

// Color cycling function
const getColorForIndex = (index: number): string => {
  return COLORS[index % COLORS.length];
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: "Active" | "Drafting";
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Active") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
        Active
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
      Drafting
    </span>
  );
}

interface AvatarStackProps {
  empleados: Position["empleados"];
  maxDisplay?: number;
}

function AvatarStack({ empleados, maxDisplay = 3 }: AvatarStackProps) {
  const displayed = empleados.slice(0, maxDisplay);
  const remaining = Math.max(0, empleados.length - maxDisplay);

  if (empleados.length === 0) {
    return <span className="text-sm text-[#8aa3ad]">No asignados</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {displayed.map((emp, idx) => (
          <div
            key={emp.id}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white"
            style={{
              backgroundColor: getColorForIndex(idx),
              zIndex: displayed.length - idx,
            }}
            title={emp.nombre}
          >
            {emp.iniciales}
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="text-xs text-[#8aa3ad] ml-1">+{remaining}</span>
      )}
    </div>
  );
}

interface NewPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (position: Omit<Position, "id">) => Promise<void>;
  isLoading?: boolean;
}

function NewPositionModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: NewPositionModalProps) {
  const [nombre, setNombre] = useState("");
  const [posicionSuperior, setPosicionSuperior] = useState("");
  const [estado, setEstado] = useState<"Active" | "Drafting">("Active");
  const [areaId, setAreaId] = useState("area-1");

  const handleSave = async () => {
    if (!nombre.trim()) return;

    await onSave({
      nombre,
      posicionSuperior: posicionSuperior || null,
      estado,
      areaId,
      empleados: [],
    });

    setNombre("");
    setPosicionSuperior("");
    setEstado("Active");
    setAreaId("area-1");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-[#BDD5EA] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0F1819]">
            Nueva Posición
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#8aa3ad]" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0F1819] mb-2">
              Nombre de Posición *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Senior Developer"
              className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F1819] mb-2">
              Posición Superior
            </label>
            <input
              type="text"
              value={posicionSuperior}
              onChange={(e) => setPosicionSuperior(e.target.value)}
              placeholder="Ej: Engineering Manager"
              className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1819] mb-2">
                Área
              </label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
              >
                <option value="area-1">Tecnología</option>
                <option value="area-2">Seguridad</option>
                <option value="area-3">Producto</option>
                <option value="area-4">Diseño</option>
                <option value="area-5">Datos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F1819] mb-2">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as "Active" | "Drafting")}
                className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
              >
                <option value="Active">Active</option>
                <option value="Drafting">Drafting</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#BDD5EA] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-[#0F1819] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nombre.trim() || isLoading}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PositionsPage() {
  const [posicionAVer, setPosicionAVer] = useState<Position | null>(null); //Nuevos estados
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null); //Nuevos estados
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [posicionAEditar, setPosicionAEditar] = useState<Position | null>(null);
  const [posicionAEliminar, setPosicionAEliminar] = useState<Position | null>(null);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerPosiciones({
        tab: activeTab,
        searchText: search,
        page,
        pageSize: 4,
      });
      setPositions(response.data);
      setTotalPages(Math.ceil(response.total / 4));
    } catch (error) {
      console.error("Error fetching positions:", error);
      setToast({
        title: "Error",
        message: "No se pudieron cargar las posiciones",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  // Handle click outside menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-menu-trigger]")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewPosition = async (positionData: Omit<Position, "id">) => {
    try {
      setModalLoading(true);
      await crearPosicion(positionData);
      setShowNewModal(false);
      setToast({
        title: "Éxito",
        message: "Posición creada correctamente",
      });
      await fetchPositions();
    } catch (error) {
      console.error("Error creating position:", error);
      setToast({
        title: "Error",
        message: "No se pudo crear la posición",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleAbrirEditar = (position: Position) => {
    setOpenMenuId(null);
    setMenuPos(null);
    setPosicionAEditar(position);
  };

  const handleAbrirEliminar = (position: Position) => {
    setOpenMenuId(null);
    setMenuPos(null);
    setPosicionAEliminar(position);
  };

return (
    <div className="min-h-screen bg-[#ECEFF1]">
      {/* Header */}
      <div className="bg-white border-b border-[#BDD5EA]">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-[#8aa3ad] mb-4">
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4" />
            <span>Áreas</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#0F1819] font-medium">Posiciones</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0F1819]">
              Gestión de Posiciones
            </h1>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Posición
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#BDD5EA]">
        <div className="px-6">
          <div className="flex gap-8">
            {(["All", "Hierarchy", "Archived"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-[#8aa3ad] hover:text-[#0F1819]"
                }`}
              >
                {tab === "All"
                  ? "Todas las Posiciones"
                  : tab === "Hierarchy"
                  ? "Jerarquía"
                  : "Archivadas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white px-6 py-4 border-b border-[#BDD5EA]">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8aa3ad]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar posición, ID, empleado..."
              className="w-full pl-10 pr-4 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
            />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <SlidersHorizontal className="w-5 h-5 text-[#8aa3ad]" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white mx-6 my-6 rounded-lg shadow-sm overflow-hidden border border-[#BDD5EA]">
        {loading ? (
          <div className="px-6 py-16 text-center">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-[#BDD5EA] border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-[#8aa3ad]">Cargando posiciones...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[#8aa3ad]">No se encontraron posiciones</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#203D47] text-white font-semibold text-sm">
              <div className="col-span-3">POSICIÓN</div>
              <div className="col-span-3">EMPLEADOS</div>
              <div className="col-span-2">POSICIÓN SUPERIOR</div>
              <div className="col-span-2">ESTADO</div>
              <div className="col-span-2">ACCIONES</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[#BDD5EA]">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3">
                    <p className="font-semibold text-[#0F1819]">{position.nombre}</p>
                    <p className="text-xs text-[#8aa3ad]">{position.id}</p>
                  </div>

                  <div className="col-span-3 flex items-center">
                    <AvatarStack empleados={position.empleados} />
                  </div>

                  <div className="col-span-2 text-sm text-[#8aa3ad]">
                    {position.posicionSuperior || "—"}
                  </div>

                  <div className="col-span-2 flex items-center">
                    <StatusBadge status={position.estado} />
                  </div>

                  <div className="col-span-2">
                    <button
                      data-menu-trigger
                      onClick={(e) => {
                        if (openMenuId === position.id) {
                          setOpenMenuId(null);
                          setMenuPos(null);
                        } else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + 4, left: rect.left - 120 });
                          setOpenMenuId(position.id);
                        }
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-[#8aa3ad]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dropdown flotante — fuera de la tabla para evitar overflow-hidden */}
      {openMenuId && menuPos && (
        <div
          data-menu-trigger
          className="fixed bg-white border border-[#BDD5EA] rounded-lg shadow-lg py-2 z-50 min-w-max"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={() => {
              const pos = positions.find((p) => p.id === openMenuId);
              if (pos) {
                setOpenMenuId(null);
                setMenuPos(null);
                setPosicionAVer(pos);
              }
            }}
            className="w-full px-4 py-2 text-sm text-[#0F1819] hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Ver detalles
          </button>
          <button
            onClick={() => {
              const pos = positions.find((p) => p.id === openMenuId);
              if (pos) {
                handleAbrirEditar(pos);
              }
            }}
            className="w-full px-4 py-2 text-sm text-[#0F1819] hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => {
              const pos = positions.find((p) => p.id === openMenuId);
              if (pos) {
                handleAbrirEliminar(pos);
              }
            }}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && positions.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-[#8aa3ad]" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 2), Math.min(totalPages, page + 1))
            .map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  pageNum === page
                    ? "bg-emerald-500 text-white"
                    : "text-[#8aa3ad] hover:bg-white"
                }`}
              >
                {pageNum}
              </button>
            ))}

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-[#8aa3ad]" />
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <ToastNotification
          isVisible={!!toast}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modales */}
      <NewPositionModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSave={handleNewPosition}
        isLoading={modalLoading}
      />
      <EditPositionModal
        isOpen={posicionAEditar !== null}
        position={posicionAEditar}
        onClose={() => setPosicionAEditar(null)}
        onSuccess={async () => {
          setPosicionAEditar(null);
          setToast({
            title: "Éxito",
            message: "Posición actualizada correctamente",
          });
          await fetchPositions();
        }}
      />

      <DeletePositionModal
        isOpen={posicionAEliminar !== null}
        position={posicionAEliminar}
        onCerrar={() => setPosicionAEliminar(null)}
        onEliminada={async () => {
          setPosicionAEliminar(null);
          setToast({
            title: "Éxito",
            message: "Posición eliminada con éxito",
          });
          await fetchPositions();
        }}
      />

      <ViewPositionModal
        isOpen={posicionAVer !== null}
        position={posicionAVer}
        onCerrar={() => setPosicionAVer(null)}
      />
    </div>
  );
}
