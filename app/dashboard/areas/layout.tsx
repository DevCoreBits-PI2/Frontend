import { RouteGuard } from "@/lib/auth/RouteGuard";

// Gestión de áreas y posiciones: requiere Talento Humano o Admin.
// Espejo de los guards del backend:
//   /administrative-data/areas/create-area, update-area, delete-area  →  HumanTalent | Admin
//   /administrative-data/positions/*                                  →  HumanTalent | Admin
// Las consultas GET de listado son públicas, pero el UI completo es de gestión.

export default function AreasLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireHumanTalent>{children}</RouteGuard>;
}
