"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { getPositions, buildPositionTree } from "@/services/orgChartService";
import { Position, PositionTree } from "@/types/orgChart";
import OrgTree from "@/components/org-chart/OrgTree";
import PositionDetailPanel from "@/components/org-chart/AreaDetailsPanel";
import HierarchyModal from "@/components/org-chart/HierarchyModal";
import ErrorModal from "@/components/org-chart/ErrorModal";
import DetachConfirmModal from "@/components/org-chart/DetachConfirmModal";
import { ChevronRight, ChevronDown, Filter, Clock, Save } from "lucide-react";

const DEPARTMENTS = ["Departamento de Ingeniería", "Departamento de Marketing", "Departamento de Operaciones"];

// Toast helpers
function toastSuccess() {
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
          <p className="text-[#0F1819] font-bold text-sm">Jerarquía exitosa</p>
          <p className="text-[#8aa3ad] text-xs mt-0.5">La nueva jerarquía fue implementada</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-[#c5d5db] hover:text-[#8aa3ad] transition-colors mt-0.5 shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    ),
    { position: "top-right", duration: 4000 }
  );
}

function toastDetached() {
  toast.custom(
    (t) => (
      <div
        className={`bg-rose-500 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3 max-w-[320px] transition-opacity ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-sm font-semibold">Relación jerárquica eliminada</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-white/80 hover:text-white transition-colors shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    ),
    { position: "top-right", duration: 3500 }
  );
}

export default function PositionHierarchyPage() {
  const [tree, setTree] = useState<PositionTree | null>(null);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Position | null>(null);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [scale, setScale] = useState(0.9);
  const [lastSaved, setLastSaved] = useState("Hoy a las 10:42");

  // Editable panel state (lifted up so Save/Discard can control)
  const [editSuperior, setEditSuperior] = useState("");
  const [editReports, setEditReports] = useState<string[]>([]);

  // Modal states
  const [addParent, setAddParent] = useState<Position | null>(null);
  const [editPos, setEditPos] = useState<Position | null>(null);
  const [detachPos, setDetachPos] = useState<Position | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    returnTo: "add" | "edit";
    ctx: Position;
  } | null>(null);

  useEffect(() => {
    getPositions()
      .then((positions) => {
        setAllPositions(positions);
        setTree(buildPositionTree(positions));
      })
      .catch(() => setError("No se pudo cargar la jerarquía."))
      .finally(() => setLoading(false));
  }, []);

  // ── Selection ──────────────────────────────────────────────────
  const handleSelect = useCallback((pos: Position) => {
    setSelected((prev) => {
      if (prev?.id === pos.id) {
        setEditSuperior("");
        setEditReports([]);
        return null;
      }
      setAllPositions((current) => {
        const saved = current.find((p) => p.id === pos.id) ?? pos;
        setEditSuperior(saved.superiorName ?? "");
        setEditReports(saved.directReportNames);
        return current;
      });
      return pos;
    });
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
    setEditSuperior("");
    setEditReports([]);
  }, []);

  // ── Panel Save / Discard ───────────────────────────────────────
  const handleDiscard = () => {
    if (selected) {
      setEditSuperior(selected.superiorName ?? "");
      setEditReports(selected.directReportNames);
    }
    handleClose();
  };

  const handleSave = () => {
    if (selected) {
      const updatedPos: Position = {
        ...selected,
        superiorName: editSuperior,
        directReportNames: editReports,
      };
      setAllPositions((prev) => prev.map((p) => (p.id === selected.id ? updatedPos : p)));
      setSelected(updatedPos);
    }
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    setLastSaved(`Hoy a las ${h}:${m}`);
    toast.success("Cambios guardados con éxito", {
      duration: 3500,
      style: {
        background: "#0F1819",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "600",
        borderRadius: "12px",
        border: "1px solid #203D47",
      },
      iconTheme: { primary: "#34d399", secondary: "#0F1819" },
    });
  };

  // ── Add Hierarchy ──────────────────────────────────────────────
  const handleAddChild = useCallback((parent: Position) => {
    setAddParent(parent);
  }, []);

  const handleAddConfirm = (newName: string) => {
    if (!addParent) return;

    if (!newName) {
      setErrorInfo({
        message:
          "El nombre de la posición no puede estar vacío. Por favor ingresa un nombre válido para la nueva posición.",
        returnTo: "add",
        ctx: addParent,
      });
      setAddParent(null);
      return;
    }

    if (
      allPositions.some((p) => p.name.toLowerCase() === newName.toLowerCase())
    ) {
      setErrorInfo({
        message: `No se puede aplicar la jerarquía establecida, ya que existe una posición llamada "${newName}". Por favor edita la configuración para crear una relación coherente.`,
        returnTo: "add",
        ctx: addParent,
      });
      setAddParent(null);
      return;
    }

    const newPos: Position = {
      id: `pos_${Date.now()}`,
      name: newName,
      department: addParent.department,
      level: addParent.level + 1,
      parentId: addParent.id,
      superiorName: addParent.name,
      employeeCount: 0,
      status: "Active",
      directReportNames: [],
      iconType: "person",
    };

    const updated = [...allPositions, newPos];
    setAllPositions(updated);
    setTree(buildPositionTree(updated));
    setAddParent(null);
    toastSuccess();
  };

  // ── Edit Hierarchy ─────────────────────────────────────────────
  const handleEdit = useCallback((pos: Position) => {
    setEditPos(pos);
  }, []);

  const handleEditConfirm = (newName: string) => {
    if (!editPos) return;

    if (!newName) {
      setErrorInfo({
        message: "El nombre de la posición no puede estar vacío. Por favor ingresa un nombre válido.",
        returnTo: "edit",
        ctx: editPos,
      });
      setEditPos(null);
      return;
    }

    const conflict = allPositions.find(
      (p) => p.id !== editPos.id && p.name.toLowerCase() === newName.toLowerCase()
    );
    if (conflict) {
      setErrorInfo({
        message: `No se puede aplicar la jerarquía establecida, ya que la posición "${newName}" no puede ubicarse sobre sí misma, ni recibir reportes de sí misma. Por favor edita la configuración para crear una relación coherente.`,
        returnTo: "edit",
        ctx: editPos,
      });
      setEditPos(null);
      return;
    }

    const updated = allPositions.map((p) =>
      p.id === editPos.id ? { ...p, name: newName } : p
    );
    setAllPositions(updated);
    setTree(buildPositionTree(updated));
    if (selected?.id === editPos.id) setSelected((prev) => prev ? { ...prev, name: newName } : null);
    setEditPos(null);
    toast.success("Posición actualizada", {
      style: { background: "#0F1819", color: "#fff", borderRadius: "12px", border: "1px solid #203D47" },
      iconTheme: { primary: "#34d399", secondary: "#0F1819" },
    });
  };

  // ── Detach ─────────────────────────────────────────────────────
  const handleDetach = useCallback((pos: Position) => {
    setDetachPos(pos);
  }, []);

  const handleDetachFromPanel = useCallback(() => {
    if (selected) setDetachPos(selected);
  }, [selected]);

  const handleDetachConfirm = () => {
    if (!detachPos) return;

    const parentId = detachPos.parentId;
    const parentName = allPositions.find((p) => p.id === parentId)?.name;

    const updated = allPositions
      .filter((p) => p.id !== detachPos.id)
      .map((p) =>
        p.parentId === detachPos.id
          ? { ...p, parentId, superiorName: parentName }
          : p
      );

    try {
      const newTree = buildPositionTree(updated);
      setAllPositions(updated);
      setTree(newTree);
      if (selected?.id === detachPos.id) handleClose();
    } catch {
      // Tree build failed (e.g. no root) — silently ignore
    }

    setDetachPos(null);
    toastDetached();
  };

  // ── Error modal retry ──────────────────────────────────────────
  const handleTryAgain = () => {
    if (!errorInfo) return;
    if (errorInfo.returnTo === "add") setAddParent(errorInfo.ctx);
    else setEditPos(errorInfo.ctx);
    setErrorInfo(null);
  };

  // ── Subordinates helper ────────────────────────────────────────
  const childrenNames = (parentId: string) =>
    allPositions.filter((p) => p.parentId === parentId).map((p) => p.name);

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f7f8]">
      {/* Breadcrumb */}
      <header className="flex items-center px-6 py-3.5 bg-white border-b border-[#d1dde2] shrink-0">
        <nav className="flex items-center gap-1.5 text-xs text-[#8aa3ad]">
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Panel</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Estructura Organizacional</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="hover:text-[#203D47] cursor-pointer transition-colors">Posiciones</span>
          <ChevronRight size={12} className="text-[#c5d5db]" />
          <span className="text-[#0F1819] font-semibold">Jerarquía</span>
        </nav>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-6 py-5 flex flex-col gap-4 overflow-hidden">
        <div>
          <h1 className="text-xl font-bold text-[#0F1819]">Jerarquía de Posiciones</h1>
          <p className="text-sm text-[#8aa3ad] mt-0.5">
            Define y administra las relaciones de reporte y la estructura organizacional entre tus departamentos.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDeptDropdown((v) => !v)}
              className="flex items-center gap-2 bg-white border border-[#d1dde2] rounded-xl px-4 py-2.5 text-sm text-[#0F1819] font-medium hover:border-[#b0c4cc] transition-colors"
            >
              <span>{department}</span>
              <ChevronDown size={14} className="text-[#8aa3ad]" />
            </button>
            {showDeptDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDeptDropdown(false)} />
                <div className="absolute left-0 top-full mt-1.5 z-20 bg-white border border-[#d1dde2] rounded-xl shadow-lg overflow-hidden min-w-full">
                  {DEPARTMENTS.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDepartment(d); setShowDeptDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        d === department ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-[#0F1819] hover:bg-[#f4f7f8]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="flex items-center gap-2 border border-[#d1dde2] bg-white text-[#4a7880] text-sm font-medium px-4 py-2.5 rounded-xl hover:border-[#b0c4cc] hover:bg-[#f4f7f8] transition-colors">
            <Filter size={14} />
            Filtros Avanzados
          </button>
        </div>

        {/* Card árbol + panel */}
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
          {!loading && !error && tree && (
            <>
              <OrgTree
                tree={tree}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
                onAddChild={handleAddChild}
                onEdit={handleEdit}
                onDetach={handleDetach}
                scale={scale}
                onZoomIn={() => setScale((s) => Math.min(2, s + 0.15))}
                onZoomOut={() => setScale((s) => Math.max(0.3, s - 0.15))}
                onReset={() => setScale(0.9)}
              />
              <PositionDetailPanel
                position={selected}
                allPositions={allPositions}
                superior={editSuperior}
                reports={editReports}
                onSuperiorChange={setEditSuperior}
                onReportsChange={setEditReports}
                onClose={handleClose}
                onDetach={handleDetachFromPanel}
              />
            </>
          )}
        </div>
      </main>

      {/* Barra inferior — visible solo con panel abierto */}
      <footer
        className={`flex items-center justify-between px-6 bg-white border-t border-[#d1dde2] shrink-0 transition-all duration-200 ease-out overflow-hidden ${
          selected ? "py-3.5 opacity-100 pointer-events-auto max-h-20" : "py-0 opacity-0 pointer-events-none max-h-0"
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-[#8aa3ad]">
          <Clock size={13} />
          <span>Último guardado: {lastSaved}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDiscard}
            className="px-5 py-2.5 border border-[#d1dde2] text-[#4a7880] text-sm font-semibold rounded-xl hover:border-[#b0c4cc] hover:bg-[#f4f7f8] transition-colors"
          >
            Descartar Cambios
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Save size={14} />
            Guardar Cambios
          </button>
        </div>
      </footer>

      {/* ── Modales ── */}
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
