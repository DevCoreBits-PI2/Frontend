import { RouteGuard } from "@/lib/auth/RouteGuard";

// Vista global de contratos.
// /administrative-data/contracts/find-all-contracts  →  HumanTalent | Admin
// /administrative-data/contracts/stats               →  HumanTalent | Admin

export default function ContratosLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireHumanTalent>{children}</RouteGuard>;
}
