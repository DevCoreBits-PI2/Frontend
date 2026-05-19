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

interface ContratosTableProps {
  contratos: Contrato[];
  onVoidSuccess?: (id: string) => void;
  empleadoNombre?: string;
  empleadoCodigo?: string;
  onContratoRenovado?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function obtenerIconoTipo(tipo: TipoContrato) {
  switch (tipo) {
    case "INDEFINIDO":   return { icon: ShieldCheck,  color: "text-emerald-500" };
    case "FIJO":         return { icon: CalendarClock, color: "text-sky-500"    };
    case "SERVICIO":     return { icon: CircleSlash,   color: "text-slate-400"  };
    case "TIEMPO_PARCIAL": return { icon: CalendarX2,  color: "text-amber-500"  };
  }
}

function etiquetaTipo(tipo: TipoContrato): string {
  switch (tipo) {
    case "INDEFINIDO":    return "Indefinite Term";
    case "FIJO":          return "Fixed Term";
    case "SERVICIO":      return "Service Contract";
    case "TIEMPO_PARCIAL":return "Part-time";
  }
}

function badgeEstado(estado: EstadoContrato) {
  switch (estado) {
    case "ACTIVO":   return { label: "Active",  cls: "bg-emerald-50 text-emerald-600"  };
    case "RENOVADO": return { label: "Renewed", cls: "bg-sky-50 text-sky-600"          };
    case "EXPIRADO": return { label: "Expired", cls: "bg-rose-50 text-rose-500"        };
    case "ANULADO":  return { label: "Voided",  cls: "bg-slate-100 text-slate-500"     };
  }
}

function barraValidez(validez: ValidezContrato) {
  switch (validez) {
    case "ONGOING":   return { label: "ONGOING",   color: "bg-emerald-500" };
    case "COMPLETED": return { label: "COMPLETED", color: "bg-sky-400"     };
    case "EXPIRED":   return { label: "EXPIRED",   color: "bg-rose-400"    };
    case "VOIDED":    return { label: "VOIDED",    color: "bg-slate-300"   };
  }
}


function formatFecha(fecha: string | null): string {
  if (!fecha) return "No expiration";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
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
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Contract ${c.id}</title>
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
    <div><h1>Contract Details</h1><p>Reference ID: ${c.id}</p></div>
    <span class="badge ${badgeClass}">${badgeEstado(c.estado).label}</span>
  </div>
  <div class="grid">
    <div class="field"><label>Contract Type</label><p>${etiquetaTipo(c.tipo)}</p></div>
    <div class="field"><label>Base Salary</label><p>${c.salarioBase.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</p></div>
    <div class="field"><label>Start Date</label><p>${formatFecha(c.fechaInicio)}</p></div>
    <div class="field"><label>End Date</label><p>${formatFecha(c.fechaFin)}</p></div>
    <div class="field"><label>Registration Date</label><p>${formatFecha(c.creadoEn)}</p></div>
    <div class="field"><label>Status</label><p>${badgeEstado(c.estado).label}</p></div>
  </div>
  ${c.notas ? `<div class="notes">"${c.notas}"</div>` : ""}
  <div class="footer">Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })} · HR Management System</div>
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
              Download as PDF
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onViewDetails(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#0F1819] hover:bg-[#f4f7f8] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
                <Eye size={13} className="text-sky-500" />
              </div>
              View Details
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
    case "ACTIVO":   return fechaFin ? `Active contract — expires ${formatFecha(fechaFin)}.` : "Active contract — No expiration date.";
    case "RENOVADO": return "Contract has been renewed.";
    case "EXPIRADO": return `Contract expired on ${formatFecha(fechaFin)}.`;
    case "ANULADO":  return "This contract has been voided.";
  }
}

function formatFechaHora(fecha: string | null): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("en-US", {
    month: "short", day: "2-digit", year: "numeric",
  }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
}) {
  const [mounted, setMounted] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voiding, setVoiding] = useState(false);
  onContratoRenovado?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
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
          <h2 className="text-base font-bold text-[#0F1819]">Contract Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
                Current Status
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
              Contract Type
            </span>
            <span className="text-[15px] font-bold text-[#0F1819]">{tipo}</span>
          </div>

          {/* ── Dates ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Start Date</span>
              <span className="text-sm font-semibold text-[#0F1819]">{formatFecha(contrato.fechaInicio)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">End Date</span>
              <span className="text-sm font-semibold text-[#0F1819]">{formatFecha(contrato.fechaFin)}</span>
            </div>
          </div>

          {/* ── Registered By ── */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Registered By</span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ECEFF1]">
                <User size={13} className="text-[#576975]" />
              </div>
              <span className="text-sm font-semibold text-[#0F1819]">HR Department</span>
            </div>
          </div>

          {/* ── Registration Date ── */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Registration Date</span>
            <span className="text-sm font-semibold text-[#0F1819]">{formatFechaHora(contrato.creadoEn)}</span>
          </div>

          {/* ── Last Modified ── */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Last Modified</span>
            <span className="text-sm font-semibold text-[#0F1819]">{formatFechaHora(contrato.creadoEn)}</span>
          </div>

          {/* ── Notes ── */}
          {contrato.notas && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8aa3ad]">Notes</span>
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
              Renew contract
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
              Edit Contract
            </button>
            <button
              type="button"
              disabled={contrato.estado === "ANULADO"}
              onClick={() => setShowVoidConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400 py-3 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Ban size={14} />
              Void Contract
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
                Contract Cancellation Warning
              </h3>
              <p className="text-sm text-[#576975] text-center leading-relaxed">
                You are about to cancel this contract. If you proceed, this action cannot be undone. Once confirmed, the employee&apos;s status within the organization could be affected. Please review and update the employee&apos;s status from the Employee Panel if necessary before proceeding.
              </p>
              <div className="flex gap-3 w-full mt-1">
                <button
                  type="button"
                  disabled={voiding}
                  onClick={() => setShowVoidConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#d1dde2] text-sm font-semibold text-[#0F1819] hover:bg-[#f4f7f8] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={voiding}
                  onClick={handleVoidConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {voiding ? "Voiding…" : "Continue"}
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

export default function ContratosTable({ contratos, onVoidSuccess }: ContratosTableProps) {
export default function ContratosTable({
  contratos,
  empleadoNombre = "",
  empleadoCodigo = "",
  onContratoRenovado,
}: ContratosTableProps) {
  const [panelContrato, setPanelContrato] = useState<Contrato | null>(null);

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e8eef0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f5]">
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Contract Type</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Start Date</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">End Date</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Validity</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8aa3ad] uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contratos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#8aa3ad]">
                  No contracts registered for this employee yet.
                </td>
              </tr>
            ) : (
              contratos.map((c) => {
                const { icon: Icono, color } = obtenerIconoTipo(c.tipo);
                const estado = badgeEstado(c.estado);
                const validez = barraValidez(c.validez);
                const atenuado = c.estado === "ANULADO";

                return (
                  <tr
                    key={c.id}
                    className={`border-b border-[#f0f4f5] last:border-b-0 hover:bg-[#f8fafb] transition-colors ${atenuado ? "opacity-60" : ""}`}
                  >
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
          empleadoNombre={empleadoNombre}
          empleadoCodigo={empleadoCodigo}
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
