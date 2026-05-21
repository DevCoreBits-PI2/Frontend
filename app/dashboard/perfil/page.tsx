"use client";

import { useEffect, useState } from "react";

import LoadingSpinner from "@/components/LoadingSpinner";
import EditInfoModal from "@/components/perfil/EditInfoModal";
import UserProfileCard from "@/components/perfil/UserProfileCard";
import {
  actualizarPerfilUsuario,
  adminDtoToUserProfile,
  obtenerPerfilUsuario,
} from "@/services/profileService";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserProfile } from "@/types/funcionario";

interface EditInfoPayload {
  fullName?: string;
  emailAddress?: string;
  phoneNumber?: string;
}

export default function PerfilUsuarioPage() {
  const { ready, authUser, adminProfile } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelado = false;

    const cargar = async () => {
      // Si el usuario es admin (verificado vía GET /api/admin/:id), usamos
      // ese perfil directamente. Evita pegarle a getMyProfile (employees),
      // que devolvería 500 porque los admins no están en la tabla employees.
      if (authUser?.isAdmin && adminProfile) {
        if (!cancelado) {
          setUser(adminDtoToUserProfile(adminProfile));
          setLoading(false);
        }
        return;
      }

      // Empleado regular: usar el endpoint de empleados.
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

  const handleSaveInfo = async (data: EditInfoPayload) => {
    if (!user) return;

    // Para admins no hay endpoint de update de perfil de admin (PATCH no existe),
    // así que la edición sólo aplica a empleados. Mostramos la modal igual,
    // pero el guardado contra el backend sólo corre para empleados.
    if (authUser?.isAdmin) {
      setIsModalOpen(false);
      return;
    }

    const [nombre, ...restoNombre] = data.fullName?.trim().split(/\s+/) ?? [];
    const perfilActualizado: UserProfile = {
      ...user,
      nombre: nombre || user.nombre,
      apellidos: restoNombre.length > 0 ? restoNombre.join(" ") : user.apellidos,
      email: data.emailAddress || user.email,
      phone: data.phoneNumber || user.phone,
    };

    const perfilGuardado = await actualizarPerfilUsuario(perfilActualizado);
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
      <UserProfileCard user={user} onEdit={() => setIsModalOpen(true)} />
      <EditInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInfo}
        initialData={{
          fullName: `${user.nombre} ${user.apellidos}`,
          emailAddress: user.email,
          phoneNumber: user.phone,
        }}
      />
    </>
  );
}
