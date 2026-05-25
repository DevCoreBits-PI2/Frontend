"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "./AuthContext";
import { canManageHumanTalent, hasAnyPosition, PositionId } from "./roles";

interface RouteGuardProps {
  children: React.ReactNode;
  // Cualquiera de estas posiciones permite acceso. Si se omite, basta con estar autenticado.
  positions?: PositionId[];
  // Si es true, exige rol Admin (isAdmin === true) o posición de Talento Humano.
  requireHumanTalent?: boolean;
  // Si es true, exige rol Admin estrictamente.
  requireAdmin?: boolean;
  // A donde redirigir si no hay sesión.
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function RouteGuard({
  children,
  positions,
  requireHumanTalent = false,
  requireAdmin = false,
  redirectTo = "/login",
  fallback,
}: RouteGuardProps) {
  const router = useRouter();
  const { ready, session, authUser } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace(redirectTo);
    }
  }, [ready, session, redirectTo, router]);

  if (!ready) {
    // AuthProvider ya muestra un splash full-screen mientras !ready, así que
    // acá devolvemos null para no duplicar el overlay. El fallback opcional
    // sigue disponible si una sección quiere otra cosa.
    return fallback ?? null;
  }

  if (!session) {
    return fallback ?? null;
  }

  // Chequeos de autorización (no de autenticación).
  if (authUser) {
    if (requireAdmin && !authUser.isAdmin) {
      return <Forbidden />;
    }
    if (requireHumanTalent && !canManageHumanTalent(authUser)) {
      return <Forbidden />;
    }
    if (positions && positions.length > 0 && !hasAnyPosition(authUser, positions)) {
      return <Forbidden />;
    }
  }

  return <>{children}</>;
}

function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f7f8] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
        <ShieldAlert size={26} />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-[#0F1819]">Acceso restringido</h2>
        <p className="mt-1 max-w-md text-sm text-[#576975]">
          Tu cuenta no tiene permisos para ver esta sección. Si crees que es un error,
          contacta a Talento Humano o a un administrador.
        </p>
      </div>
    </div>
  );
}
