// Servicio de organigrama — integrado con el endpoint público /positions-tree.
//
// El backend devuelve una lista plana de posiciones; cada nodo puede traer
// children embebidos (cuando construyó el árbol) o no traerlos (cuando vino
// como findMany plano). Aquí lo normalizamos a un árbol y lo aplanamos a
// `Position[]` que es lo que la UI espera.

import { Position, PositionTree } from "@/types/orgChart";
import { obtenerArbolPosiciones } from "./positionsService";
import { apiGet } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import { normalizePaginated } from "@/types/api/common";
import type { PositionTreeNode } from "@/types/api/position";
import type { EmployeeDto } from "@/types/api/employee";

const ICON_BY_NAME: Record<string, Position["iconType"]> = {
  director: "crown",
  ceo: "crown",
  lead: "shield",
  architect: "person",
  cloud: "cloud",
  frontend: "code",
  backend: "code",
};

function pickIcon(name: string): Position["iconType"] {
  const lower = name.toLowerCase();
  for (const key of Object.keys(ICON_BY_NAME)) {
    if (lower.includes(key)) return ICON_BY_NAME[key];
  }
  return "person";
}

function employeeCountOf(node: PositionTreeNode): number {
  if (typeof node._count?.employees === "number") return node._count.employees;
  if (Array.isArray(node.employees)) return node.employees.length;
  if (node.employee) return 1;
  return 0;
}

function flattenTree(
  nodes: PositionTreeNode[] | undefined,
  out: Position[] = [],
  parentName?: string,
  level = 1,
): Position[] {
  if (!nodes) return out;
  for (const node of nodes) {
    const childNodes = node.children ?? [];
    const id = node.id ?? node.id_position ?? 0;
    const area = node.area ?? node.areas;
    out.push({
      id: String(id),
      name: node.name,
      department: area?.name ?? "",
      level,
      parentId: node.parent_position_id != null ? String(node.parent_position_id) : null,
      superiorName: parentName,
      employeeCount: employeeCountOf(node),
      status: node.status === "active" ? "Active" : "Inactive",
      directReportNames: childNodes.map((c) => c.name),
      iconType: pickIcon(node.name),
    });
    flattenTree(childNodes, out, node.name, level + 1);
  }
  return out;
}

function buildFlatTree(nodes: PositionTreeNode[]): PositionTreeNode[] {
  const byId = new Map<number, PositionTreeNode & { children: PositionTreeNode[] }>();
  for (const node of nodes) {
    const id = node.id ?? node.id_position;
    if (!id) continue;
    byId.set(id, { ...node, children: [] });
  }

  const roots: PositionTreeNode[] = [];
  byId.forEach((node) => {
    if (node.parent_position_id && byId.has(node.parent_position_id)) {
      byId.get(node.parent_position_id)?.children?.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

let cachedPositions: Position[] = [];

// El endpoint `positionsTree` del backend mapea empleados a un `Map<id_position, employee>`,
// así que cuando hay >1 empleado en un mismo cargo solo queda 1 (el último). Para que el
// organigrama muestre el conteo real, traemos `findAll` de empleados y agrupamos por
// id_position. Si falla por permisos (403), caemos al conteo del árbol original.
//
// IMPORTANTE: el backend pagina con `limit=10` por defecto. Pedimos un límite alto para
// no perder empleados con id > 10 (que dejarían cargos con conteo 0 falso).
async function buildEmployeeCountByPositionId(): Promise<Map<number, number> | null> {
  try {
    const raw = await apiGet<unknown>(EMPLOYEES.findAll, {
      query: { limit: 1000 },
    });
    const empleados = normalizePaginated<EmployeeDto>(raw);
    const map = new Map<number, number>();
    for (const e of empleados) {
      if (typeof e.id_position !== "number") continue;
      map.set(e.id_position, (map.get(e.id_position) ?? 0) + 1);
    }
    return map;
  } catch {
    return null;
  }
}

export const getPositions = async (): Promise<Position[]> => {
  const [tree, realCounts] = await Promise.all([
    obtenerArbolPosiciones(),
    buildEmployeeCountByPositionId(),
  ]);
  const normalizedTree = tree.some((node) => node.children?.length) ? tree : buildFlatTree(tree);
  // El backend hace soft-delete (status=inactive). En el organigrama solo
  // queremos posiciones activas: si está inactiva no debe aparecer en el árbol.
  // Como `DeletePositionModal` impide desactivar nodos con hijos o con padre,
  // las posiciones inactivas siempre son aisladas → filtrarlas no genera
  // huérfanos.
  const flat = flattenTree(normalizedTree).filter((p) => p.status === "Active");

  // Override del conteo del árbol con el real, si lo pudimos calcular.
  // Usamos max() para no pisar el conteo del backend con un valor menor:
  // el árbol garantiza "≥1 si hay alguien asignado" (vía Map), y el findAll
  // nos da el conteo real. Si el findAll falla parcialmente, al menos no
  // perdemos info que el backend ya sabía.
  if (realCounts) {
    for (const p of flat) {
      const idNum = Number(p.id);
      if (Number.isNaN(idNum)) continue;
      const fromFindAll = realCounts.get(idNum) ?? 0;
      p.employeeCount = Math.max(p.employeeCount, fromFindAll);
    }
  }

  cachedPositions = flat;
  return cachedPositions;
};

/**
 * Construye un bosque (lista de árboles) a partir de un arreglo plano de
 * posiciones. Cada posición sin padre conocido se convierte en una raíz.
 */
export const buildPositionForest = (positions: Position[]): PositionTree[] => {
  const map = new Map<string, PositionTree>();
  positions.forEach((p) => map.set(p.id, { ...p, children: [] }));

  const roots: PositionTree[] = [];
  map.forEach((node) => {
    if (node.parentId === null || !map.has(node.parentId)) {
      roots.push(node);
    } else {
      map.get(node.parentId)!.children.push(node);
    }
  });

  return roots;
};

export const getAllPositionNames = (): string[] => cachedPositions.map((p) => p.name);
