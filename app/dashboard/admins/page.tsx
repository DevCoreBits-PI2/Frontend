"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Mail, Trash2, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";

import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  bloquearUsuario,
  crearAdministrador,
  desbloquearUsuario,
  listarAdministradores,
} from "@/services/adminService";
import { translateBackendError } from "@/lib/api/translateError";
import NuevoAdminModal from "@/components/admins/NuevoAdminModal";
import type { AdminDto } from "@/types/api/admin";

export default function AdministradoresPage() {
  return (
    <RouteGuard requireAdmin>
      <AdministradoresContenido />
    </RouteGuard>
  );
}

function AdministradoresContenido() {
  const { adminProfile } = useAuth();
  const [admins, setAdmins] = useState<AdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionId, setAccionId] = useState<number | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await listarAdministradores();
      setAdmins(lista);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(translateBackendError(raw) || "No se pudo cargar la lista de administradores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleBlock = async (id: number, accion: "bloquear" | "desbloquear") => {
    if (id === adminProfile?.id) {
      toast.error("No podés bloquear tu propia cuenta de administrador.");
      return;
    }
    setAccionId(id);
    try {
      if (accion === "bloquear") await bloquearUsuario(id);
      else await desbloquearUsuario(id);
      toast.success(
        accion === "bloquear" ? "Administrador bloqueado." : "Administrador desbloqueado.",
      );
      await fetchAdmins();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      toast.error(translateBackendError(raw) || `No se pudo ${accion} el administrador.`);
    } finally {
      setAccionId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f8]">
      <Header user={null} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#0F1819]">Administradores</h1>
          <p className="text-sm text-[#8aa3ad] mt-0.5">
            Gestiona quienes tienen acceso administrativo completo al sistema.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#576975]">
            <ShieldCheck size={18} className="text-emerald-500" />
            <p className="text-sm">
              {admins.length === 0
                ? "Aún no hay administradores registrados."
                : `${admins.length} ${admins.length === 1 ? "administrador" : "administradores"} con acceso al sistema.`}
            </p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400"
          >
            <UserPlus size={16} />
            Nuevo administrador
          </button>
        </div>

        {loading && <LoadingSpinner mensaje="Cargando administradores..." />}

        {error && !loading && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border border-[#e4ebee] bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#f0f4f5] bg-[#fafcfc]">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Nombre</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Correo</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#8aa3ad]">Edad</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#8aa3ad] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => {
                  const esYo = a.id === adminProfile?.id;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-[#f4f7f8] last:border-b-0 hover:bg-[#fafcfc]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#203D47] to-[#0F1819] text-xs font-bold text-white">
                            {`${a.name?.charAt(0) ?? ""}${a.last_name?.charAt(0) ?? ""}`.toUpperCase() || "A"}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0F1819]">
                              {a.name} {a.last_name}
                              {esYo && (
                                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                                  Vos
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#576975]">
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} className="text-[#8aa3ad]" />
                          {a.email}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#576975]">{a.age || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={esYo || accionId === a.id}
                            onClick={() => handleBlock(a.id, "bloquear")}
                            title={esYo ? "No podés bloquearte a vos mismo" : "Bloquear administrador"}
                            className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          >
                            <Lock size={14} />
                          </button>
                          <button
                            disabled={esYo || accionId === a.id}
                            onClick={() => handleBlock(a.id, "desbloquear")}
                            title={esYo ? "No podés desbloquearte a vos mismo" : "Desbloquear administrador"}
                            className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          >
                            <Unlock size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {admins.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-[#8aa3ad]">
                <Trash2 size={20} className="text-[#d1dde2]" />
                <p>Aún no hay administradores. Creá el primero con el botón superior.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <NuevoAdminModal
        isOpen={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={async () => {
          setModalAbierto(false);
          await fetchAdmins();
          toast.success("Administrador creado correctamente. Se envió la invitación al correo.");
        }}
        crear={crearAdministrador}
      />
    </div>
  );
}
