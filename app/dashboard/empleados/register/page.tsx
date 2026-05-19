"use client";
import React, { useMemo, useState } from "react";
import StepIndicator from "../../../../components/employees/register/StepIndicator";
import PersonalDataStep from "../../../../components/employees/register/PersonalDataStep";
import WorkDetailsStep from "../../../../components/employees/register/WorkDetailsStep";
import ReviewStep from "../../../../components/employees/register/ReviewStep";
import DuplicateDocumentModal from "../../../../components/employees/register/DuplicateDocumentModal";
import {
  AREAS_MOCK,
  POSITIONS_MOCK,
  enviarRegistroMock,
  isDocumentDuplicated,
} from "../../../../services/registerEmployeeService";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<any>({});
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | undefined>(undefined);

  const patch = (p: any) => setData((d: any) => ({ ...d, ...p }));

  const positionName = useMemo(() => {
    const p = POSITIONS_MOCK.find((x) => x.id === data.positionId);
    return p?.nombre;
  }, [data.positionId]);

  const areaName = useMemo(() => {
    const a = AREAS_MOCK.find((x) => x.id === data.areaId);
    return a?.nombre;
  }, [data.areaId]);

  const next = async () => {
    // Validacion temprana del numero de documento al salir del paso 1
    if (step === 1 && isDocumentDuplicated(data.documentNumber)) {
      setDuplicateMessage(undefined);
      setShowDuplicateModal(true);
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      const payload = { ...data, positionName, areaName };
      const res = await enviarRegistroMock(payload);
      if (res.success) {
        setEmployeeId(res.employeeId);
        // Redirigir al directorio de empleados después de confirmar
        setTimeout(() => router.push('/dashboard/empleados'), 1000);
      } else if (res.errorCode === "DUPLICATE_DOCUMENT") {
        setDuplicateMessage(res.errorMessage);
        setShowDuplicateModal(true);
      }
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
      {/* Header Section */}
      <div className="px-8 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#8aa3ad]">Dashboard</span>
            <span className="text-[#8aa3ad]">/</span>
            <span className="text-[#8aa3ad]">Employee Directory</span>
            <span className="text-[#8aa3ad]">/</span>
            <span className="text-[#203D47] font-semibold">Register Employee</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-[#203D47] text-2xl hover:text-gray-600 transition font-bold"
          >
            ×
          </button>
          <h1 className="text-2xl font-bold text-[#203D47]">Register New Employee</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Step Indicator */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <StepIndicator step={step} />
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          {step === 1 && <PersonalDataStep data={data} onChange={patch} />}
          {step === 2 && <WorkDetailsStep data={data} onChange={patch} />}
          {step === 3 && (
            <ReviewStep data={{ ...data, positionName, areaName }} employeeId={employeeId} />
          )}
        </div>

        {/* Footer Actions */}
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
            ← Back to Edit
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard/empleados')}
              className="px-6 py-2 border border-gray-300 rounded text-sm font-semibold text-[#203D47] hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={next}
              className="px-6 py-2 bg-[#2ECC71] text-white rounded text-sm font-semibold hover:bg-green-600 transition"
            >
              {step === 3 ? "Confirm Registration" : "Next →"}
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
