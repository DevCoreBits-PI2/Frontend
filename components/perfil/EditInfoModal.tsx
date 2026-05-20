'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UserInfo {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  photo: File | null;
}

interface EditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserInfo) => Promise<void>;
  initialData?: Partial<UserInfo>;
}

const UploadIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
    <path
      d="M13 27s-5 0-5-5c0-4.5 3.5-6 5-6 0-4.5 3-8 6-8s6 3.5 6 8c1.5 0 5 1.5 5 6 0 4.5-5 5-5 5"
      stroke="#8aa3ad"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M23.5 27L19 22.5 14.5 27" stroke="#8aa3ad" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 22.5V33" stroke="#8aa3ad" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export default function EditInfoModal({
  isOpen,
  onClose,
  onSave,
  initialData = {},
}: EditInfoModalProps) {
  const [fullName, setFullName] = useState(initialData.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber ?? '');
  const [emailAddress, setEmailAddress] = useState(initialData.emailAddress ?? '');
  const [photo, setPhoto] = useState<File | null>(initialData.photo ?? null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFullName(initialData.fullName ?? '');
    setPhoneNumber(initialData.phoneNumber ?? '');
    setEmailAddress(initialData.emailAddress ?? '');
    setPhoto(initialData.photo ?? null);
    setErrors({});
  }, [isOpen, initialData.fullName, initialData.phoneNumber, initialData.emailAddress, initialData.photo]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'El nombre es requerido.';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'El teléfono es requerido.';
    else if (!/^\+?[\d\s\-().]{7,20}$/.test(phoneNumber)) newErrors.phoneNumber = 'Teléfono inválido.';
    if (!emailAddress.trim()) newErrors.emailAddress = 'El correo es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) newErrors.emailAddress = 'Correo inválido.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: 'Máximo 5 MB.' }));
      return;
    }
    setErrors((p) => { const n = { ...p }; delete n.photo; return n; });
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, [photoPreview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSave({ fullName, phoneNumber, emailAddress, photo });
      onClose();
    } catch {
      // error delegado al caller
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = (hasError?: string) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-[#0F1819] outline-none transition
     bg-emerald-50 placeholder:text-[#8aa3ad]
     focus:ring-2 focus:ring-[#2ECC71]/25 focus:border-[#2ECC71]
     ${hasError ? 'border-red-400 bg-red-50' : 'border-emerald-200'}`;

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#0F1819]/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* Banner de advertencia */}
          <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3.5">
            <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-400">
              <span className="text-[10px] font-bold leading-none text-white">i</span>
            </div>
            <div>
              <p id="modal-title" className="text-sm font-bold text-amber-800">Formulario de Edición</p>
              <p className="text-xs text-amber-600">Solo puedes editar estos campos</p>
            </div>
          </div>

          {/* Campos */}
          <div className="flex flex-col gap-4 p-5">

            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1E333A]">Nombre Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jonny Doe"
                autoComplete="name"
                className={inputClass(errors.fullName)}
              />
              {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1E333A]">Teléfono</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+57 310 000 0000"
                autoComplete="tel"
                className={inputClass(errors.phoneNumber)}
              />
              {errors.phoneNumber && <span className="text-xs text-red-500">{errors.phoneNumber}</span>}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1E333A]">Correo Electrónico</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="usuario@correo.com"
                autoComplete="email"
                className={inputClass(errors.emailAddress)}
              />
              {errors.emailAddress && <span className="text-xs text-red-500">{errors.emailAddress}</span>}
            </div>

            {/* Upload Photo */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1E333A]">Subir Foto</label>
              <div
                role="button"
                tabIndex={0}
                aria-label="Subir foto"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-7 transition-colors ${
                  isDragging
                    ? 'border-[#2ECC71] bg-emerald-50'
                    : 'border-[#8aa3ad]/50 bg-[#f8fafb] hover:border-[#8aa3ad]'
                }`}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Vista previa"
                    className="h-16 w-16 rounded-full object-cover border-2 border-[#2ECC71]"
                  />
                ) : (
                  <UploadIcon />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
              {errors.photo && <span className="text-xs text-red-500">{errors.photo}</span>}
            </div>

            {/* Botón Continue */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-60"
            >
              {isLoading ? 'Guardando...' : 'Continuar →'}
            </button>

            {/* Cancel Edit */}
            <button
              onClick={onClose}
              className="text-center text-sm text-[#8aa3ad] underline underline-offset-2 transition-colors hover:text-[#203D47]"
            >
              Cancelar Edición
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
