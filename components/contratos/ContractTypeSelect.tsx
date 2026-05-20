"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TipoContrato } from "@/services/contratosService";

interface OpcionTipo {
  valor: TipoContrato;
  etiqueta: string;
  descripcion?: string;
}

const OPCIONES: OpcionTipo[] = [
  { valor: "FIJO", etiqueta: "Término Fijo", descripcion: "Beneficios estándar y 40h/semana" },
  { valor: "INDEFINIDO", etiqueta: "Término Indefinido" },
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

  const opcionActiva = OPCIONES.find((o) => o.valor === valor) ?? OPCIONES[0];
  const opcionAlternativa = OPCIONES.find((o) => o.valor !== valor);

  const etiquetaSeleccion =
    opcionActiva.valor === "FIJO"
      ? `${opcionActiva.etiqueta} (${opcionActiva.descripcion})`
      : opcionActiva.etiqueta;

  return (
    <div ref={ref} className="relative">
      {/* Caja del select */}
      <button
        type="button"
        onClick={() => setAbierto((s) => !s)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm rounded-lg border transition-colors text-left ${
          abierto
            ? "border-emerald-500 bg-white ring-2 ring-emerald-100"
            : "border-emerald-500 bg-white"
        } text-[#0F1819]`}
      >
        <span>{etiquetaSeleccion}</span>
        <ChevronDown
          size={16}
          className={`text-[#8aa3ad] transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {/* Opcion alternativa flotante (estilo del diseño) */}
      {abierto && opcionAlternativa && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+8px)] z-20">
          <button
            type="button"
            onClick={() => {
              onChange(opcionAlternativa.valor);
              setAbierto(false);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg shadow-md border border-emerald-600 whitespace-nowrap transition-colors"
          >
            {opcionAlternativa.etiqueta}
          </button>
        </div>
      )}
    </div>
  );
}
