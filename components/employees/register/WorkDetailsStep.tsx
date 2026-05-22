"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  obtenerAreasParaRegistro,
  obtenerPosicionesParaRegistro,
  type Position,
} from "../../../services/registerEmployeeService";

interface Props {
  data: { areaId?: string; positionId?: string };
  onChange: (patch: Record<string, string>) => void;
}

// Solo asignación organizacional: área (filtro) + cargo. El tipo de contrato
// y la fecha de inicio NO van acá — son del módulo de contratos (entidad
// independiente en el backend, ver `contracts` table). Pedirlos en el registro
// duplicaba datos y nunca se enviaban al backend.
const WorkDetailsStep: React.FC<Props> = ({ data, onChange }) => {
  const [areas, setAreas] = useState<{ id: string; nombre: string }[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([obtenerAreasParaRegistro(), obtenerPosicionesParaRegistro()]).then(
      ([a, p]) => {
        if (!mounted) return;
        setAreas(a);
        setAllPositions(p);
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  const positions = useMemo(() => {
    if (!data.areaId) return allPositions;
    return allPositions.filter((p) => p.areaId === data.areaId);
  }, [allPositions, data.areaId]);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
          Área / Departamento
        </label>
        <select
          value={data.areaId || ""}
          onChange={(e) => onChange({ areaId: e.target.value, positionId: "" })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-[#2ECC71] text-gray-700"
        >
          <option value="">Seleccionar Área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
          Cargo
        </label>
        <select
          value={data.positionId || ""}
          onChange={(e) => onChange({ positionId: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-[#2ECC71] text-gray-700"
        >
          <option value="">Seleccionar Cargo</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 rounded-lg bg-[#f4f7f8] border border-[#d1dde2] p-4 text-xs text-[#576975] leading-relaxed">
        <p className="font-semibold text-[#203D47] mb-1">Sobre el contrato</p>
        El tipo de contrato, fecha de inicio, duración y condiciones laborales se
        gestionan después desde el módulo de <strong>Contratos</strong>, una vez
        el empleado acepte la invitación y tengas el documento firmado.
      </div>
    </div>
  );
};

export default WorkDetailsStep;
