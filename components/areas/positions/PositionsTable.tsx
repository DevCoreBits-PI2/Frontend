"use client";

import { useState, useEffect } from "react";
import { Position, PositionsResponse, obtenerPosiciones } from "@/services/positionsService";
import PositionRow from "./PositionRow";

interface PositionsTableProps {
  searchText: string;
  tab: "All" | "Hierarchy" | "Archived";
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
}

export default function PositionsTable({
  searchText,
  tab,
  onEdit,
  onDelete,
}: PositionsTableProps) {
  const [positions, setPositions] = useState<PositionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, tab]);

  useEffect(() => {
    const loadPositions = async () => {
      setLoading(true);
      try {
        const data = await obtenerPosiciones({
          searchText,
          tab,
          page: currentPage,
          pageSize: 4,
        });
        setPositions(data);
      } catch (error) {
        console.error("Error loading positions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPositions();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-[#8aa3ad]">Cargando posiciones...</div>
      </div>
    );
  }

  if (!positions || positions.data.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-[#8aa3ad]">No se encontraron posiciones</div>
      </div>
    );
  }

  const totalPages = Math.ceil(positions.total / positions.pageSize);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#BDD5EA]">
              <th className="px-0 py-3 text-left text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                POSICIÓN
              </th>
              <th className="px-0 py-3 text-left text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                EMPLEADOS
              </th>
              <th className="px-0 py-3 text-left text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                POSICIÓN SUPERIOR
              </th>
              <th className="px-0 py-3 text-left text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                ESTADO
              </th>
              <th className="px-0 py-3 text-left text-xs font-semibold text-[#203D47] uppercase tracking-wider">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.data.map((position) => (
              <PositionRow
                key={position.id}
                position={position}
                onEdit={() => onEdit?.(position)}
                onDelete={() => onDelete?.(position)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-[#8aa3ad] font-medium">
          Mostrando {(currentPage - 1) * positions.pageSize + 1} de {positions.total} posiciones
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-[#203D47] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#0F1819] transition-colors"
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#2ECC71] text-white"
                    : "text-[#203D47] hover:bg-[#ECEFF1]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-[#203D47] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#0F1819] transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
