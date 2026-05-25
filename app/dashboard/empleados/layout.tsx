import { RouteGuard } from "@/lib/auth/RouteGuard";

// Directorio de empleados (listado + acciones administrativas).
// Espejo de los guards del backend:
//   GET /employees/findAll                  →  HumanTalent | Admin
//   POST /employees/inviteUser              →  HumanTalent | Admin
//   PATCH /employees/updateEmployee/:id     →  HumanTalent | Admin
// Las páginas individuales (/empleados/[id]) usan endpoints con control fino:
// dueño / jefe / Talento Humano. El layout exige el rol mínimo para la sección.

export default function EmpleadosLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireHumanTalent>{children}</RouteGuard>;
}
