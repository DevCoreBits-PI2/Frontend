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
