"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GitFork,
  Users,
  UserRound,
  FolderKanban,
  FileText,
  LogOut,
  ShieldCheck,
  BarChart3,
  QrCode,
} from "lucide-react";

import { useAuth } from "@/lib/auth/AuthContext";
import {
  canManageHumanTalent,
  PositionId,
} from "@/lib/auth/roles";

interface SubItem {
  etiqueta: string;
  href: string;
  // Subitem oculto si el rol no lo cumple. Usa la misma forma que NavItem.
  requireHumanTalent?: boolean;
  requireAdmin?: boolean;
  positions?: PositionId[];
}

interface NavItem {
  etiqueta: string;
  href: string;
  icono: React.ElementType;
  subItems?: SubItem[];
  requireHumanTalent?: boolean;
  requireAdmin?: boolean;
  positions?: PositionId[];
}

const ITEMS_NAV: NavItem[] = [
  { etiqueta: "Panel Principal", href: "/dashboard", icono: LayoutDashboard },
  { etiqueta: "Perfil de Usuario", href: "/dashboard/perfil", icono: UserRound },
  { etiqueta: "Organigrama", href: "/dashboard/org-chart", icono: GitFork },
  {
    etiqueta: "Directorio de Empleados",
    href: "/dashboard/empleados",
    icono: Users,
    requireHumanTalent: true,
  },
  {
    etiqueta: "Gestion de Areas",
    href: "/dashboard/areas",
    icono: FolderKanban,
    requireHumanTalent: true,
    subItems: [
      { etiqueta: "Areas", href: "/dashboard/areas", requireHumanTalent: true },
      { etiqueta: "Posiciones", href: "/dashboard/areas/positions", requireHumanTalent: true },
    ],
  },
  { etiqueta: "Contratos", href: "/dashboard/contratos", icono: FileText, requireHumanTalent: true },
  { etiqueta: "Reportes", href: "/dashboard/reportes", icono: BarChart3, requireHumanTalent: true },
  { etiqueta: "Escanear QR", href: "/dashboard/scan-qr", icono: QrCode, requireHumanTalent: true },
  { etiqueta: "Administradores", href: "/dashboard/admins", icono: ShieldCheck, requireAdmin: true },
];

function puedeVer(
  item: { requireHumanTalent?: boolean; requireAdmin?: boolean; positions?: PositionId[] },
  authUser: { isAdmin: boolean; position: PositionId | null } | null,
): boolean {
  if (!authUser) return false;
  if (item.requireAdmin && !authUser.isAdmin) return false;
  if (item.requireHumanTalent && !canManageHumanTalent(authUser)) return false;
  if (item.positions && item.positions.length > 0) {
    if (authUser.isAdmin) return true;
    if (authUser.position == null) return false;
    return item.positions.includes(authUser.position);
  }
  return true;
}

export default function Sidebar() {
  const router = useRouter();
  const rutaActual = usePathname();
  const { authUser, signOut } = useAuth();

  const handleLogOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const estaActivo = (href: string) =>
    href === "/dashboard"
      ? rutaActual === "/dashboard"
      : rutaActual.startsWith(href);

  const visibles = ITEMS_NAV.filter((item) => puedeVer(item, authUser));

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-[#0F1819] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1E333A]">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight">
          TalentCore
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {visibles.map(({ etiqueta, href, icono: Icono, subItems }) => {
          const activo = estaActivo(href);

          return (
            <div key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  activo
                    ? "bg-[#1E333A] text-white font-semibold"
                    : "text-[#8aa3ad] hover:bg-[#1E333A] hover:text-white"
                }`}
              >
                <Icono
                  size={16}
                  className={activo ? "text-emerald-400" : "text-[#8aa3ad]"}
                />
                {etiqueta}
              </Link>

              {activo && subItems && subItems.length > 0 && (
                <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-[#1E333A] pl-3">
                  {subItems
                    .filter((sub) => puedeVer(sub, authUser))
                    .map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`px-2 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                          rutaActual === sub.href
                            ? "text-white font-semibold bg-[#1E333A]"
                            : "text-[#8aa3ad] hover:text-white hover:bg-[#1E333A]"
                        }`}
                      >
                        {sub.etiqueta}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 px-3 pb-5 border-t border-[#1E333A] pt-3">
        <button
          onClick={handleLogOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#8aa3ad] hover:bg-[#1E333A] hover:text-rose-400 transition-all duration-150 w-full text-left"
        >
          <LogOut size={16} />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
}
