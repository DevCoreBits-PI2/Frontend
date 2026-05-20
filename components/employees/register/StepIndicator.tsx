"use client";
import React from "react";

interface Props {
  step: number;
}

const StepIndicator: React.FC<Props> = ({ step }) => {
  const steps = [
    { n: 1, label: "Datos Personales" },
    { n: 2, label: "Detalles Laborales" },
    { n: 3, label: "Revisar y Confirmar" },
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((s, idx) => {
        const isCompleted = s.n < step;
        const isActive = s.n === step;
        const isPending = s.n > step;

        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center w-full">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isActive
                    ? "bg-[#1E333A] text-white shadow-md"
                    : isCompleted
                    ? "bg-[#2ECC71] text-white shadow-md"
                    : "bg-white border-2 border-[#8aa3ad] text-[#8aa3ad]"
                }`}
              >
                {s.n}
              </div>
              <span
                className={`text-xs font-semibold mt-2 ${
                  isActive
                    ? "text-[#203D47]"
                    : isCompleted
                    ? "text-[#2ECC71]"
                    : "text-[#8aa3ad]"
                }`}
              >
                {s.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  isCompleted ? "bg-[#2ECC71]" : "bg-[#8aa3ad]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
