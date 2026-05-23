// Espejo de los enums del Gateway: gateway/src/guards/enum/position-id.enum.ts
// Mantener estos valores SINCRONIZADOS con el backend (no se debe modificar el backend).

export enum PositionId {
  CEO = 1,
  CIO = 2,
  CHRO = 3,
  CFO = 4,
  COO = 5,
  TechnologyLead = 6,
  HumanTalentLead = 7,
  FinanceLead = 8,
  OperationsLead = 9,
  RecruitmentCoordinator = 10,
  SelectionAnalyst = 11,
  BackendDeveloper = 13,
  HumanTalentAssistant = 14,
}

export const C_LEVEL_POSITION_IDS: PositionId[] = [
  PositionId.CEO,
  PositionId.CIO,
  PositionId.CHRO,
  PositionId.CFO,
  PositionId.COO,
];

export const LEAD_POSITION_IDS: PositionId[] = [
  PositionId.TechnologyLead,
  PositionId.HumanTalentLead,
  PositionId.FinanceLead,
  PositionId.OperationsLead,
];

export const HUMAN_TALENT_POSITION_IDS: PositionId[] = [
  PositionId.HumanTalentLead,
  PositionId.HumanTalentAssistant,
];

export interface AuthUserContext {
  supabaseUserId: string;
  employeeId: number | null;
  // Id numérico del registro en la tabla `administrators` (resuelto a partir
  // del `supabase_user_id` vía GET /api/admin/admin + GET /api/admin/:id).
  // Es el id que el backend espera recibir cuando un admin ejecuta acciones
  // que requieren `id_administrator` (crear área, cargo, invitar empleado…).
  adminId: number | null;
  position: PositionId | null;
  isAdmin: boolean;
}

export function isHumanTalent(position: PositionId | null | undefined): boolean {
  return !!position && HUMAN_TALENT_POSITION_IDS.includes(position);
}

export function canManageHumanTalent(user: Pick<AuthUserContext, "isAdmin" | "position">): boolean {
  return user.isAdmin || isHumanTalent(user.position);
}

export function hasAnyPosition(
  user: Pick<AuthUserContext, "isAdmin" | "position">,
  allowed: PositionId[],
): boolean {
  if (user.isAdmin) return true;
  if (user.position == null) return false;
  return allowed.includes(user.position);
}

// ───────────── Helpers granulares por feature ─────────────
//
// La idea: cada feature tiene una sola función que decide si el usuario puede
// verla/usarla. Los componentes consumen estas funciones (no chequean
// `isAdmin`/`position` a mano), así si el backend cambia las reglas solo se
// actualiza acá. La lógica refleja lo que cada endpoint del backend acepta —
// ver guards en gateway/src/.

type PermissionCheck = (user: Pick<AuthUserContext, "isAdmin" | "position"> | null) => boolean;

const isAdminOnly: PermissionCheck = (u) => !!u?.isAdmin;

const isAdminOrHt: PermissionCheck = (u) =>
  !!u && (u.isAdmin || isHumanTalent(u.position));

const anyAuthenticated: PermissionCheck = (u) => u != null;

/** Acceso al módulo Administradores (crear, listar, bloquear admins). */
export const canManageAdmins = isAdminOnly;

/** Acceso al CRUD de áreas / cargos. Backend: @Positions(HT_Lead, HT_Asst) + admin bypass. */
export const canManageOrgStructure = isAdminOrHt;

/** Acceso al CRUD de contratos. Mismo guard que estructura organizacional. */
export const canManageContracts = isAdminOrHt;

/** Acceso a invitar / editar empleados (a nivel HT). */
export const canManageEmployees = isAdminOrHt;

/** Ver el directorio completo de empleados (no solo el propio perfil). */
export const canSeeEmployeesDirectory = isAdminOrHt;

/** Generar reportes de desempeño y por área. Backend: @Positions(HT) + admin bypass. */
export const canGenerateReports = isAdminOrHt;

/** Crear evaluaciones de desempeño. Backend: cualquiera autenticado (pero
 *  semánticamente quien evalúa es el manager/HT). En la UI lo dejamos para
 *  HT/Admin para no confundir; un empleado regular no tiene una sección
 *  para "evaluar a otros". */
export const canCreateEvaluations = isAdminOrHt;

/** Acceso al escaneo de QR (kiosco de check-in). Backend: público
 *  (OptionalAuthGuard), pero solo tiene sentido para HT/Admin desde un
 *  terminal de control. */
export const canScanQr = isAdminOrHt;

/** Ver el dashboard principal con stats agregadas. */
export const canSeeDashboard = anyAuthenticated;

/** Ver el organigrama (positions-tree). Backend: público. */
export const canSeeOrgChart = anyAuthenticated;
