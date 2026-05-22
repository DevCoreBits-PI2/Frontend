"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CalendarClock,
  CalendarX2,
  CircleSlash,
  MoreVertical,
  FileText,
  Eye,
  X,
  RefreshCw,
  Pencil,
  Ban,
  User,
  AlertTriangle,
} from "lucide-react";
import {
  Contrato,
  EstadoContrato,
  TipoContrato,
  ValidezContrato,
  anularContrato,
} from "@/services/contratosService";
import RenewContractFlow from "./RenewContractFlow";

export interface EmpleadoInfoContrato {
  nombre: string;
  codigo: string;
}

interface ContratosTableProps {
  contratos: Contrato[];
  onVoidSuccess?: (id: string) => void;
  empleadoNombre?: string;
  empleadoCodigo?: string;
  /**
   * Si se proporciona, la tabla muestra una columna "Empleado" y usa este
   * callback para resolver el nombre/código del empleado al abrir el panel
   * de detalle. Útil para la vista global de contratos.
   */
  lookupEmpleado?: (idEmpleado: string) => EmpleadoInfoContrato | null;
  onContratoRenovado?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function obtenerIconoTipo(tipo: TipoContrato) {
  switch (tipo) {
    case "INDEFINIDO":     return { icon: ShieldCheck,  color: "text-emerald-500" };
    case "FIJO":           return { icon: CalendarClock, color: "text-sky-500"    };
    case "SERVICIO":       return { icon: CircleSlash,   color: "text-slate-400"  };
    case "TIEMPO_PARCIAL": return { icon: CalendarX2,   color: "text-amber-500"  };
    case "APRENDIZAJE":    return { icon: CalendarClock, color: "text-violet-500" };
    case "OBRA":           return { icon: CalendarX2,   color: "text-orange-500" };
  }
}

function etiquetaTipo(tipo: TipoContrato): string {
  switch (tipo) {
    case "INDEFINIDO":     return "Término Indefinido";
    case "FIJO":           return "Término Fijo";
    case "SERVICIO":       return "Prestación de Servicios";
    case "TIEMPO_PARCIAL": return "Temporal";
    case "APRENDIZAJE":    return "Aprendizaje";
    case "OBRA":           return "Obra o Labor";
  }
}

function badgeEstado(estado: EstadoContrato) {
  switch (estado) {
    case "ACTIVO":   return { label: "Activo",   cls: "bg-emerald-50 text-emerald-600"  };
    case "RENOVADO": return { label: "Renovado", cls: "bg-sky-50 text-sky-600"          };
    case "EXPIRADO": return { label: "Expirado", cls: "bg-rose-50 text-rose-500"        };
    case "ANULADO":  return { label: "Anulado",  cls: "bg-slate-100 text-slate-500"     };
  }
}

function barraValidez(validez: ValidezContrato) {
  switch (validez) {
    case "ONGOING":   return { label: "EN CURSO",   color: "bg-emerald-500" };
    case "COMPLETED": return { label: "COMPLETADO", color: "bg-sky-400"     };
    case "EXPIRED":   return { label: "EXPIRADO",   color: "bg-rose-400"    };
    case "VOIDED":    return { label: "ANULADO",    color: "bg-slate-300"   };
  }
}


function formatFecha(fecha: string | null): string {
  if (!fecha) return "Sin vencimiento";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-ES", { month: "short", day: "2-digit", year: "numeric" });
}

// ── PDF download (no extra dependencies) ─────────────────────────────────────

function downloadPdf(c: Contrato) {
  const win = window.open("", "_blank", "width=820,height=700");
  if (!win) return;

  const badgeClass =
    c.estado === "ACTIVO"   ? "active"  :
    c.estado === "RENOVADO" ? "renewed" :
    c.estado === "EXPIRADO" ? "expired" : "voided";

  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Contrato ${c.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#0F1819;padding:48px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0F1819;padding-bottom:20px;margin-bottom:28px}
    .hdr h1{font-size:22px;font-weight:800}
    .hdr p{font-size:11px;color:#8aa3ad;margin-top:4px}
    .badge{display:inline-block;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
    .active{background:#d1fae5;color:#059669}
    .renewed{background:#e0f2fe;color:#0284c7}
    .expired{background:#fee2e2;color:#ef4444}
    .voided{background:#f1f5f9;color:#64748b}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
    .field label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8aa3ad;display:block;margin-bottom:4px}
    .field p{font-size:13px;font-weight:600;color:#0F1819}
    .notes{background:#f8fafb;border-left:3px solid #2ECC71;padding:16px 20px;border-radius:4px;font-size:13px;color:#576975;line-height:1.6;margin-bottom:28px}
    .footer{font-size:10px;color:#8aa3ad;border-top:1px solid #e8eef0;padding-top:16px}
    @media print{body{padding:32px}}
  </style>
</head>
<body>
  <div class="hdr">
    <div><h1>Detalles del Contrato</h1><p>ID de Referencia: ${c.id}</p></div>
    <span class="badge ${badgeClass}">${badgeEstado(c.estado).label}</span>
  </div>
  <div class="grid">
    <div class="field"><label>Tipo de Contrato</label><p>${etiquetaTipo(c.tipo)}</p></div>
    <div class="field"><label>Estado</label><p>${badgeEstado(c.estado).label}</p></div>
    <div class="field"><label>Fecha de Inicio</label><p>${formatFecha(c.fechaInicio)}</p></div>
    <div class="field"><label>Fecha de Fin</label><p>${formatFecha(c.fechaFin)}</p></div>
    <div class="field"><label>Fecha de Registro</label><p>${formatFecha(c.creadoEn)}</p></div>
    <div class="field"><label>ID de Empleado</label><p>${c.idEmpleado}</p></div>
  </div>
  ${c.notas ? `<div class="notes">"${c.notas}"</div>` : ""}
  <div class="footer">Generado el ${new Date().toLocaleDateString("es-ES", { month: "long", day: "2-digit", year: "numeric" })} · Sistema de Gestión de RRHH</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  win.print();
}

// ── Row context menu (portal-based to escape overflow-hidden) ─────────────────

function RowMenu({
  contrato,
  onViewDetails,
}: {
  contrato: Contrato;
  onViewDetails: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && mounted && createPortal(
        <>
          {/* invisible full-screen closer */}
          <div
            className="fixed inset-0 z-[9990]"
            onClick={() => setOpen(false)}
          />
          <div
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed z-[9991] min-w-[190px] rounded-xl bg-white border border-[#e8eef0] shadow-xl overflow-hidden py-1"
          >
            <button
              type="button"
              onClick={() => { setOpen(false); downloadPdf(contrato); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#0F1819] hover:bg-[#f4f7f8] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
                <FileText size={13} className="text-rose-500" />
              </div>
              Descargar como PDF
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onViewDetails(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#0F1819] hover:bg-[#f4f7f8] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
                <Eye size={13} className="text-sky-500" />
              </div>
              Ver Detalles
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── helpers for the panel ─────────────────────────────────────────────────────

function statusBarColor(estado: EstadoContrato) {
  switch (estado) {
    case "ACTIVO":   return "bg-[#2ECC71]";
    case "RENOVADO": return "bg-sky-400";
    case "EXPIRADO": return "bg-rose-400";
    case "ANULADO":  return "bg-slate-300";
  }
}

function statusBadgeColor(estado: EstadoContrato) {
  switch (estado) {
    case "ACTIVO":   return "bg-[#2ECC71] text-white";
    case "RENOVADO": return "bg-sky-400 text-white";
    case "EXPIRADO": return "bg-rose-400 text-white";
    case "ANULADO":  return "bg-slate-300 text-slate-700";
  }
}

function statusNote(estado: EstadoContrato, fechaFin: string | null): string {
  switch (estado) {
    case "ACTIVO":   return fechaFin ? `Contrato activo — vence el ${formatFecha(fechaFin)}.` : "Contrato activo — sin fecha de vencimiento.";
    case "RENOVADO": return "El contrato ha sido renovado.";
    case "EXPIRADO": return `El contrato expiró el ${formatFecha(fechaFin)}.`;
    case "ANULADO":  return "Este contrato ha sido anulado.";
  }
}

function formatFechaHora(fecha: string | null): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-ES", {
    month: "short", day: "2-digit", year: "numeric",
  }) + " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ── Contract detail side panel ────────────────────────────────────────────────

function ContractDetailPanel({
  contrato,
  empleadoNombre,
  empleadoCodigo,
  onClose,
  onVoidSuccess,
  onContratoRenovado,
}: {
  contrato: Contrato;
  empleadoNombre: string;
  empleadoCodigo: string;
  onClose: () => void;
  onVoidSuccess: (id: string) => void;
  onContratoRenovado?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const estado = badgeEstado(contrato.estado);
  const tipo = etiquetaTipo(contrato.tipo);
  const router = useRouter();
  const puedeRenovar = contrato.estado === "ACTIVO";

  useEffect(() => {
    setMounted(true);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showVoidConfirm) setShowVoidConfirm(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, showVoidConfirm]);

  async function handleVoidConfirm() {
    setVoiding(true);
    try {
      await anularContrato(contrato.id);
      setShowVoidConfirm(false);
      onVoidSuccess(contrato.id);
    } finally {
      setVoiding(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        className="fixed inset-0 z-[9998] bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-[9999] h-full w-[340px] bg-white flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-[#0F1819]">Detalles del Contrato</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#f4f7f8] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5">

          {/* ── Current Status ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">
                Estado Actual
              </span>
              <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${statusBadgeColor(contrato.estado)}`}>
                {estado.label}
              </span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden bg-[#e8eef0]">
              <div className={`h-full w-full ${statusBarColor(contrato.estado)}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${contrato.estado === "ACTIVO" ? "text-[#2ECC71]" : contrato.estado === "RENOVADO" ? "text-sky-500" : contrato.estado === "EXPIRADO" ? "text-rose-500" : "text-slate-400"}`}>
                ✓
              </span>
              <span className="text-xs text-[#576975]">
                {statusNote(contrato.estado, contrato.fechaFin)}
              </span>
            </div>
          </div>

          <div className="h-px bg-[#f0f4f5]" />

          {/* ── Contract Type ── */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">
              Tipo de Contrato
            </span>
            <span className="text-[15px] font-bold text-[#0F1819]">{tipo}</span>
          </div>

          {/* ── Dates ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Fecha de Inicio</span>
              <span className="text-sm font-semibold text-[#0F1819]">{formatFecha(contrato.fechaInicio)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Fecha de Fin</span>
              <span className="text-sm font-semibold text-[#0F1819]">{formatFecha(contrato.fechaFin)}</span>
            </div>
          </div>

          {/* ── Registered By ── */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Registrado Por</span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ECEFF1]">
                <User size={13} className="text-[#576975]" />
              </div>
              <span className="text-sm font-semibold text-[#0F1819]">Departamento de RRHH</span>
            </div>
          </div>

          {/* ── Registration Date ── */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Fecha de Registro</span>
            <span className="text-sm font-semibold text-[#0F1819]">{formatFechaHora(contrato.creadoEn)}</span>
          </div>

          {/* ── Last Modified ── */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Última Modificación</span>
            <span className="text-sm font-semibold text-[#0F1819]">{formatFechaHora(contrato.creadoEn)}</span>
          </div>

          {/* ── Notes ── */}
          {contrato.notas && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Notas</span>
              <p className="text-sm leading-relaxed text-[#576975] italic">
                "{contrato.notas}"
              </p>
            </div>
          )}

          <div className="h-px bg-[#f0f4f5]" />

          {/* ── Action buttons ── */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setRenewOpen(true)}
              disabled={!puedeRenovar}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2ECC71] py-3 text-sm font-semibold text-[#2ECC71] transition-colors hover:bg-[#2ECC71]/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} />
              Renovar Contrato
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/dashboard/empleados/${contrato.idEmpleado}/contratos/${contrato.id}/editar`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400 py-3 text-sm font-semibold text-sky-500 transition-colors hover:bg-sky-50"
            >
              <Pencil size={14} />
              Editar Contrato
            </button>
            <button
              type="button"
              disabled={contrato.estado === "ANULADO"}
              onClick={() => setShowVoidConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400 py-3 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ban size={14} />
              Anular Contrato
            </button>
          </div>
        </div>
      </div>

      {/* ── Void confirmation modal ── */}
      {showVoidConfirm && (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/40" onClick={() => !voiding && setShowVoidConfirm(false)} />
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] p-6 flex flex-col items-center gap-4 pointer-events-auto">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={28} className="text-rose-500" />
              </div>
              <h3 className="text-base font-bold text-[#0F1819] text-center">
                Advertencia de Cancelación de Contrato
              </h3>
              <p className="text-sm text-[#576975] text-center leading-relaxed">
                Estás a punto de cancelar este contrato. Si continúas, esta acción no se podrá deshacer. Una vez confirmada, el estado del empleado dentro de la organización podría verse afectado. Por favor revisa y actualiza el estado del empleado desde el Panel de Empleado si es necesario antes de continuar.
              </p>
              <div className="flex gap-3 w-full mt-1">
                <button
                  type="button"
                  disabled={voiding}
                  onClick={() => setShowVoidConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#d1dde2] text-sm font-semibold text-[#0F1819] hover:bg-[#f4f7f8] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={voiding}
                  onClick={handleVoidConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {voiding ? "Anulando…" : "Continuar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <RenewContractFlow
        isOpen={renewOpen}
        contrato={contrato}
        empleadoNombre={empleadoNombre}
        empleadoCodigo={empleadoCodigo}
        onClose={() => setRenewOpen(false)}
        onSuccess={() => {
          setRenewOpen(false);
          onClose();
          onContratoRenovado?.();
        }}
      />
    </>,
    document.body
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export default function ContratosTable({
  contratos,
  onVoidSuccess,
  empleadoNombre = "",
  empleadoCodigo = "",
  lookupEmpleado,
  onContratoRenovado,
}: ContratosTableProps) {
  const [panelContrato, setPanelContrato] = useState<Contrato | null>(null);
  const modoMultiEmpleado = !!lookupEmpleado;

  const empleadoDelPanel: EmpleadoInfoContrato = panelContrato && lookupEmpleado
    ? lookupEmpleado(panelContrato.idEmpleado) ?? { nombre: empleadoNombre, codigo: empleadoCodigo }
    : { nombre: empleadoNombre, codigo: empleadoCodigo };

  const colSpanVacio = modoMultiEmpleado ? 7 : 6;
  const mensajeVacio = modoMultiEmpleado
    ? "No se encontraron contratos."
    : "Aún no hay contratos registrados para este empleado.";

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e8eef0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f5]">
              {modoMultiEmpleado && (
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Empleado</th>
              )}
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Tipo de Contrato</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Fecha de Inicio</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Fecha de Fin</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Estado</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Validez</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={colSpanVacio} className="px-5 py-10 text-center text-sm text-[#8aa3ad]">
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              contratos.map((c) => {
                const { icon: Icono, color } = obtenerIconoTipo(c.tipo);
                const estado = badgeEstado(c.estado);
                const validez = barraValidez(c.validez);
                const atenuado = c.estado === "ANULADO";
                const empleadoInfo = lookupEmpleado?.(c.idEmpleado);

                return (
                  <tr
                    key={c.id}
                    className={`border-b border-[#f0f4f5] last:border-b-0 hover:bg-[#f8fafb] transition-colors ${atenuado ? "opacity-60" : ""}`}
                  >
                    {modoMultiEmpleado && (
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#0F1819]">
                            {empleadoInfo?.nombre ?? "—"}
                          </span>
                          <span className="text-[11px] text-[#8aa3ad]">
                            #{empleadoInfo?.codigo ?? c.idEmpleado}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <Icono size={16} className={color} />
                        <span className="text-sm font-semibold text-[#0F1819]">{etiquetaTipo(c.tipo)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#0F1819]">{formatFecha(c.fechaInicio)}</td>
                    <td className="px-5 py-4 text-sm text-[#8aa3ad]">{formatFecha(c.fechaFin)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${estado.cls}`}>
                        {estado.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#8aa3ad] tracking-wider">{validez.label}</span>
                        <div className="w-20 h-1 rounded-full overflow-hidden bg-[#e8eef0]">
                          <div className={`h-full ${validez.color}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RowMenu contrato={c} onViewDetails={() => setPanelContrato(c)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {panelContrato && (
        <ContractDetailPanel
          contrato={panelContrato}
          empleadoNombre={empleadoDelPanel.nombre}
          empleadoCodigo={empleadoDelPanel.codigo}
          onClose={() => setPanelContrato(null)}
          onVoidSuccess={(id) => {
            setPanelContrato(null);
            onVoidSuccess?.(id);
          }}
          onContratoRenovado={onContratoRenovado}
        />
      )}
    </>
  );
}
