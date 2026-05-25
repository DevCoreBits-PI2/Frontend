"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, Building2 } from "lucide-react";
import { Position, editarPosicion } from "@/services/positionsService";
import { Area } from "@/services/areasService";
import { translateBackendError } from "@/lib/api/translateError";

interface EditPositionModalProps {
  isOpen: boolean;
  position: Position | null;
  areas: Area[];
  parentOptions: Position[];
  onClose: () => void;
  onSuccess?: (position: Position) => void;
}

export default function EditPositionModal({
  isOpen,
  position,
  areas,
  parentOptions,
  onClose,
  onSuccess,
}: EditPositionModalProps) {
  const [nombre, setNombre] = useState("");
  const [description, setDescription] = useState("");
  const [posicionSuperiorId, setPosicionSuperiorId] = useState<string>("");
  const [areaIdNum, setAreaIdNum] = useState<string>("");
  const [estado, setEstado] = useState<"Active" | "Inactive">("Active");
  const [vacancies, setVacancies] = useState<string>("1");
  const [baseSalary, setBaseSalary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (position) {
      setNombre(position.nombre);
      setDescription(position.description ?? "");
      setPosicionSuperiorId(
        position.posicionSuperiorId != null ? String(position.posicionSuperiorId) : "",
      );
      setAreaIdNum(String(position.areaIdNumber));
      setEstado(position.estado);
      setVacancies(String(position.vacancies ?? 1));
      setBaseSalary(position.baseSalary != null ? String(position.baseSalary) : "");
      setError("");
    }
  }, [position, isOpen]);

  // Empleados ya asignados al cargo, calculado por el enrich del positionsService.
  // Si la prop `position` no llegó enriquecida (caso borde), trata como 0.
  const empleadosAsignados = position?.empleados.length ?? 0;
  // Warning visible cuando el nuevo número de vacantes es menor que los asignados.
  // El backend NO valida esto: deja el cargo "sobreasignado" sin chistar.
  const vacancesValueNum = Number(vacancies);
  const vacanciesValidNumber = Number.isInteger(vacancesValueNum) && vacancesValueNum >= 1;
  const dejariaSobreasignado =
    vacanciesValidNumber && vacancesValueNum < empleadosAsignados;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!position) {
      setError("No position selected");
      return;
    }
    // Reglas alineadas con el backend (`normalizeName` exige 3-100).
    const n = nombre.trim();
    if (!n) {
      setError("El nombre de la posición es obligatorio.");
      return;
    }
    if (n.length < 3 || n.length > 100) {
      setError("El nombre debe tener entre 3 y 100 caracteres.");
      return;
    }
    const d = description.trim();
    if (!d) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (d.length < 3 || d.length > 500) {
      setError("La descripción debe tener entre 3 y 500 caracteres.");
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
        setError("El salario base debe ser ≥ 0.");
        return;
      }
      salaryN = n;
    }

    // Evita un ciclo trivial donde el padre seleccionado es la posición misma.
    if (posicionSuperiorId && Number(posicionSuperiorId) === position.rawId) {
      setError("Una posición no puede ser su propia superior.");
      return;
    }

    // Confirmación blanda si el cargo va a quedar sobreasignado. Usamos
    // `window.confirm` para no introducir otro modal anidado; suficiente para
    // un caso edge.
    if (vacN < empleadosAsignados) {
      const sobrante = empleadosAsignados - vacN;
      const ok = window.confirm(
        `Vas a bajar las vacantes a ${vacN}, pero hay ${empleadosAsignados} empleados asignados a este cargo.\n\n` +
        `El cargo quedará sobreasignado en ${sobrante} persona${sobrante === 1 ? "" : "s"}. ` +
        `El backend lo acepta, pero no podrás invitar más empleados a este cargo hasta resolverlo.\n\n` +
        `¿Continuar?`,
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      const posicionActualizada = await editarPosicion(position.id, {
        nombre: nombre.trim(),
        description: description.trim(),
        areaIdNumber: Number(areaIdNum),
        posicionSuperiorId: posicionSuperiorId ? Number(posicionSuperiorId) : null,
        estado,
        vacancies: vacN,
        baseSalary: salaryN,
      });

      onSuccess?.(posicionActualizada);
      onClose();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(translateBackendError(raw) || "No se pudo actualizar la posición.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !position) return null;

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-[#0F1819] outline-none transition bg-[#f8fafb] placeholder:text-[#8aa3ad] focus:ring-2 focus:ring-[#2ECC71]/25 focus:border-[#2ECC71] ${
      hasError ? "border-red-400 bg-red-50" : "border-[#e8eef0]"
    }`;

  // Filtramos la propia posición + posiciones inactivas (el backend rechaza
  // padres inactivos en `validateParentHierarchy`).
  const posiblesPadres = parentOptions.filter(
    (p) => p.rawId !== position.rawId && p.estado === "Active",
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-50 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-[#edf2f3] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1819] text-white">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F1819]">Editar posición</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
              Nombre de posición *
            </label>
            <div className="relative">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inputClass()}
                disabled={loading}
                placeholder="Senior Architect"
              />
              <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
              Descripción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass()}
              disabled={loading}
              placeholder="Responsabilidades, requisitos, etc."
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
              Posición superior
            </label>
            <select
              value={posicionSuperiorId}
              onChange={(e) => setPosicionSuperiorId(e.target.value)}
              className={inputClass()}
              disabled={loading}
            >
              <option value="">(Sin posición superior)</option>
              {posiblesPadres.map((p) => (
                <option key={p.id} value={String(p.rawId)}>
                  {p.nombre} — {p.areaNombre || "sin área"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
                Área *
              </label>
              <select
                value={areaIdNum}
                onChange={(e) => setAreaIdNum(e.target.value)}
                className={inputClass()}
                disabled={loading}
              >
                {areas.length === 0 && <option value="">— Sin áreas —</option>}
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as "Active" | "Inactive")}
                className={inputClass()}
                disabled={loading}
              >
                <option value="Active">Activa</option>
                <option value="Inactive">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
                Vacantes *
              </label>
              <input
                type="number"
                min={1}
                value={vacancies}
                onChange={(e) => setVacancies(e.target.value)}
                className={inputClass(dejariaSobreasignado)}
                disabled={loading}
              />
              <p className="text-[11px] text-[#8aa3ad] leading-snug">
                Actualmente {empleadosAsignados === 0
                  ? "no hay empleados asignados a este cargo."
                  : empleadosAsignados === 1
                    ? "hay 1 empleado asignado a este cargo."
                    : `hay ${empleadosAsignados} empleados asignados a este cargo.`}
              </p>
              {dejariaSobreasignado && (
                <p className="text-[11px] font-medium text-rose-600 leading-snug">
                  El cargo quedaría sobreasignado en {empleadosAsignados - vacancesValueNum}
                  {empleadosAsignados - vacancesValueNum === 1 ? " persona" : " personas"}. Te pediremos confirmación al guardar.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">
                Salario base
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="Opcional"
                className={inputClass()}
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

          <div className="mt-1 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#203D47] hover:bg-[#f4f7f8] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
