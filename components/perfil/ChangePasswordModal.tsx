'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
}

const requirementList = [
  { key: 'length', label: 'Mínimo 8 caracteres', test: (value: string) => value.length >= 8 },
  { key: 'uppercase', label: 'Una mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'number', label: 'Un número', test: (value: string) => /\d/.test(value) },
  { key: 'special', label: 'Un carácter especial', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export default function ChangePasswordModal({ isOpen, onClose, onSave }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrors({});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const strength = useMemo(() => {
    const met = requirementList.filter((item) => item.test(newPassword)).length;
    if (!newPassword) return { label: 'Weak', value: 0, color: 'bg-slate-200' };
    if (met <= 1) return { label: 'Weak', value: 1, color: 'bg-rose-400' };
    if (met === 2) return { label: 'Fair', value: 2, color: 'bg-amber-400' };
    if (met === 3) return { label: 'Good', value: 3, color: 'bg-emerald-400' };
    return { label: 'Strong', value: 4, color: 'bg-emerald-500' };
  }, [newPassword]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!currentPassword.trim()) nextErrors.currentPassword = 'La contraseña actual es obligatoria.';
    if (!newPassword.trim()) nextErrors.newPassword = 'La nueva contraseña es obligatoria.';
    if (newPassword && newPassword.length < 8) nextErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres.';
    if (newPassword && !/[A-Z]/.test(newPassword)) nextErrors.newPassword = 'La contraseña debe incluir una letra mayúscula.';
    if (newPassword && !/\d/.test(newPassword)) nextErrors.newPassword = 'La contraseña debe incluir un número.';
    if (newPassword && !/[^A-Za-z0-9]/.test(newPassword)) nextErrors.newPassword = 'La contraseña debe incluir un carácter especial.';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSave({ currentPassword, newPassword, confirmPassword });
      onClose();
    } catch {
      // handled by caller if needed
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = (hasError?: string) =>
    `w-full rounded-lg border px-4 py-2.5 pr-11 text-sm text-[#0F1819] outline-none transition bg-[#f8fafb] placeholder:text-[#8aa3ad] focus:ring-2 focus:ring-[#2ECC71]/25 focus:border-[#2ECC71] ${hasError ? 'border-red-400 bg-red-50' : 'border-[#e8eef0]'}`;

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#0F1819]/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-[#edf2f3] px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1819] text-white">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F1819]">Cambiar contraseña</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={inputClass(errors.currentPassword)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] hover:text-[#0F1819]"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.currentPassword && <span className="text-xs text-red-500">{errors.currentPassword}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={inputClass(errors.newPassword)}
                  autoComplete="new-password"
                  placeholder="Precisión2024!"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] hover:text-[#0F1819]"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && <span className="text-xs text-red-500">{errors.newPassword}</span>}
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#203D47]">Seguridad de la contraseña</span>
                <span className="font-semibold text-emerald-500">{strength.label}</span>
              </div>
              <div className="flex h-1.5 gap-1.5 overflow-hidden rounded-full bg-[#e8eef0]">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={index}
                    className={`flex-1 rounded-full ${index < strength.value ? strength.color : 'bg-[#e8eef0]'}`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#f8fafb] p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#203D47]">Requisitos de seguridad</p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#203D47]">
                {requirementList.map((item) => {
                  const met = item.test(newPassword);
                  return (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${met ? 'bg-[#2ECC71] text-white' : 'border border-[#c5d5db] bg-white text-transparent'}`}>
                        ✓
                      </span>
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8aa3ad]">Confirmar nueva contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass(errors.confirmPassword)}
                  autoComplete="new-password"
                  placeholder="Confirma tu nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8aa3ad] hover:text-[#0F1819]"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword}</span>}
            </div>

            <div className="mt-1 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#203D47] hover:bg-[#f4f7f8]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-lg bg-[#0F1819] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#203D47] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
