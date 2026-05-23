"use client";

import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import { translateBackendError } from "@/lib/api/translateError";
import type { AdminDto, CreateAdminPayload } from "@/types/api/admin";

interface Props {
  isOpen: boolean;
  onCerrar: () => void;
  onCreado: () => void | Promise<void>;
  crear: (payload: CreateAdminPayload) => Promise<AdminDto>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NuevoAdminModal({ isOpen, onCerrar, onCreado, crear }: Props) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [edad, setEdad] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string; apellido?: string; email?: string; edad?: string }>({});

  if (!isOpen) return null;

  const validar = () => {
    const e: typeof errores = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio.";
    else if (nombre.trim().length < 2) e.nombre = "Mínimo 2 caracteres.";
    if (!apellido.trim()) e.apellido = "El apellido es obligatorio.";
    else if (apellido.trim().length < 2) e.apellido = "Mínimo 2 caracteres.";
    if (!email.trim()) e.email = "El correo es obligatorio.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Formato de correo inválido.";
    const n = Number(edad);
    if (!edad.trim()) e.edad = "La edad es obligatoria.";
    else if (!Number.isInteger(n) || n < 18 || n > 99) e.edad = "Debe ser un entero entre 18 y 99.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setEdad("");
    setErrores({});
  };

  const submit = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      await crear({
        email: email.trim(),
        name: nombre.trim(),
        last_name: apellido.trim(),
        age: Number(edad),
      });
      reset();
      await onCreado();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      toast.error(translateBackendError(raw) || "No se pudo crear el administrador.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-[#f0f4f5] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-base font-semibold text-[#0F1819]">Nuevo administrador</h2>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-[#8aa3ad] transition-colors hover:bg-[#f4f7f8] hover:text-[#0F1819]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0F1819]">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); setErrores((p) => ({ ...p, nombre: undefined })); }}
                placeholder="Nombre"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                  errores.nombre ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
                }`}
              />
              {errores.nombre && <p className="text-xs text-rose-500">{errores.nombre}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0F1819]">
                Apellido <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => { setApellido(e.target.value); setErrores((p) => ({ ...p, apellido: undefined })); }}
                placeholder="Apellido"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                  errores.apellido ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
                }`}
              />
              {errores.apellido && <p className="text-xs text-rose-500">{errores.apellido}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">
              Correo electrónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrores((p) => ({ ...p, email: undefined })); }}
              placeholder="admin@empresa.com"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                errores.email ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
              }`}
            />
            {errores.email && <p className="text-xs text-rose-500">{errores.email}</p>}
            <p className="text-xs text-[#8aa3ad]">Recibirá un correo de invitación con su contraseña inicial.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0F1819]">
              Edad <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={18}
              max={99}
              value={edad}
              onChange={(e) => { setEdad(e.target.value); setErrores((p) => ({ ...p, edad: undefined })); }}
              placeholder="30"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0F1819] focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                errores.edad ? "border-rose-400 bg-rose-50" : "border-[#d1dde2]"
              }`}
            />
            {errores.edad && <p className="text-xs text-rose-500">{errores.edad}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#f0f4f5] px-6 py-4">
          <button
            onClick={() => { reset(); onCerrar(); }}
            className="rounded-lg border border-[#d1dde2] px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819]"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={guardando}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-60"
          >
            {guardando ? "Creando..." : "Crear administrador"}
          </button>
        </div>
      </div>
    </div>
  );
}
