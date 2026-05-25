'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

// Sólo se permiten editar los campos que el backend acepta:
//   - age:        integer 18-100 (PATCH /employees/updateUser/:id)
//   - photoFile:  archivo de imagen (PATCH /employees/upload-profile-image,
//                 sube a Cloudinary y persiste photo_url en BD)
//
// El backend NO permite "borrar" la foto: el DTO UpdateProfileDto valida
// @IsUrl en photo_url, así que no se puede setear vacía o null. Por eso el
// modal solo ofrece "Cambiar foto" (reemplazar), no "Quitar foto". Nombre
// y correo se muestran como información de solo lectura.

export interface EditInfoFormValues {
  edad: number | null;
  photoFile: File | null;
}

interface ReadOnlyInfo {
  fullName: string;
  emailAddress: string;
}

interface EditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditInfoFormValues) => Promise<void>;
  readOnly: ReadOnlyInfo;
  initialValues: {
    edad: number | null;
    currentPhotoUrl: string;
  };
  /** Si es `false`, oculta la sección de subir/cambiar foto. Útil cuando un
   *  admin edita a OTRO empleado: el backend solo permite al propio empleado
   *  subir su foto (el endpoint `upload-profile-image` resuelve el id desde
   *  el JWT del solicitante). Default: true (modo self-edit). */
  allowPhotoUpload?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function EditInfoModal({
  isOpen,
  onClose,
  onSave,
  readOnly,
  initialValues,
  allowPhotoUpload = true,
}: EditInfoModalProps) {
  const [edad, setEdad] = useState<string>(
    initialValues.edad != null ? String(initialValues.edad) : '',
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEdad(initialValues.edad != null ? String(initialValues.edad) : '');
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrors({});
  }, [isOpen, initialValues.edad, initialValues.currentPhotoUrl]);

  // Limpia object URLs creadas para preview.
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

  const handleFile = useCallback((file: File) => {
    setErrors((p) => { const n = { ...p }; delete n.photo; return n; });
    if (!file.type.startsWith('image/')) {
      setErrors((p) => ({ ...p, photo: 'Solo se permiten imágenes.' }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrors((p) => ({ ...p, photo: 'La imagen no puede pesar más de 5 MB.' }));
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, [photoPreview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const validate = (): EditInfoFormValues | null => {
    const next: Record<string, string> = {};

    let parsedEdad: number | null = null;
    if (edad.trim()) {
      const n = Number(edad);
      if (!Number.isInteger(n)) next.edad = 'La edad debe ser un número entero.';
      else if (n < 18 || n > 100) next.edad = 'La edad debe estar entre 18 y 100.';
      else parsedEdad = n;
    }

    setErrors((p) => ({ ...p, edad: next.edad ?? '' }));
    if (next.edad) return null;

    return { edad: parsedEdad, photoFile };
  };

  const handleSubmit = async () => {
    const values = validate();
    if (!values) return;
    setIsLoading(true);
    try {
      await onSave(values);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar.';
      setErrors((p) => ({ ...p, form: message }));
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

  const readOnlyClass =
    'w-full rounded-lg border border-[#e8eef0] bg-[#f4f7f8] px-4 py-2.5 text-sm text-[#5b6f78] cursor-not-allowed';

  const previewSrc = photoPreview ?? (initialValues.currentPhotoUrl || null);

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

          <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3.5">
            <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-400">
              <span className="text-[10px] font-bold leading-none text-white">i</span>
            </div>
            <div>
              <p id="modal-title" className="text-sm font-bold text-amber-800">Editar perfil</p>
              <p className="text-xs text-amber-600">Solo edad y foto son editables desde aquí.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5">

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1E333A]">Nombre completo</label>
              <input
                type="text"
                value={readOnly.fullName}
                readOnly
                disabled
                className={readOnlyClass}
              />
              <span className="text-[11px] text-[#8aa3ad]">Solo lo modifica un administrador.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1E333A]">Correo electrónico</label>
              <input
                type="email"
                value={readOnly.emailAddress}
                readOnly
                disabled
                className={readOnlyClass}
              />
              <span className="text-[11px] text-[#8aa3ad]">Se gestiona desde la sección de cuenta.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="edit-edad" className="text-sm font-medium text-[#1E333A]">Edad</label>
              <input
                id="edit-edad"
                type="number"
                inputMode="numeric"
                min={18}
                max={100}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                placeholder="Ej: 30"
                className={inputClass(errors.edad)}
              />
              {errors.edad && <span className="text-xs text-red-500">{errors.edad}</span>}
            </div>

            {allowPhotoUpload ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#1E333A]">Foto de perfil</label>

                {previewSrc ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                    <img
                      src={previewSrc}
                      alt="Vista previa"
                      className="h-16 w-16 rounded-full object-cover border-2 border-emerald-200"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="self-start text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Cambiar foto
                      </button>
                      <span className="text-[11px] text-[#8aa3ad]">
                        Sube una nueva imagen para reemplazar la actual.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Subir foto"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 transition-colors ${
                      isDragging
                        ? 'border-[#2ECC71] bg-emerald-50'
                        : 'border-[#8aa3ad]/50 bg-[#f8fafb] hover:border-[#8aa3ad]'
                    }`}
                  >
                    <Upload size={28} className="text-[#8aa3ad]" />
                    <p className="text-xs text-[#5b6f78]">
                      Arrastra una imagen o <span className="font-semibold text-emerald-600">haz clic para subirla</span>
                    </p>
                    <p className="text-[10px] text-[#8aa3ad]">JPG, PNG o WEBP · hasta 5 MB</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {errors.photo && <span className="text-xs text-red-500">{errors.photo}</span>}
              </div>
            ) : (
              previewSrc && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[#1E333A]">Foto de perfil</label>
                  <div className="flex items-center gap-3 rounded-xl border border-[#e8eef0] bg-[#fafcfc] p-3">
                    <img
                      src={previewSrc}
                      alt="Foto actual"
                      className="h-16 w-16 rounded-full object-cover border border-[#e8eef0]"
                    />
                    <p className="text-[11px] text-[#8aa3ad] leading-relaxed">
                      Solo el propio empleado puede cambiar su foto desde su perfil.
                    </p>
                  </div>
                </div>
              )
            )}

            {errors.form && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{errors.form}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-60"
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <button
              onClick={onClose}
              className="text-center text-sm text-[#8aa3ad] underline underline-offset-2 transition-colors hover:text-[#203D47]"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
