"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Check, X, ChevronRight, ChevronDown, Filter } from "lucide-react";
import { getPositions, buildPositionForest } from "@/services/orgChartService";
import { Position, PositionTree } from "@/types/orgChart";
import OrgTree from "@/components/org-chart/OrgTree";
import PositionDetailPanel from "@/components/org-chart/AreaDetailsPanel";
import HierarchyModal from "@/components/org-chart/HierarchyModal";
import ErrorModal from "@/components/org-chart/ErrorModal";
import DetachConfirmModal from "@/components/org-chart/DetachConfirmModal";
import { obtenerAreas, type Area } from "@/services/areasService";
import {
  crearPosicion,
  editarPosicion,
  eliminarJerarquiaPadre,
} from "@/services/positionsService";
import { useAuth } from "@/lib/auth/AuthContext";
import { canEditOrgChart } from "@/lib/auth/roles";

const ALL_AREAS_VALUE = "__ALL__";

function toastSuccess(message = "Cambios aplicados") {
  toast.custom(
    (t) => (
      <div
        className={`bg-white rounded-2xl shadow-xl border border-[#e8eff2] px-4 py-3.5 flex items-start gap-3 max-w-[290px] transition-opacity ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <Check size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#0F1819] font-bold text-sm">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-[#c5d5db] hover:text-[#8aa3ad] transition-colors mt-0.5 shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    ),
    { position: "top-right", duration: 3500 }
  );
}

function toastError(message: string) {
  toast.custom(
    (t) => (
      <div
        className={`bg-rose-500 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3 max-w-[360px] transition-opacity ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-sm font-semibold">{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-white/80 hover:text-white transition-colors shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    ),
    { position: "top-right", duration: 4500 }
  );
}

export default function PositionHierarchyPage() {
  const { authUser } = useAuth();
  // Solo el admin puede editar el organigrama. Para el resto (HT, jefes,
  // empleados regulares) el árbol queda en modo solo-lectura: no se pasan
  // callbacks de edición a OrgTree ni al panel lateral, lo que oculta los
  // botones de añadir/editar/desvincular y el dropdown de superior.
  const canEdit = canEditOrgChart(authUser);
  const [areas, setAreas] = useState<Area[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Position | null>(null);

  const [areaFilter, setAreaFilter] = useState<string>(ALL_AREAS_VALUE);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [scale, setScale] = useState(0.9);

  // Estado del panel lateral. `editSuperiorId` es el id (string del numérico)
  // de la posición seleccionada como nuevo superior, o "" para "sin superior".
  const [editSuperiorId, setEditSuperiorId] = useState<string>("");
  const [editReports, setEditReports] = useState<string[]>([]);
  const [savingSuperior, setSavingSuperior] = useState(false);

  const [addParent, setAddParent] = useState<Position | null>(null);
  const [editPos, setEditPos] = useState<Position | null>(null);
  const [detachPos, setDetachPos] = useState<Position | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    returnTo: "add" | "edit";
    ctx: Position;
  } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [positions, areasReales] = await Promise.all([
        getPositions(),
        obtenerAreas(),
      ]);
      setAllPositions(positions);
      setAreas(areasReales);
    } catch {
      setError("No se pudo cargar la jerarquía.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Posiciones filtradas por área seleccionada. Como `area` viene como el
  // *nombre*, comparamos por nombre. ALL_AREAS_VALUE → sin filtro.
  const positionsFiltradas = useMemo(() => {
    if (areaFilter === ALL_AREAS_VALUE) return allPositions;
    const areaSeleccionada = areas.find((a) => a.id === areaFilter);
    if (!areaSeleccionada) return allPositions;
    return allPositions.filter((p) => p.department === areaSeleccionada.nombre);
  }, [allPositions, areas, areaFilter]);

  const forest = useMemo(
    () => buildPositionForest(positionsFiltradas),
    [positionsFiltradas],
  );

  // ── Selección ──────────────────────────────────────────────────────────
  const handleSelect = useCallback((pos: Position) => {
    setSelected((prev) => {
      if (prev?.id === pos.id) {
        setEditSuperiorId("");
        setEditReports([]);
        return null;
      }
      setEditSuperiorId(pos.parentId ?? "");
      setEditReports(pos.directReportNames);
      return pos;
    });
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
    setEditSuperiorId("");
    setEditReports([]);
  }, []);

  // ── Guardar nueva posición superior ────────────────────────────────────
  // Persistimos parent_position_id vía PATCH editarPosicion. Pasar `null`
  // limpia la jerarquía (equivalente a desvincular).
  const handleSaveSuperior = useCallback(async () => {
    if (!selected) return;
    const newParentId = editSuperiorId === "" ? null : Number(editSuperiorId);
    if (newParentId !== null && Number.isNaN(newParentId)) {
      toastError("ID de superior inválido.");
      return;
    }
    setSavingSuperior(true);
    try {
      await editarPosicion(`POS-${selected.id.padStart(5, "0")}`, {
        posicionSuperiorId: newParentId,
      });
      await reload();
      toastSuccess("Posición superior actualizada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el superior.";
      toastError(msg);
    } finally {
      setSavingSuperior(false);
    }
  }, [selected, editSuperiorId, reload]);

  // ── Agregar posición hija ──────────────────────────────────────────────
  const handleAddChild = useCallback((parent: Position) => {
    setAddParent(parent);
  }, []);

  const handleAddConfirm = async (newName: string) => {
    if (!addParent) return;

    const idAdministrator = authUser?.adminId ?? authUser?.employeeId ?? null;
    if (!idAdministrator) {
      setErrorInfo({
        message: "Tu sesión no tiene administrador asociado para crear posiciones.",
        returnTo: "add",
        ctx: addParent,
      });
      setAddParent(null);
      return;
    }
    if (!newName) {
      setErrorInfo({
        message: "El nombre de la posición no puede estar vacío.",
        returnTo: "add",
        ctx: addParent,
      });
      setAddParent(null);
      return;
    }

    // El backend requiere `id_area`. Heredamos el área del padre.
    const areaPadre = areas.find((a) => a.nombre === addParent.department);
    if (!areaPadre) {
      setErrorInfo({
        message: "No se pudo determinar el área del padre. Crea esta posición desde Gestión de Áreas → Posiciones.",
        returnTo: "add",
        ctx: addParent,
      });
      setAddParent(null);
      return;
    }

    try {
      await crearPosicion(
        {
          nombre: newName,
          description: `${newName} (creada desde el organigrama)`,
          areaIdNumber: Number(areaPadre.id),
          posicionSuperiorId: Number(addParent.id),
          estado: "Active",
          vacancies: 1,
        },
        idAdministrator,
      );
      setAddParent(null);
      await reload();
      toastSuccess("Posición creada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear la posición.";
      setErrorInfo({ message: msg, returnTo: "add", ctx: addParent });
      setAddParent(null);
    }
  };

  // ── Editar nombre de posición ──────────────────────────────────────────
  const handleEdit = useCallback((pos: Position) => {
    setEditPos(pos);
  }, []);

  const handleEditConfirm = async (newName: string) => {
    if (!editPos) return;
    if (!newName) {
      setErrorInfo({
        message: "El nombre de la posición no puede estar vacío.",
        returnTo: "edit",
        ctx: editPos,
      });
      setEditPos(null);
      return;
    }

    try {
      await editarPosicion(`POS-${editPos.id.padStart(5, "0")}`, { nombre: newName });
      setEditPos(null);
      await reload();
      toastSuccess("Posición actualizada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar la posición.";
      setErrorInfo({ message: msg, returnTo: "edit", ctx: editPos });
      setEditPos(null);
    }
  };

  // ── Desvincular del padre ──────────────────────────────────────────────
  // En el backend: PUT /administrative-data/positions/remove-father/:id
  // (no elimina la posición, solo le quita el parent_position_id).
  const handleDetach = useCallback((pos: Position) => {
    setDetachPos(pos);
  }, []);

  const handleDetachFromPanel = useCallback(() => {
    if (selected) setDetachPos(selected);
  }, [selected]);

  const handleDetachConfirm = async () => {
    if (!detachPos) return;
    try {
      await eliminarJerarquiaPadre(`POS-${detachPos.id.padStart(5, "0")}`);
      if (selected?.id === detachPos.id) handleClose();
      setDetachPos(null);
      await reload();
      toastSuccess("Relación jerárquica desvinculada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo desvincular la posición.";
      setDetachPos(null);
      toastError(msg);
    }
  };

  // ── Reintentar tras error ──────────────────────────────────────────────
  const handleTryAgain = () => {
    if (!errorInfo) return;
    if (errorInfo.returnTo === "add") setAddParent(errorInfo.ctx);
    else setEditPos(errorInfo.ctx);
    setErrorInfo(null);
  };

  // ── Hijos para los modales ─────────────────────────────────────────────
  const childrenNames = (parentId: string) =>
    allPositions.filter((p) => p.parentId === parentId).map((p) => p.name);

  const labelArea =
    areaFilter === ALL_AREAS_VALUE
      ? "Todas las áreas"
      : areas.find((a) => a.id === areaFilter)?.nombre ?? "Todas las áreas";

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f7f8]">
      <header className="flex items-center px-6 py-3.5 bg-white border-b border-[#d1dde2] shrink-0">
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Panel</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Estructura Organizacional</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="text-[#0F1819] font-semibold">Jerarquía</span>
        </nav>
      </header>

      <main className="flex-1 px-6 py-5 flex flex-col gap-4 overflow-hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#0F1819]">Jerarquía de Posiciones</h1>
            {!canEdit && (
              <span className="rounded-full bg-[#f0f4f5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#576975]">
                Solo lectura
              </span>
            )}
          </div>
          <p className="text-sm text-[#8aa3ad] mt-0.5">
            {canEdit
              ? "Vista en tiempo real de las relaciones de reporte entre posiciones. Los cambios se sincronizan con la sección de Posiciones."
              : "Vista en tiempo real de las relaciones de reporte entre posiciones. La edición está reservada al administrador."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDeptDropdown((v) => !v)}
              className="flex items-center gap-2 bg-white border border-[#d1dde2] rounded-xl px-4 py-2.5 text-sm text-[#0F1819] font-medium hover:border-[#b0c4cc] transition-colors"
            >
              <span>{labelArea}</span>
              <ChevronDown size={14} className="text-[#8aa3ad]" />
            </button>
            {showDeptDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDeptDropdown(false)} />
                <div className="absolute left-0 top-full mt-1.5 z-20 bg-white border border-[#d1dde2] rounded-xl shadow-lg overflow-hidden min-w-[220px] max-h-72 overflow-y-auto">
                  <button
                    onClick={() => { setAreaFilter(ALL_AREAS_VALUE); setShowDeptDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      areaFilter === ALL_AREAS_VALUE ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-[#0F1819] hover:bg-[#f4f7f8]"
                    }`}
                  >
                    Todas las áreas
                  </button>
                  {areas.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setAreaFilter(a.id); setShowDeptDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        a.id === areaFilter ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-[#0F1819] hover:bg-[#f4f7f8]"
                      }`}
                    >
                      {a.nombre}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            disabled
            title="Próximamente"
            className="flex items-center gap-2 border border-[#d1dde2] bg-white text-[#4a7880] text-sm font-medium px-4 py-2.5 rounded-xl opacity-50 cursor-not-allowed"
          >
            <Filter size={14} />
            Filtros Avanzados
          </button>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-[#d1dde2] shadow-sm overflow-hidden flex min-h-0">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#203D47] border-t-emerald-400 animate-spin" />
                <span className="text-xs text-[#8aa3ad]">Cargando jerarquía…</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-6 py-4 text-sm text-rose-500">{error}</div>
            </div>
          )}
          {!loading && !error && (
            <>
              <OrgTree
                trees={forest as PositionTree[]}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
                onAddChild={canEdit ? handleAddChild : undefined}
                onEdit={canEdit ? handleEdit : undefined}
                onDetach={canEdit ? handleDetach : undefined}
                scale={scale}
                onZoomIn={() => setScale((s) => Math.min(2, s + 0.15))}
                onZoomOut={() => setScale((s) => Math.max(0.3, s - 0.15))}
                onReset={() => setScale(0.9)}
              />
              <PositionDetailPanel
                position={selected}
                allPositions={allPositions}
                superiorId={editSuperiorId}
                reports={editReports}
                onSuperiorIdChange={setEditSuperiorId}
                onReportsChange={setEditReports}
                onSaveSuperior={canEdit ? handleSaveSuperior : undefined}
                superiorSaving={savingSuperior}
                onClose={handleClose}
                onDetach={canEdit ? handleDetachFromPanel : undefined}
                readOnly={!canEdit}
              />
            </>
          )}
        </div>
      </main>

      {addParent && (
        <HierarchyModal
          mode="add"
          superiorPosition={addParent.name}
          subordinates={childrenNames(addParent.id)}
          onClose={() => setAddParent(null)}
          onConfirm={handleAddConfirm}
        />
      )}

      {editPos && (
        <HierarchyModal
          mode="edit"
          superiorPosition={editPos.superiorName ?? "—"}
          currentName={editPos.name}
          subordinates={childrenNames(editPos.id)}
          onClose={() => setEditPos(null)}
          onConfirm={handleEditConfirm}
        />
      )}

      {detachPos && (
        <DetachConfirmModal
          position={detachPos}
          onClose={() => setDetachPos(null)}
          onConfirm={handleDetachConfirm}
        />
      )}

      {errorInfo && (
        <ErrorModal
          message={errorInfo.message}
          onClose={() => setErrorInfo(null)}
          onTryAgain={handleTryAgain}
        />
      )}
    </div>
  );
}
