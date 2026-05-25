"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload } from "lucide-react";
import { FuncionarioBase } from "@/types/funcionario";
import ToastNotification from "@/components/ToastNotification";

interface EditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (data: Partial<FuncionarioBase>) => void;
  initialData?: Partial<FuncionarioBase>;
}

export default function EditInfoModal({
  isOpen,
  onClose,
  userId: _userId,
  onSuccess,
  initialData = {},
}: EditInfoModalProps) {
  const [nombre, setNombre] = useState(initialData.nombre ?? "");
  const [apellidos, setApellidos] = useState(initialData.apellidos ?? "");
  const [correo, setCorreo] = useState(initialData.correo ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es requerido.";
    if (!apellidos.trim()) newErrors.apellidos = "Los apellidos son requeridos.";
    if (!correo.trim()) newErrors.correo = "El correo electrónico es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      newErrors.correo = "Ingresa un correo electrónico válido.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      onSuccess({ nombre, apellidos, correo });
      setShowToast(true);
      onClose();
    } catch {
      // error handling delegated to caller
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !showToast) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f4f5]">
              <div>
                <h2 className="text-base font-semibold text-[#0F1819]">Editar información</h2>
                <p className="text-xs text-[#8aa3ad] mt-0.5">Actualiza tus datos personales</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-[#8aa3ad] hover:text-[#0F1819] hover:bg-[#ECEFF1] rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Notice */}
            <div className="mx-6 mt-5 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
                <circle cx="10" cy="10" r="9" stroke="#D97706" strokeWidth="1.5" />
                <path d="M10 6v4" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="13.5" r="0.75" fill="#D97706" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-800">Formulario de edición</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Solo puedes modificar los campos habilitados en este formulario.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 flex flex-col gap-4">

              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Jonathan"
                  autoComplete="given-name"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] placeholder:text-[#c5d5db] transition-colors ${
                    errors.nombre ? "border-rose-400" : "border-[#d1dde2]"
                  }`}
                />
                {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
              </div>

              {/* Apellidos */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Doe Pérez"
                  autoComplete="family-name"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] placeholder:text-[#c5d5db] transition-colors ${
                    errors.apellidos ? "border-rose-400" : "border-[#d1dde2]"
                  }`}
                />
                {errors.apellidos && <p className="text-xs text-rose-500">{errors.apellidos}</p>}
              </div>

              {/* Correo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@correo.com"
                  autoComplete="email"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-[#0F1819] placeholder:text-[#c5d5db] transition-colors ${
                    errors.correo ? "border-rose-400" : "border-[#d1dde2]"
                  }`}
                />
                {errors.correo && <p className="text-xs text-rose-500">{errors.correo}</p>}
              </div>

              {/* Foto de perfil */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                  Foto de perfil
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Subir foto de perfil"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[100px] transition-colors ${
                    isDragging
                      ? "border-[#203D47] bg-[#203D47]/5"
                      : "border-[#d1dde2] bg-[#f8fafb] hover:border-[#8aa3ad]"
                  }`}
                >
                  {photoPreview ? (
                    <>
                      <img
                        src={photoPreview}
                        alt="Vista previa"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#203D47]"
                      />
                      <span className="text-xs font-medium text-[#203D47]">{photo?.name}</span>
                      <span className="text-xs text-[#8aa3ad]">Haz clic para cambiar la foto</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-[#8aa3ad]" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#0F1819]">Arrastra tu foto aquí</p>
                        <p className="text-xs text-[#8aa3ad] mt-0.5">
                          o haz clic para explorar · PNG, JPG, WEBP hasta 5 MB
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-6 pb-5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-[#8aa3ad] hover:text-[#0F1819] border border-[#d1dde2] hover:border-[#8aa3ad] rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>

          </div>
        </div>
      )}

      <ToastNotification
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        title="Información editada con éxito"
        message="Los datos fueron actualizados"
      />
    </>
  );
}
