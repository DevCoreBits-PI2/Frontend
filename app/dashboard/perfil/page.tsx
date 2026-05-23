"use client";

import { useEffect, useState } from "react";

import LoadingSpinner from "@/components/LoadingSpinner";
import EditInfoModal, { type EditInfoFormValues } from "@/components/perfil/EditInfoModal";
import UserProfileCard from "@/components/perfil/UserProfileCard";
import {
  actualizarPerfilUsuario,
  adminDtoToUserProfile,
  obtenerPerfilUsuario,
} from "@/services/profileService";
import { listarHistorialPorEmpleado } from "@/services/carreraHistorialService";
import { obtenerContratosPorEmpleado, type Contrato } from "@/services/contratosService";
import { listarEvaluacionesPorEmpleado } from "@/services/evaluacionService";
import { saveAvatar } from "@/services/storageService";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserProfile } from "@/types/funcionario";
import type { CareerHistoryDto, PerformanceEvaluationDto } from "@/types/api/career";

export default function PerfilUsuarioPage() {
  const { ready, authUser, adminProfile } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [trayectoria, setTrayectoria] = useState<CareerHistoryDto[]>([]);
  const [trayectoriaLoading, setTrayectoriaLoading] = useState(false);
  const [trayectoriaError, setTrayectoriaError] = useState<string | null>(null);

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratosLoading, setContratosLoading] = useState(false);
  const [contratosError, setContratosError] = useState<string | null>(null);

  const [evaluaciones, setEvaluaciones] = useState<PerformanceEvaluationDto[]>([]);
  const [evaluacionesLoading, setEvaluacionesLoading] = useState(false);
  const [evaluacionesError, setEvaluacionesError] = useState<string | null>(null);

  // 1) Carga el perfil base (employee o admin).
  useEffect(() => {
    if (!ready) return;

    let cancelado = false;

    const cargar = async () => {
      // Si el usuario es admin (verificado vía GET /api/admin/:id), usamos
      // ese perfil directamente. Los admins no están en employees.
      if (authUser?.isAdmin && adminProfile) {
        const baseAdmin = adminDtoToUserProfile(adminProfile);
        if (!cancelado) {
          setUser(baseAdmin);
          setLoading(false);
        }
        return;
      }

      try {
        const perfil = await obtenerPerfilUsuario();
        if (!cancelado) setUser(perfil);
      } catch {
        if (!cancelado) setError("No se pudo cargar el perfil de usuario.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();

    return () => {
      cancelado = true;
    };
  }, [ready, authUser?.isAdmin, adminProfile]);

  // 2) Carga trayectoria/contratos/evaluaciones cuando ya tenemos el employeeId.
  //    Los admins no son empleados, así que para ellos no hay nada que pedir.
  useEffect(() => {
    if (!user || authUser?.isAdmin) {
      setTrayectoria([]);
      setContratos([]);
      setEvaluaciones([]);
      return;
    }

    const employeeId = user.idFuncionario;
    if (!employeeId) return;

    let cancelado = false;

    const fetchAll = async () => {
      setTrayectoriaLoading(true);
      setContratosLoading(true);
      setEvaluacionesLoading(true);
      setTrayectoriaError(null);
      setContratosError(null);
      setEvaluacionesError(null);

      const [historialRes, contratosRes, evaluacionesRes] = await Promise.allSettled([
        listarHistorialPorEmpleado(employeeId, 1, 100),
        obtenerContratosPorEmpleado(String(employeeId)),
        listarEvaluacionesPorEmpleado(employeeId, 1, 100),
      ]);

      if (cancelado) return;

      if (historialRes.status === "fulfilled") {
        setTrayectoria(historialRes.value);
      } else {
        setTrayectoriaError("No se pudo cargar la trayectoria.");
      }
      setTrayectoriaLoading(false);

      if (contratosRes.status === "fulfilled") {
        setContratos(contratosRes.value);
      } else {
        setContratosError("No se pudieron cargar los contratos.");
      }
      setContratosLoading(false);

      if (evaluacionesRes.status === "fulfilled") {
        setEvaluaciones(evaluacionesRes.value);
      } else {
        setEvaluacionesError("No se pudieron cargar las evaluaciones.");
      }
      setEvaluacionesLoading(false);
    };

    fetchAll();

    return () => {
      cancelado = true;
    };
  }, [user, authUser?.isAdmin]);

  const handleSaveInfo = async (data: EditInfoFormValues) => {
    if (!user) return;

    // Los admins no se actualizan vía /employees; el backend no expone PATCH
    // para admins. En la UI el botón está deshabilitado en ese caso, pero si
    // alguien igual abre el modal, fallamos con un error visible.
    if (authUser?.isAdmin) {
      throw new Error(
        "El backend no permite editar administradores. Esta opción solo aplica a empleados.",
      );
    }

    // Subir foto si el usuario eligió una nueva. `saveAvatar` sube vía
    // PATCH /employees/upload-profile-image (Cloudinary), y el backend ya
    // persiste `photo_url` en el empleado autenticado. El backend NO permite
    // borrar la foto (UpdateProfileDto valida @IsUrl), por eso el modal solo
    // ofrece reemplazar.
    if (data.photoFile) {
      await saveAvatar(data.photoFile);
    }

    // PATCH /updateUser solo para edad. El backend lo aceptará aunque no
    // venga photoUrl (es opcional en UpdateProfileDto).
    const perfilGuardado = await actualizarPerfilUsuario({
      idEmployee: user.idFuncionario,
      edad: data.edad ?? undefined,
    });

    setUser(perfilGuardado);
    setIsModalOpen(false);
  };

  if (loading) {
    return <LoadingSpinner mensaje="Cargando perfil de usuario..." />;
  }

  if (error || !user) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white px-6 py-4 text-sm text-rose-500">
        {error || "No se pudo cargar el perfil de usuario."}
      </div>
    );
  }

  return (
    <>
      <UserProfileCard
        user={user}
        onEdit={() => setIsModalOpen(true)}
        isAdmin={!!authUser?.isAdmin}
        trayectoria={trayectoria}
        trayectoriaLoading={trayectoriaLoading}
        trayectoriaError={trayectoriaError}
        contratos={contratos}
        contratosLoading={contratosLoading}
        contratosError={contratosError}
        evaluaciones={evaluaciones}
        evaluacionesLoading={evaluacionesLoading}
        evaluacionesError={evaluacionesError}
      />
      <EditInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInfo}
        readOnly={{
          fullName: `${user.nombre} ${user.apellidos}`.trim(),
          emailAddress: user.email,
        }}
        initialValues={{
          edad: user.edad ?? null,
          currentPhotoUrl: user.foto ?? "",
        }}
      />
    </>
  );
}
