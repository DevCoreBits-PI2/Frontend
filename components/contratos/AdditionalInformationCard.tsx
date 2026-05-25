"use client";

import { useRef } from "react";
import { ClipboardEdit, CloudUpload, FileText, X } from "lucide-react";

interface AdditionalInformationCardProps {
  notas: string;
  documento: File | null;
  onNotasChange: (valor: string) => void;
  onDocumentoChange: (file: File | null) => void;
}

export default function AdditionalInformationCard({
  notas,
  documento,
  onNotasChange,
  onDocumentoChange,
}: AdditionalInformationCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const manejarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (archivo) onDocumentoChange(archivo);
  };

  const manejarDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const archivo = event.dataTransfer.files?.[0];
    if (archivo) onDocumentoChange(archivo);
  };

  return (
    <section className="bg-white rounded-2xl border border-[#e8eef0] p-6">
      {/* Encabezado */}
      <header className="flex items-center gap-2 mb-5">
        <ClipboardEdit size={16} className="text-emerald-500" />
        <h2 className="text-sm font-bold text-[#0F1819]">Información Adicional</h2>
      </header>

      {/* Notas */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-xs font-medium text-[#0F1819]">Notas / Condiciones</label>
        <textarea
          value={notas}
          onChange={(e) => onNotasChange(e.target.value)}
          placeholder="Ingresa cualquier cláusula o condición específica..."
          rows={3}
          className="w-full px-3.5 py-2.5 text-sm border border-[#d1dde2] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 text-[#0F1819] placeholder:text-[#c5d5db] resize-none bg-white"
        />
      </div>

      {/* Documento */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#0F1819]">Documento del Contrato</label>

        {documento ? (
          <div className="flex items-center justify-between bg-[#f8fafb] border border-[#e8eef0] rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <FileText size={16} className="text-emerald-500 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-[#0F1819] truncate">
                  {documento.name}
                </span>
                <span className="text-[11px] text-[#8aa3ad]">
                  {(documento.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDocumentoChange(null)}
              className="p-1.5 text-[#8aa3ad] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={manejarDrop}
            className="flex flex-col items-center justify-center gap-1.5 bg-[#f8fafb] border border-dashed border-[#d1dde2] rounded-xl px-4 py-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
          >
            <CloudUpload size={22} className="text-[#8aa3ad]" />
            <span className="text-xs text-[#0F1819]">Haz clic para subir o arrastra y suelta</span>
            <span className="text-[11px] text-[#8aa3ad]">PDF, DOCX (Máx 10MB)</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc"
          onChange={manejarArchivo}
        />
      </div>
    </section>
  );
}
