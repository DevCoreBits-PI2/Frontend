// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, PauseCircle, PersonStanding } from "lucide-react";

import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/dashboard/StatsCard";
import CriticalContractAlerts from "@/components/dashboard/CriticalContractAlerts";
import DepartmentalHierarchy from "@/components/dashboard/DepartmentalHierarchy";
import { useAuth } from "@/lib/auth/AuthContext";

import {
  obtenerEstadisticas,
  obtenerAlertasContratos,
  obtenerJerarquiaDepartamental,
  EstadisticaDashboard,
  AlertaContrato,
} from "@/services/dashboardService";

import { NodoOrg } from "@/types/orgChart";

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authUser } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticaDashboard | null>(null);
  const [alertas, setAlertas] = useState<AlertaContrato[]>([]);
  const [departamentos, setDepartamentos] = useState<NodoOrg[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Panel Principal reservado para administradores. Cualquier otro rol
  // (HT, jefes, empleados) lo redirigimos a su perfil personal, que es la
  // pantalla por defecto para ellos.
  useEffect(() => {
    if (!ready) return;
    if (!authUser?.isAdmin) {
      router.replace("/dashboard/perfil");
    }
  }, [ready, authUser?.isAdmin, router]);

  useEffect(() => {
    if (!ready || !authUser?.isAdmin) return;
    Promise.all([
      obtenerEstadisticas(),
      obtenerAlertasContratos(),
      obtenerJerarquiaDepartamental(),
    ])
      .then(([stats, alertasData, depsData]) => {
        setEstadisticas(stats);
        setAlertas(alertasData);
        setDepartamentos(depsData);
      })
      .catch(() => setError("No se pudieron cargar los datos del dashboard."))
      .finally(() => setCargando(false));
  }, [ready, authUser?.isAdmin]);

  // Mientras se confirma que es admin (o se redirige), no renderizamos el
  // contenido — evita parpadeo de stats que el usuario no debería ver.
  if (!ready || !authUser?.isAdmin) {
    return <LoadingSpinner mensaje="Cargando panel principal..." />;
  }

  return (
    <div className="flex min-h-full w-full flex-col bg-platinum-50">
      <Header user={null} />

      <main className="flex-1 overflow-auto px-6 py-6">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold text-ink-black-900">Pulso Organizacional</h1>
          <p className="text-sm text-platinum-400">
            Supervision en tiempo real del capital humano y contratos estrategicos.
          </p>
        </div>

        {cargando && <LoadingSpinner mensaje="Cargando panel principal..." />}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-white px-6 py-4 text-sm text-rose-500">
            {error}
          </div>
        )}

        {!cargando && !error && estadisticas && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {/* Las variaciones porcentuales se quitaron: no hay cómputo
                  real de "vs mes anterior", así que mostrar "+0%" mentía. */}
              <StatsCard
                icono={Users}
                etiqueta="Personal Activo"
                valor={estadisticas.personalActivo}
                loading={cargando}
              />
              <StatsCard
                icono={PauseCircle}
                etiqueta="Suspendidos"
                valor={estadisticas.suspendidos}
                etiquetaVariacion={estadisticas.estadoSuspendidos}
                loading={cargando}
              />
              <StatsCard
                icono={PersonStanding}
                etiqueta="Retirados (año actual)"
                valor={estadisticas.retiradosYTD}
                loading={cargando}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <CriticalContractAlerts alertas={alertas} loading={cargando} />
              <DepartmentalHierarchy departamentos={departamentos} loading={cargando} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
