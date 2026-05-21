"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
    return (
      fallback ?? (
        <div className="flex h-screen items-center justify-center">
          <span className="text-sm text-platinum-400">Cargando sesión…</span>
        </div>
      )
    );
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
    <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h2 className="text-xl font-semibold text-ink-black-900">Acceso restringido</h2>
      <p className="max-w-md text-sm text-platinum-400">
        Tu cuenta no tiene permisos para ver esta sección. Si crees que es un error,
        contacta a Talento Humano o a un administrador.
      </p>
    </div>
  );
}
