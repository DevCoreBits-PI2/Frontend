"use client";
import React, { useRef, useState } from "react";
import { DOCUMENT_TYPES } from "../../../services/registerEmployeeService";

interface Props {
  data: any;
  onChange: (patch: any) => void;
  /** Errores por campo (provistos por el wizard tras validar al avanzar). */
  errors?: Record<string, string>;
}

// Helpers de estilo consistentes entre campos: borde rojo si hay error.
const baseInput =
  "w-full px-4 py-3 border-2 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-[#2ECC71] text-gray-700";
const inputClass = (hasError?: boolean) =>
  `${baseInput} ${hasError ? "border-red-400 bg-red-50" : "border-gray-300"}`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

const PersonalDataStep: React.FC<Props> = ({ data, onChange, errors = {} }) => {
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(data.photo);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setPhotoPreview(res);
      onChange({ photo: res });
    };
    reader.readAsDataURL(file);
  };

  const handleDocs = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).map((f) => ({ name: f.name, size: f.size, type: f.type }));
    onChange({ files: [...(data.files || []), ...arr] });
  };

  const removeDoc = (i: number) => {
    const next = (data.files || []).filter((_: any, idx: number) => idx !== i);
    onChange({ files: next });
  };

  const bytesToKb = (n: number) => `${Math.round(n / 1024)} KB`;

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Left Column - Personal Info */}
      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
            Nombre Completo
          </label>
          <input
            type="text"
            value={data.fullName || ""}
            onChange={(e) => onChange({ fullName: e.target.value })}
            className={inputClass(!!errors.fullName)}
            placeholder="Jonathan Doe"
          />
          <FieldError message={errors.fullName} />
        </div>

        {/* Document Type & Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
              Tipo de Documento
            </label>
            <select
              value={data.documentType || ""}
              onChange={(e) => onChange({ documentType: e.target.value })}
              className={inputClass(!!errors.documentType)}
            >
              <option value="">Seleccionar tipo</option>
              {DOCUMENT_TYPES.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
            <FieldError message={errors.documentType} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
              Número de Documento
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={data.documentNumber || ""}
              onChange={(e) => onChange({ documentNumber: e.target.value })}
              className={inputClass(!!errors.documentNumber)}
              placeholder="12345678"
            />
            <FieldError message={errors.documentNumber} />
          </div>
        </div>

        {/* Email — el backend no acepta teléfono en InviteUserDto. Si en el
            futuro se agrega, recuperar el input desde el historial git. */}
        <div>
          <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={data.email || ""}
            onChange={(e) => onChange({ email: e.target.value })}
            className={inputClass(!!errors.email)}
            placeholder="john.doe@example.com"
          />
          <FieldError message={errors.email} />
        </div>

        {/* Edad — requerida por el backend (@IsInt). El form no la pedía y se */}
        {/* guardaba como 0 por defecto. */}
        <div>
          <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
            Edad
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={data.age ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onChange({ age: v === "" ? undefined : Number(v) });
            }}
            className={inputClass(!!errors.age)}
            placeholder="30"
          />
          <FieldError message={errors.age} />
        </div>

        {/* Documents */}
        <div>
          <label className="block text-xs font-semibold text-[#203D47] uppercase mb-3">
            Subir Documentos del Empleado
          </label>
          <div
            onClick={() => docsInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-[#8aa3ad] rounded-md cursor-pointer hover:bg-[#ECEFF1] transition text-center"
          >
            <div className="text-sm text-[#8aa3ad] mb-2">
              Arrastra y suelta los archivos aquí o haz clic para explorar
            </div>
            <div className="text-xs text-[#8aa3ad]">
              PDF, DOCX, PNG, JPG — máximo 10MB cada uno
            </div>
            <input
              ref={docsInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.docx,image/png,image/jpeg"
              onChange={(e) => handleDocs(e.target.files)}
            />
          </div>

          {/* Files List */}
          {(data.files || []).length > 0 && (
            <div className="mt-4 space-y-2">
              {(data.files || []).map((f: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[#ECEFF1] rounded border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-[#203D47]">
                      {f.name.split(".").pop()?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-[#203D47] font-medium">{f.name}</div>
                      <div className="text-xs text-[#8aa3ad]">
                        {bytesToKb(f.size)} • Listo para subir
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDoc(idx)}
                    className="ml-2 text-[#8aa3ad] hover:text-red-500 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default PersonalDataStep;
