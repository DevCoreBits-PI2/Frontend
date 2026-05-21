"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  CONTRACT_TYPES,
  obtenerAreasParaRegistro,
  obtenerPosicionesParaRegistro,
  type Position,
} from "../../../services/registerEmployeeService";

interface Props {
  data: { areaId?: string; positionId?: string; hireDate?: string; contractType?: string };
  onChange: (patch: Record<string, string>) => void;
}

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
          Posición
        </label>
        <select
          value={data.positionId || ""}
          onChange={(e) => onChange({ positionId: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-[#2ECC71] text-gray-700"
        >
          <option value="">Seleccionar Posición</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
          Fecha de Contratación
        </label>
        <input
          type="date"
          value={data.hireDate || ""}
          onChange={(e) => onChange({ hireDate: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-[#2ECC71] text-gray-700"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#203D47] uppercase mb-2">
          Tipo de Contrato
        </label>
        <select
          value={data.contractType || ""}
          onChange={(e) => onChange({ contractType: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-[#2ECC71] text-gray-700"
        >
          <option value="">Seleccionar tipo</option>
          {CONTRACT_TYPES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default WorkDetailsStep;
