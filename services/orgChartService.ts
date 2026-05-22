// Servicio de organigrama — integrado con el endpoint público /positions-tree.
//
// El backend devuelve una lista plana de posiciones; cada nodo puede traer
// children embebidos (cuando construyó el árbol) o no traerlos (cuando vino
// como findMany plano). Aquí lo normalizamos a un árbol y lo aplanamos a
// `Position[]` que es lo que la UI espera.

import { Position, PositionTree } from "@/types/orgChart";
import { obtenerArbolPosiciones } from "./positionsService";
import type { PositionTreeNode } from "@/types/api/position";

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

export const getPositions = async (): Promise<Position[]> => {
  const tree = await obtenerArbolPosiciones();
  const normalizedTree = tree.some((node) => node.children?.length) ? tree : buildFlatTree(tree);
  // El backend hace soft-delete (status=inactive). En el organigrama solo
  // queremos posiciones activas: si está inactiva no debe aparecer en el árbol.
  // Como `DeletePositionModal` impide desactivar nodos con hijos o con padre,
  // las posiciones inactivas siempre son aisladas → filtrarlas no genera
  // huérfanos.
  cachedPositions = flattenTree(normalizedTree).filter((p) => p.status === "Active");
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
