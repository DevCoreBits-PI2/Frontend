// Servicio mock para el formulario de registro de empleado
export interface Position {
  id: string;
  nombre: string;
  areaId: string;
}

export const DOCUMENT_TYPES = [
  { id: 'dni', nombre: 'DNI' },
  { id: 'passport', nombre: 'Passport' },
  { id: 'ce', nombre: 'Carnet de Extranjeria' },
];

export const CONTRACT_TYPES = [
  { id: 'fulltime', nombre: 'Full Time' },
  { id: 'parttime', nombre: 'Part Time' },
  { id: 'temporal', nombre: 'Temporal' },
];

export const AREAS_MOCK = [
  { id: '1', nombre: 'Ingenieria' },
  { id: '2', nombre: 'Recursos Humanos' },
  { id: '3', nombre: 'Finanzas' },
];

export const POSITIONS_MOCK: Position[] = [
  { id: 'p1', nombre: 'Software Engineer', areaId: '1' },
  { id: 'p2', nombre: 'QA Engineer', areaId: '1' },
  { id: 'p3', nombre: 'HR Specialist', areaId: '2' },
  { id: 'p4', nombre: 'Accountant', areaId: '3' },
];

export interface RegisterPayload {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  photo?: string; // data URL
  files?: { name: string; size: number; type: string }[];
  areaId?: string;
  positionId?: string;
  hireDate?: string;
  contractType?: string;
}

export type RegisterErrorCode = "DUPLICATE_DOCUMENT";

export interface RegisterResult {
  success: boolean;
  employeeId?: string;
  payload?: RegisterPayload;
  errorCode?: RegisterErrorCode;
  errorMessage?: string;
}

// Documentos ya registrados (mock). En produccion vendria del backend.
export const REGISTERED_DOCUMENTS_MOCK = new Set<string>([
  "12345678",
  "87654321",
  "1098765432",
]);

export const isDocumentDuplicated = (documentNumber?: string): boolean => {
  if (!documentNumber) return false;
  return REGISTERED_DOCUMENTS_MOCK.has(documentNumber.trim());
};

export const enviarRegistroMock = async (
  payload: RegisterPayload,
): Promise<RegisterResult> => {
  await new Promise((r) => setTimeout(r, 800));

  if (isDocumentDuplicated(payload.documentNumber)) {
    return {
      success: false,
      errorCode: "DUPLICATE_DOCUMENT",
      errorMessage:
        "Ya existe un empleado registrado en el sistema con este número de documento. Por favor, inténtalo de nuevo con un número de documento válido.",
    };
  }

  // generar id tipo EMP-YYYY-NNN
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 900) + 100);
  return { success: true, employeeId: `EMP-${year}-${random}`, payload };
};
