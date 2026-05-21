"use client";
import React, { useEffect, useMemo, useState } from "react";
import StepIndicator from "../../../../components/employees/register/StepIndicator";
import PersonalDataStep from "../../../../components/employees/register/PersonalDataStep";
import WorkDetailsStep from "../../../../components/employees/register/WorkDetailsStep";
import ReviewStep from "../../../../components/employees/register/ReviewStep";
import DuplicateDocumentModal from "../../../../components/employees/register/DuplicateDocumentModal";
import {
  enviarRegistroEmpleado,
  isDocumentDuplicated,
  obtenerAreasParaRegistro,
  obtenerPosicionesParaRegistro,
  type Position,
} from "../../../../services/registerEmployeeService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface RegisterFormState {
  fullName?: string;
  documentType?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  photo?: string;
  age?: number;
  areaId?: string;
  positionId?: string;
  hireDate?: string;
  contractType?: string;
}

const Page = () => {
  const router = useRouter();
  const { authUser } = useAuth();

  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<RegisterFormState>({});
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const [areas, setAreas] = useState<{ id: string; nombre: string }[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    Promise.all([obtenerAreasParaRegistro(), obtenerPosicionesParaRegistro()])
      .then(([a, p]) => {
        setAreas(a);
        setPositions(p);
      })
      .catch(() => toast.error("No se pudo cargar el catálogo de áreas/cargos."));
  }, []);

  const patch = (p: Partial<RegisterFormState>) => setData((d) => ({ ...d, ...p }));

  const positionName = useMemo(
    () => positions.find((x) => x.id === data.positionId)?.nombre,
    [data.positionId, positions],
  );

  const areaName = useMemo(
    () => areas.find((x) => x.id === data.areaId)?.nombre,
    [data.areaId, areas],
  );

  const next = async () => {
    if (step === 1) {
      if (await isDocumentDuplicated(data.documentNumber)) {
        setDuplicateMessage(undefined);
        setShowDuplicateModal(true);
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // `id_administrator` espera el id de la tabla `administrators`. Si quien
    // invita es admin, ese id viene resuelto en authUser.adminId; si es HT
    // empleado actuando, fallback a su employeeId (esquema actual del backend).
    const idAdministrator = authUser?.adminId ?? authUser?.employeeId ?? null;
    if (!idAdministrator) {
      toast.error("Tu perfil no tiene administrador vinculado; no puedes invitar empleados.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await enviarRegistroEmpleado({
        fullName: data.fullName ?? "",
        documentType: data.documentType ?? "",
        documentNumber: data.documentNumber ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        photo: data.photo,
        areaId: data.areaId,
        positionId: data.positionId,
        hireDate: data.hireDate,
        contractType: data.contractType,
        age: data.age,
        idAdministrator,
      });

      if (res.success) {
        setEmployeeId(res.employeeId);
        toast.success("Empleado invitado correctamente.");
        setTimeout(() => router.push("/dashboard/empleados"), 800);
      } else if (res.errorCode === "DUPLICATE_DOCUMENT") {
        setDuplicateMessage(res.errorMessage);
        setShowDuplicateModal(true);
      } else {
        toast.error(res.errorMessage ?? "No se pudo registrar al empleado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryAgainDuplicate = () => {
    setShowDuplicateModal(false);
    setStep(1);
    patch({ documentNumber: "" });
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="bg-[#ECEFF1] min-h-screen">
      <div className="px-8 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#8aa3ad]">Panel</span>
            <span className="text-[#8aa3ad]">/</span>
            <span className="text-[#8aa3ad]">Directorio de Empleados</span>
            <span className="text-[#8aa3ad]">/</span>
            <span className="text-[#203D47] font-semibold">Registrar Empleado</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-[#203D47] text-2xl hover:text-gray-600 transition font-bold"
          >
            ×
          </button>
          <h1 className="text-2xl font-bold text-[#203D47]">Registrar Nuevo Empleado</h1>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <StepIndicator step={step} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          {step === 1 && <PersonalDataStep data={data} onChange={patch} />}
          {step === 2 && <WorkDetailsStep data={data} onChange={patch} />}
          {step === 3 && (
            <ReviewStep data={{ ...data, positionName, areaName }} employeeId={employeeId} />
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={back}
            disabled={step === 1}
            className={`px-6 py-2 border rounded text-sm font-semibold transition ${
              step === 1
                ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                : "border-gray-300 text-[#203D47] hover:bg-gray-50"
            }`}
          >
            ← Volver a Editar
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/empleados")}
              className="px-6 py-2 border border-gray-300 rounded text-sm font-semibold text-[#203D47] hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={next}
              disabled={submitting}
              className="px-6 py-2 bg-[#2ECC71] text-white rounded text-sm font-semibold hover:bg-green-600 transition disabled:opacity-60"
            >
              {step === 3 ? (submitting ? "Enviando…" : "Confirmar Registro") : "Siguiente →"}
            </button>
          </div>
        </div>
      </div>

      <DuplicateDocumentModal
        isOpen={showDuplicateModal}
        message={duplicateMessage}
        onCancel={() => setShowDuplicateModal(false)}
        onTryAgain={handleTryAgainDuplicate}
      />
    </div>
  );
};

export default Page;
