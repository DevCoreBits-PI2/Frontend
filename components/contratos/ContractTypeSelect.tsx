"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { TipoContrato, TIPO_CONTRATO_LABEL } from "@/services/contratosService";

const ORDEN: TipoContrato[] = [
  "FIJO",
  "INDEFINIDO",
  "SERVICIO",
  "TIEMPO_PARCIAL",
  "APRENDIZAJE",
  "OBRA",
];

interface ContractTypeSelectProps {
  valor: TipoContrato;
  onChange: (nuevo: TipoContrato) => void;
}

export default function ContractTypeSelect({ valor, onChange }: ContractTypeSelectProps) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((s) => !s)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border transition-colors text-left ${
          abierto
            ? "border-emerald-500 bg-white ring-2 ring-emerald-100"
            : "border-[#d1dde2] bg-white hover:border-emerald-400"
        } text-[#0F1819]`}
      >
        <span>{TIPO_CONTRATO_LABEL[valor]}</span>
        <ChevronDown
          size={16}
          className={`text-[#8aa3ad] transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-[#e8eef0] rounded-lg shadow-lg overflow-hidden">
          {ORDEN.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => {
                onChange(tipo);
                setAbierto(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${
                tipo === valor
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-[#0F1819] hover:bg-[#f4f7f8]"
              }`}
            >
              <span>{TIPO_CONTRATO_LABEL[tipo]}</span>
              {tipo === valor && <Check size={14} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
