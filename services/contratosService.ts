export type TipoContrato = "FIJO" | "INDEFINIDO" | "SERVICIO" | "TIEMPO_PARCIAL";

export type EstadoContrato =
  | "ACTIVO"
  | "RENOVADO"
  | "EXPIRADO"
  | "ANULADO";

export type ValidezContrato = "ONGOING" | "COMPLETED" | "EXPIRED" | "VOIDED";

export interface Contrato {
  id: string;
  idEmpleado: string;
  tipo: TipoContrato;
  fechaInicio: string;       // ISO 'YYYY-MM-DD'
  fechaFin: string | null;   // null = indefinido
  salarioBase: number;
  notas: string;
  documentoNombre?: string;
  estado: EstadoContrato;
  validez: ValidezContrato;
  creadoEn: string;
}

const CONTRATOS_MOCK: Contrato[] = [
  {
    id: "c-001",
    idEmpleado: "9982",
    tipo: "INDEFINIDO",
    fechaInicio: "2022-01-15",
    fechaFin: null,
    salarioBase: 95000,
    notas: "Contrato indefinido vigente.",
    estado: "ACTIVO",
    validez: "ONGOING",
    creadoEn: "2022-01-15",
  },
  {
    id: "c-002",
    idEmpleado: "9982",
    tipo: "FIJO",
    fechaInicio: "2021-01-15",
    fechaFin: "2022-01-14",
    salarioBase: 85000,
    notas: "Contrato a termino fijo renovado.",
    estado: "RENOVADO",
    validez: "COMPLETED",
    creadoEn: "2021-01-15",
  },
  {
    id: "c-003",
    idEmpleado: "9982",
    tipo: "FIJO",
    fechaInicio: "2020-01-10",
    fechaFin: "2021-01-09",
    salarioBase: 78000,
    notas: "Contrato a termino fijo expirado.",
    estado: "EXPIRADO",
    validez: "EXPIRED",
    creadoEn: "2020-01-10",
  },
  {
    id: "c-004",
    idEmpleado: "9982",
    tipo: "SERVICIO",
    fechaInicio: "2019-10-01",
    fechaFin: "2019-12-31",
    salarioBase: 12000,
    notas: "Contrato de prestacion de servicios anulado.",
    estado: "ANULADO",
    validez: "VOIDED",
    creadoEn: "2019-10-01",
  },
];

export interface NuevoContratoDTO {
  idEmpleado: string;
  tipo: TipoContrato;
  fechaInicio: string;
  fechaFin: string | null;
  salarioBase: number;
  notas: string;
  documentoNombre?: string;
}

export const obtenerContratosPorEmpleado = async (
  idEmpleado: string,
): Promise<Contrato[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return CONTRATOS_MOCK.filter((c) => c.idEmpleado === idEmpleado);
};

export const crearContrato = async (
  datos: NuevoContratoDTO,
): Promise<Contrato> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const nuevo: Contrato = {
    ...datos,
    id: `c-${Date.now()}`,
    estado: "ACTIVO",
    validez: "ONGOING",
    creadoEn: new Date().toISOString().slice(0, 10),
  };

  CONTRATOS_MOCK.unshift(nuevo);
  return nuevo;
};

export const obtenerContratoPorId = async (id: string): Promise<Contrato | null> => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return CONTRATOS_MOCK.find((c) => c.id === id) ?? null;
};

export interface ActualizarContratoDTO {
  fechaFin: string | null;
  salarioBase: number;
  notas: string;
}

export const actualizarContrato = async (
  id: string,
  datos: ActualizarContratoDTO,
): Promise<Contrato> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const index = CONTRATOS_MOCK.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Contrato no encontrado");
  CONTRATOS_MOCK[index] = { ...CONTRATOS_MOCK[index], ...datos };
  return CONTRATOS_MOCK[index];
};

export interface RenovarContratoDTO {
  contratoActualId: string;
  tipo: TipoContrato;
  fechaInicio: string;
  fechaFin: string | null;
  salarioBase: number;
  notas: string;
  documentoNombre?: string;
}

export interface ResultadoRenovacion {
  contratoAnterior: Contrato;
  contratoNuevo: Contrato;
}

export const renovarContrato = async (
  datos: RenovarContratoDTO,
): Promise<ResultadoRenovacion> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const index = CONTRATOS_MOCK.findIndex((c) => c.id === datos.contratoActualId);
  if (index === -1) throw new Error("Contrato no encontrado");

  // Marcar el contrato actual como renovado
  CONTRATOS_MOCK[index] = {
    ...CONTRATOS_MOCK[index],
    estado: "RENOVADO",
    validez: "COMPLETED",
  };

  const contratoAnterior = CONTRATOS_MOCK[index];

  // Crear el nuevo contrato activo
  const contratoNuevo: Contrato = {
    id: `c-${Date.now()}`,
    idEmpleado: contratoAnterior.idEmpleado,
    tipo: datos.tipo,
    fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin,
    salarioBase: datos.salarioBase,
    notas: datos.notas,
    documentoNombre: datos.documentoNombre,
    estado: "ACTIVO",
    validez: "ONGOING",
    creadoEn: new Date().toISOString().slice(0, 10),
  };

  CONTRATOS_MOCK.unshift(contratoNuevo);

  return { contratoAnterior, contratoNuevo };
};

export const eliminarContrato = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const index = CONTRATOS_MOCK.findIndex((c) => c.id === id);
  if (index !== -1) CONTRATOS_MOCK.splice(index, 1);
};

export const anularContrato = async (id: string): Promise<Contrato> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = CONTRATOS_MOCK.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Contrato no encontrado");
  CONTRATOS_MOCK[index] = { ...CONTRATOS_MOCK[index], estado: "ANULADO", validez: "VOIDED" };
  return CONTRATOS_MOCK[index];
};

// Reglas de validacion para mostrar el panel "Validation Status"
export interface ResultadoValidacion {
  rangoFechasValido: boolean;
  sinSolapamiento: boolean;
  presupuestoAprobado: boolean;
}

export const validarContrato = async (
  idEmpleado: string,
  fechaInicio: string,
  fechaFin: string | null,
  salario: number,
  excludeContratoId?: string,
): Promise<ResultadoValidacion> => {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : null;

  const rangoFechasValido =
    !!fechaInicio && (fin ? fin.getTime() > inicio.getTime() : true);

  const contratosEmpleado = CONTRATOS_MOCK.filter(
    (c) =>
      c.idEmpleado === idEmpleado &&
      c.estado === "ACTIVO" &&
      c.id !== excludeContratoId,
  );

  const sinSolapamiento = !contratosEmpleado.some((c) => {
    const cInicio = new Date(c.fechaInicio).getTime();
    const cFin = c.fechaFin ? new Date(c.fechaFin).getTime() : Infinity;
    const nuevoInicio = inicio.getTime();
    const nuevoFin = fin ? fin.getTime() : Infinity;
    return nuevoInicio <= cFin && nuevoFin >= cInicio;
  });

  const presupuestoAprobado = salario > 0 && salario <= 500000;

  return { rangoFechasValido, sinSolapamiento, presupuestoAprobado };
};
