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
  RotateCcw,
} from "lucide-react";
import {
  obtenerPosiciones,
  crearPosicion,
  editarPosicion,
  type Position,
  type NuevaPosicionInput,
} from "@/services/positionsService";
import { obtenerAreas, type Area } from "@/services/areasService";
import { useAuth } from "@/lib/auth/AuthContext";

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
  status: "Active" | "Inactive";
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Active") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
        Activa
      </span>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
      Inactiva
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
  onSave: (position: NuevaPosicionInput) => Promise<void>;
  isLoading?: boolean;
  areas: Area[];
  parentOptions: Position[];
}

function NewPositionModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  areas,
  parentOptions,
}: NewPositionModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [posicionSuperiorId, setPosicionSuperiorId] = useState<string>("");
  const [estado, setEstado] = useState<"Active" | "Inactive">("Active");
  const [areaIdNum, setAreaIdNum] = useState<string>("");
  const [vacancies, setVacancies] = useState<string>("1");
  const [baseSalary, setBaseSalary] = useState<string>("");
  const [error, setError] = useState("");

  // Cuando se abre el modal o cambian las áreas, autoselecciona la primera.
  useEffect(() => {
    if (isOpen && !areaIdNum && areas.length > 0) {
      setAreaIdNum(String(areas[0].id));
    }
  }, [isOpen, areas, areaIdNum]);

  const reset = () => {
    setNombre("");
    setDescripcion("");
    setPosicionSuperiorId("");
    setEstado("Active");
    setAreaIdNum(areas[0] ? String(areas[0].id) : "");
    setVacancies("1");
    setBaseSalary("");
    setError("");
  };

  const handleSave = async () => {
    setError("");
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!areaIdNum) {
      setError("Selecciona un área.");
      return;
    }
    const vacN = Number(vacancies);
    if (!Number.isInteger(vacN) || vacN < 1) {
      setError("Vacantes debe ser un entero ≥ 1.");
      return;
    }
    let salaryN: number | undefined;
    if (baseSalary.trim()) {
      const n = Number(baseSalary);
      if (Number.isNaN(n) || n < 0) {
        setError("El salario base debe ser un número ≥ 0.");
        return;
      }
      salaryN = n;
    }

    try {
      await onSave({
        nombre: nombre.trim(),
        description: descripcion.trim(),
        estado,
        areaIdNumber: Number(areaIdNum),
        posicionSuperiorId: posicionSuperiorId ? Number(posicionSuperiorId) : null,
        vacancies: vacN,
        baseSalary: salaryN,
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la posición.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[#BDD5EA] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0F1819]">Nueva Posición</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#8aa3ad]" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0F1819] mb-2">Nombre de Posición *</label>
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
            <label className="block text-sm font-medium text-[#0F1819] mb-2">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Responsabilidades, requisitos, etc."
              rows={3}
              className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F1819] mb-2">Posición Superior</label>
            <select
              value={posicionSuperiorId}
              onChange={(e) => setPosicionSuperiorId(e.target.value)}
              className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
            >
              <option value="">(Sin posición superior)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={String(p.rawId)}>
                  {p.nombre} — {p.areaNombre || "sin área"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1819] mb-2">Área *</label>
              <select
                value={areaIdNum}
                onChange={(e) => setAreaIdNum(e.target.value)}
                className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
              >
                {areas.length === 0 && <option value="">— Sin áreas —</option>}
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F1819] mb-2">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as "Active" | "Inactive")}
                className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
              >
                <option value="Active">Activa</option>
                <option value="Inactive">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1819] mb-2">Vacantes *</label>
              <input
                type="number"
                min={1}
                value={vacancies}
                onChange={(e) => setVacancies(e.target.value)}
                className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F1819] mb-2">Salario base</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-[#BDD5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[#0F1819]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
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
  const { authUser } = useAuth();
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [todasLasPosiciones, setTodasLasPosiciones] = useState<Position[]>([]);

  // Cargar áreas reales para los selects.
  useEffect(() => {
    obtenerAreas()
      .then(setAreas)
      .catch((err) => {
        console.error("Error fetching areas:", err);
      });
  }, []);

  // Cargar TODAS las posiciones (sin paginación) — se usa como lista de
  // posibles "posición superior" en los modales y para validar restricciones
  // de borrado (subordinados).
  const fetchTodasLasPosiciones = useCallback(async () => {
    try {
      const res = await obtenerPosiciones({ pageSize: 1000 });
      setTodasLasPosiciones(res.data);
    } catch (err) {
      console.error("Error fetching all positions:", err);
    }
  }, []);

  useEffect(() => {
    fetchTodasLasPosiciones();
  }, [fetchTodasLasPosiciones]);

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

  const handleNewPosition = async (positionData: NuevaPosicionInput) => {
    // El backend exige `id_administrator` (FK a tabla administrators).
    // Si es admin → adminId (de GET /api/admin/:id). Si es HT empleado → employeeId.
    const idAdministrator = authUser?.adminId ?? authUser?.employeeId ?? null;
    if (!idAdministrator) {
      setToast({
        title: "Error",
        message: "Tu sesión no tiene administrador asociado para crear posiciones.",
      });
      return;
    }
    try {
      setModalLoading(true);
      await crearPosicion(positionData, idAdministrator);
      setShowNewModal(false);
      setToast({
        title: "Éxito",
        message: "Posición creada correctamente",
      });
      await Promise.all([fetchPositions(), fetchTodasLasPosiciones()]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo crear la posición";
      console.error("Error creating position:", error);
      setToast({ title: "Error", message: msg });
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

  // Reactivar una posición inactiva: el backend solo expone PATCH de la
  // posición, así que mandamos status=active vía editarPosicion.
  const handleActivar = useCallback(async (position: Position) => {
    setOpenMenuId(null);
    setMenuPos(null);
    try {
      await editarPosicion(position.id, { estado: "Active" });
      setToast({
        title: "Éxito",
        message: `Posición "${position.nombre}" reactivada.`,
      });
      await Promise.all([fetchPositions(), fetchTodasLasPosiciones()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo reactivar la posición.";
      setToast({ title: "Error", message: msg });
    }
  }, [fetchPositions, fetchTodasLasPosiciones]);

return (
    <div className="min-h-screen bg-[#ECEFF1]">
      {/* Header */}
      <div className="bg-white border-b border-[#BDD5EA]">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-[#8aa3ad] mb-4">
            <span>Panel</span>
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
          {(() => {
            const pos = positions.find((p) => p.id === openMenuId);
            if (pos?.estado === "Inactive") {
              return (
                <button
                  onClick={() => handleActivar(pos)}
                  className="w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Activar
                </button>
              );
            }
            return null;
          })()}
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
        areas={areas}
        parentOptions={todasLasPosiciones}
      />
      <EditPositionModal
        isOpen={posicionAEditar !== null}
        position={posicionAEditar}
        onClose={() => setPosicionAEditar(null)}
        areas={areas}
        parentOptions={todasLasPosiciones}
        onSuccess={async () => {
          setPosicionAEditar(null);
          setToast({
            title: "Éxito",
            message: "Posición actualizada correctamente",
          });
          await Promise.all([fetchPositions(), fetchTodasLasPosiciones()]);
        }}
      />

      <DeletePositionModal
        isOpen={posicionAEliminar !== null}
        position={posicionAEliminar}
        allPositions={todasLasPosiciones}
        onCerrar={() => setPosicionAEliminar(null)}
        onEliminada={async () => {
          setPosicionAEliminar(null);
          setToast({
            title: "Éxito",
            message: "Posición eliminada con éxito",
          });
          await Promise.all([fetchPositions(), fetchTodasLasPosiciones()]);
        }}
        onError={(msg) => {
          setPosicionAEliminar(null);
          setToast({ title: "Error", message: msg });
        }}
      />

      <ViewPositionModal
        isOpen={posicionAVer !== null}
        positionId={posicionAVer?.id ?? null}
        fallback={posicionAVer}
        areas={areas}
        onCerrar={() => setPosicionAVer(null)}
        onReactivada={async () => {
          setToast({
            title: "Éxito",
            message: "Posición reactivada correctamente.",
          });
          await Promise.all([fetchPositions(), fetchTodasLasPosiciones()]);
        }}
      />
    </div>
  );
}
