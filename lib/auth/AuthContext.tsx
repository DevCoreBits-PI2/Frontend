"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { apiGet } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import type { EmployeeDto } from "@/types/api/employee";
import type { AdminDto } from "@/types/api/admin";
import { obtenerAdminActual } from "@/services/adminService";
import { PositionId, type AuthUserContext } from "./roles";
import { setCurrentAuthUser } from "./authCache";
import SessionLoadingScreen from "@/components/auth/SessionLoadingScreen";

interface AuthState {
  ready: boolean;
  session: Session | null;
  user: User | null;
  // Perfil del empleado autenticado (datos del backend).
  profile: EmployeeDto | null;
  // Perfil del administrador, si aplica. Resuelto vía `GET /api/admin/:id`
  // (endpoint preferido por el backend). Si es `null` el usuario no es admin
  // o no tiene registro en la tabla `administrators`.
  adminProfile: AdminDto | null;
  // Resumen rápido para chequeos de rol.
  authUser: AuthUserContext | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function deriveAuthUser(
  session: Session | null,
  profile: EmployeeDto | null,
  adminProfile: AdminDto | null,
): AuthUserContext | null {
  if (!session?.user) return null;
  const meta = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  // El JWT marca isAdmin, pero la verificación de verdad es que exista el
  // registro en `administrators` (resuelto vía GET /api/admin/:id).
  // Aceptamos cualquiera de los dos para tolerar el bootstrap.
  const isAdminFromJwt = meta.isAdmin === true || meta.is_admin === true;
  const isAdmin = isAdminFromJwt || adminProfile !== null;

  let position: PositionId | null = null;
  const rawPos = meta.position;
  if (typeof rawPos === "number") position = rawPos as PositionId;
  else if (profile?.id_position) position = profile.id_position as PositionId;

  return {
    supabaseUserId: session.user.id,
    employeeId: profile?.id ?? null,
    // adminId proviene del registro en `administrators`, resuelto desde el
    // `supabase_user_id`. Este es el id que va en `id_administrator` cuando
    // un admin invita empleados, crea áreas, cargos, etc.
    adminId: adminProfile?.id ?? null,
    position,
    isAdmin,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EmployeeDto | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminDto | null>(null);
  const [ready, setReady] = useState(false);
  const lastFetchedFor = useRef<string | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const data = await apiGet<EmployeeDto>(EMPLOYEES.myProfile(uid));
      setProfile(data);
    } catch (err) {
      // El usuario puede no tener perfil de empleado (caso típico: es admin
      // y no tiene registro en `employees`). Los guards manejan el caso.
      setProfile(null);
      console.warn("[auth] no se pudo cargar el perfil del empleado:", err);
    }
  }, []);

  const loadAdminProfile = useCallback(async (currentSession: Session) => {
    // Sólo intentamos cuando el JWT marca isAdmin: true; el endpoint
    // `GET /api/admin/admin` requiere RoleGuard (admin), así que llamarlo
    // como no-admin sería un 403 garantizado.
    const meta = (currentSession.user.app_metadata ?? {}) as Record<string, unknown>;
    const isAdminFromJwt = meta.isAdmin === true || meta.is_admin === true;
    if (!isAdminFromJwt) {
      setAdminProfile(null);
      return;
    }

    try {
      const admin = await obtenerAdminActual(currentSession.user.id);
      setAdminProfile(admin);
      if (!admin) {
        console.warn(
          "[auth] el JWT marca isAdmin pero no hay registro en la tabla administrators",
        );
      }
    } catch (err) {
      setAdminProfile(null);
      console.warn("[auth] no se pudo verificar el perfil de admin:", err);
    }
  }, []);

  // Decide qué fetch hacer en base al JWT. Si es admin → sólo loadAdminProfile
  // (evita el 500 de getMyProfile al buscar en employees). Si no es admin →
  // sólo loadProfile (employees). Nunca dispara los dos.
  const loadAuthData = useCallback(
    async (currentSession: Session) => {
      const meta = (currentSession.user.app_metadata ?? {}) as Record<string, unknown>;
      const isAdminFromJwt = meta.isAdmin === true || meta.is_admin === true;

      if (isAdminFromJwt) {
        setProfile(null);
        await loadAdminProfile(currentSession);
      } else {
        setAdminProfile(null);
        await loadProfile(currentSession.user.id);
      }
    },
    [loadProfile, loadAdminProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    await loadAuthData(session);
  }, [session, loadAuthData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAdminProfile(null);
    lastFetchedFor.current = null;
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session) {
        await loadAuthData(data.session);
        lastFetchedFor.current = data.session.user.id;
      }
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      const uid = newSession?.user?.id ?? null;
      if (uid && newSession && uid !== lastFetchedFor.current) {
        await loadAuthData(newSession);
        lastFetchedFor.current = uid;
      }
      if (!uid) {
        setProfile(null);
        setAdminProfile(null);
        lastFetchedFor.current = null;
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, loadAuthData]);

  const authUser = useMemo(
    () => deriveAuthUser(session, profile, adminProfile),
    [session, profile, adminProfile],
  );

  // Espejo del authUser en el cache module-level para que los services puedan
  // chequear permisos sin pasar por React. Se setea DURANTE el render (no en
  // useEffect) para que el cache ya esté disponible cuando los hijos disparen
  // sus useEffects — los effects de hijos corren después del commit, así que
  // un useEffect aquí actualizaría el cache *después* de que un hijo ya hizo
  // su primer fetch. Setearlo en render evita ese race.
  setCurrentAuthUser(authUser);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      user,
      profile,
      adminProfile,
      authUser,
      refreshProfile,
      signOut,
    }),
    [ready, session, user, profile, adminProfile, authUser, refreshProfile, signOut],
  );

  // Mientras Supabase resuelve la sesión y se carga el perfil mostramos un
  // splash global. Sin esto, las páginas se renderizan con authUser=null y
  // pueden parpadear ("login redirect" → render real) o disparar fetches con
  // headers vacíos.
  return (
    <AuthContext.Provider value={value}>
      {!ready && <SessionLoadingScreen />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
