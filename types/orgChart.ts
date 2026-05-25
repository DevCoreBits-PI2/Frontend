// Legacy type used by dashboard components (DepartmentalHierarchy, dashboardService)
export interface NodoOrg {
  id: string;
  nombre: string;
  nivel: "EJECUTIVO" | "TECNICO" | "INFRAESTRUCTURA" | "SEGURIDAD" | "GESTION" | "OPERACIONES";
  estado: "ACTIVO" | "ESTABLE" | "ALTA_ROTACION" | "NECESIDADES_CRITICAS" | "INACTIVO";
  cantidadMiembros: number;
  idPadre: string | null;
  descripcion: string;
  avatares: string[];
  vacantes: number;
  utilizacionPresupuesto: number;
  retencion: number;
  lideres: { id: string; nombre: string; cargo: string; avatar: string }[];
}

// Position Hierarchy types
export type PositionStatus = "Active" | "Inactive";
export type IconType = "crown" | "person" | "cloud" | "code" | "shield";

export interface Position {
  id: string;
  name: string;
  department: string;
  level: number;
  parentId: string | null;
  superiorName?: string;
  employeeCount: number;
  status: PositionStatus;
  directReportNames: string[];
  iconType: IconType;
}

export interface PositionTree extends Position {
  children: PositionTree[];
}
