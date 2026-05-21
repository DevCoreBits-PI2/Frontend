// Identificación digital / Carné QR — ms-usuarios.
//
// Endpoints:
//   POST  /employees/:id/qr      (auth — el empleado o un HumanTalent/Admin)
//   POST  /employees/qr/scan     (OptionalAuthGuard — público con detalle limitado)
//
// El scan acepta solicitudes SIN token; el backend regresa solo los datos
// permitidos al scanner (nombre, cargo, área, estado, foto opcional). Con token,
// devuelve más información según rol.

import { apiPost } from "@/lib/api/client";
import { EMPLOYEES } from "@/lib/api/endpoints";
import type {
  QrEmployeeView,
  QrTokenResponse,
  ScanQrPayload,
} from "@/types/api/employee";

export const generarQrEmpleado = (idEmpleado: number | string) =>
  apiPost<QrTokenResponse>(EMPLOYEES.generateQr(idEmpleado));

// Scan público (sin auth) — para terminales / kioscos.
export const escanearQrPublico = (qrToken: string) =>
  apiPost<QrEmployeeView>(EMPLOYEES.scanQr, { qrToken } as ScanQrPayload, {
    skipAuth: true,
  });

// Scan autenticado — devuelve información ampliada según el rol del scanner.
export const escanearQrAutenticado = (qrToken: string) =>
  apiPost<QrEmployeeView>(EMPLOYEES.scanQr, { qrToken } as ScanQrPayload);
