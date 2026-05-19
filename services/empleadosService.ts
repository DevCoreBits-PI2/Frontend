export type EstadoEmpleado = "ACTIVO" | "SUSPENDIDO" | "RETIRADO";

export interface Empleado {
  id: string;
  codigoEmpleado: string;
  nombre: string;
  apellidos: string;
  cargo: string;
  departamento: string;
  ubicacion: string;
  tipoEmpleo: string;
  email: string;
  estado: EstadoEmpleado;
  foto: string;
}

export interface EvaluationCompetency {
  name: string;
  score: number;
}

export interface Evaluation {
  id: string;
  title: string;
  reviewer: string;
  date: string;
  score: number;
  isRecent?: boolean;
  competencies: EvaluationCompetency[];
  observations?: string;
}

// In-memory evaluations store keyed by empleado id (mock persistence)
const EVALUATIONS_STORE: Record<string, Evaluation[]> = {};

export const guardarEvaluacion = async (empleadoId: string, evaluation: Evaluation): Promise<Evaluation> => {
  await new Promise((r) => setTimeout(r, 200));
  if (!EVALUATIONS_STORE[empleadoId]) EVALUATIONS_STORE[empleadoId] = [];
  EVALUATIONS_STORE[empleadoId].unshift(evaluation);
  return evaluation;
};

export const obtenerEvaluacionesEmpleado = async (empleadoId: string): Promise<Evaluation[]> => {
  await new Promise((r) => setTimeout(r, 180));
  return EVALUATIONS_STORE[empleadoId] ?? [];
};

export const EMPLEADOS_MOCK: Empleado[] = [
  {
    id: "9284",
    codigoEmpleado: "EMP-9284",
    nombre: "Jonathan",
    apellidos: "Doe",
    cargo: "Senior Software Engineer",
    departamento: "Engineering",
    ubicacion: "San Francisco, CA",
    tipoEmpleo: "Full-time Employee",
    email: "jonathan.doe@talentcore.com",
    estado: "ACTIVO",
    foto: "",
  },
  {
    id: "9982",
    codigoEmpleado: "EMP-9982-A",
    nombre: "Jonathan",
    apellidos: "Doe",
    cargo: "Senior Software Architect",
    departamento: "Engineering Department",
    ubicacion: "Austin, TX Office",
    tipoEmpleo: "Full-time Employee",
    email: "john.doe@company.com",
    estado: "ACTIVO",
    foto: "",
  },
  {
    id: "1024",
    codigoEmpleado: "EMP-1024",
    nombre: "Alex",
    apellidos: "Rivera",
    cargo: "Marketing Manager",
    departamento: "Marketing",
    ubicacion: "New York, NY",
    tipoEmpleo: "Full-time Employee",
    email: "alex.rivera@talentcore.com",
    estado: "ACTIVO",
    foto: "",
  },
  {
    id: "2031",
    codigoEmpleado: "EMP-2031",
    nombre: "Maria",
    apellidos: "Gomez",
    cargo: "HR Specialist",
    departamento: "Recursos Humanos",
    ubicacion: "Miami, FL",
    tipoEmpleo: "Full-time Employee",
    email: "maria.gomez@talentcore.com",
    estado: "ACTIVO",
    foto: "",
  },
  {
    id: "3098",
    codigoEmpleado: "EMP-3098",
    nombre: "Carlos",
    apellidos: "Mendez",
    cargo: "Financial Analyst",
    departamento: "Operaciones Financieras",
    ubicacion: "Bogota, CO",
    tipoEmpleo: "Full-time Employee",
    email: "carlos.mendez@talentcore.com",
    estado: "SUSPENDIDO",
    foto: "",
  },
];

export const obtenerEmpleados = async (): Promise<Empleado[]> => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return EMPLEADOS_MOCK;
};

export const obtenerEmpleadoPorId = async (
  id: string,
): Promise<Empleado | null> => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return EMPLEADOS_MOCK.find((e) => e.id === id) ?? null;
};
