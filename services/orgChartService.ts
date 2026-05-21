// Servicio de organigrama — integrado con el endpoint público /positions-tree.

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

function flattenTree(
  nodes: PositionTreeNode[] | undefined,
  out: Position[] = [],
  parentName?: string,
  level = 1,
): Position[] {
  if (!nodes) return out;
  for (const node of nodes) {
    const childNodes = node.children ?? [];
    out.push({
      id: String(node.id),
      name: node.name,
      department: node.area?.name ?? "",
      level,
      parentId: node.parent_position_id != null ? String(node.parent_position_id) : null,
      superiorName: parentName,
      employeeCount: node._count?.employees ?? node.employees?.length ?? 0,
      status: node.status === "active" ? "Active" : "Inactive",
      directReportNames: childNodes.map((c) => c.name),
      iconType: pickIcon(node.name),
    });
    flattenTree(childNodes, out, node.name, level + 1);
  }
  return out;
}

let cachedPositions: Position[] = [];

export const getPositions = async (): Promise<Position[]> => {
  const tree = await obtenerArbolPosiciones();
  cachedPositions = flattenTree(tree);
  return cachedPositions;
};

export const buildPositionTree = (positions: Position[]): PositionTree => {
  const map = new Map<string, PositionTree>();
  positions.forEach((p) => map.set(p.id, { ...p, children: [] }));

  let root: PositionTree | null = null;
  map.forEach((node) => {
    if (node.parentId === null) {
      // Si hay múltiples raíces, escogemos la primera que aparezca.
      if (!root) root = node;
    } else {
      const parent = map.get(node.parentId);
      if (parent) parent.children.push(node);
    }
  });

  if (!root) throw new Error("No se encontró una raíz en la jerarquía de cargos");
  return root;
};

export const getAllPositionNames = (): string[] => cachedPositions.map((p) => p.name);
