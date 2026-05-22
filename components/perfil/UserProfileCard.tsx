'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Calendar, Edit3, LockKeyhole, FileText, RefreshCw } from 'lucide-react';

import { UserProfile } from '@/types/funcionario';
import type { CareerHistoryDto, PerformanceEvaluationDto } from '@/types/api/career';
import type { Contrato } from '@/services/contratosService';
import { PerformanceMain, PerformanceSidebar } from './PerformanceTab';
import ChangePasswordModal from './ChangePasswordModal';
import ToastNotification from '@/components/ToastNotification';
import { cambiarPasswordUsuario } from '@/services/passwordService';
import { generarQrEmpleado } from '@/services/qrService';
import QRCode from 'qrcode';

interface UserProfileCardProps {
  user: UserProfile;
  onEdit?: () => void;
  isAdmin?: boolean;
  trayectoria: CareerHistoryDto[];
  trayectoriaLoading?: boolean;
  trayectoriaError?: string | null;
  contratos: Contrato[];
  contratosLoading?: boolean;
  contratosError?: string | null;
  evaluaciones: PerformanceEvaluationDto[];
  evaluacionesLoading?: boolean;
  evaluacionesError?: string | null;
}

const CAREER_TYPE_LABEL: Record<string, string> = {
  promotion: 'Promoción',
  transfer: 'Traslado',
  contract_modification: 'Cambio de contrato',
  salary_change: 'Cambio salarial',
  evaluation: 'Evaluación',
};

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  FIJO: 'Contrato a término fijo',
  INDEFINIDO: 'Contrato a término indefinido',
  SERVICIO: 'Prestación de servicios',
  TIEMPO_PARCIAL: 'Tiempo parcial / temporal',
};

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  ACTIVO: 'Activo',
  RENOVADO: 'Renovado',
  EXPIRADO: 'Expirado',
  ANULADO: 'Anulado',
};

const CONTRACT_STATUS_CLASS: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-700',
  RENOVADO: 'bg-sky-100 text-sky-700',
  EXPIRADO: 'bg-amber-100 text-amber-700',
  ANULADO: 'bg-rose-100 text-rose-700',
};

function formatCareerDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase();
}

function formatContractDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADO_CONFIG: Record<
  string,
  { label: string; chipBg: string; chipText: string; dotBg: string }
> = {
  ACTIVO:     { label: 'Activo',     chipBg: 'bg-emerald-500', chipText: 'text-emerald-500', dotBg: 'bg-emerald-500' },
  SUSPENDIDO: { label: 'Suspendido', chipBg: 'bg-amber-400',   chipText: 'text-amber-500',   dotBg: 'bg-amber-400' },
  RETIRADO:   { label: 'Retirado',   chipBg: 'bg-rose-500',    chipText: 'text-rose-500',    dotBg: 'bg-rose-500' },
  INVITADO:   { label: 'Invitado',   chipBg: 'bg-sky-400',     chipText: 'text-sky-500',     dotBg: 'bg-sky-400' },
  INACTIVO:   { label: 'Inactivo',   chipBg: 'bg-slate-400',   chipText: 'text-slate-500',   dotBg: 'bg-slate-400' },
};

export default function UserProfileCard({
  user,
  onEdit,
  isAdmin = false,
  trayectoria,
  trayectoriaLoading,
  trayectoriaError,
  contratos,
  contratosLoading,
  contratosError,
  evaluaciones,
  evaluacionesLoading,
  evaluacionesError,
}: UserProfileCardProps) {
  const [activeTab, setActiveTab] = useState<'trayectoria' | 'contratos' | 'desempeño'>('trayectoria');
  const estadoConfig = ESTADO_CONFIG[user.estado] ?? ESTADO_CONFIG.INACTIVO;
  const isActivo = user.estado === 'ACTIVO';
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordToast, setPasswordToast] = useState<{ title: string; message: string; visible: boolean; isError?: boolean }>({
    title: '',
    message: '',
    visible: false,
  });

  const handleSavePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    // No envolvemos en try/catch: si `cambiarPasswordUsuario` lanza, el modal
    // lo captura y muestra el mensaje en el campo correspondiente.
    await cambiarPasswordUsuario({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    setIsPasswordModalOpen(false);
    setPasswordToast({
      title: 'Contraseña actualizada',
      message: 'La contraseña se cambió correctamente.',
      visible: true,
    });
  };

  const trayectoriaOrdenada = useMemo(
    () => [...trayectoria].sort(
      (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
    ),
    [trayectoria],
  );

  const contratosOrdenados = useMemo(
    () => [...contratos].sort(
      (a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime(),
    ),
    [contratos],
  );

  const codigoVisible = user.codigo ?? user.idFuncionario;

  const iniciales = `${(user.nombre || '').charAt(0)}${(user.apellidos || '').charAt(0)}`.toUpperCase() || '?';

  // QR temporal del empleado. Sólo aplica a empleados; los administradores no
  // están en la tabla employees y POST /employees/:id/qr falla.
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const generarQr = async () => {
    if (isAdmin || !user.idFuncionario) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const resp = await generarQrEmpleado(user.idFuncionario);
      const token = resp.token ?? resp.qrToken ?? null;
      if (!token) throw new Error("El servidor no devolvió un token de QR.");
      setQrToken(token);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "No se pudo generar el QR.");
    } finally {
      setQrLoading(false);
    }
  };

  // Genera el QR al montar (solo empleados).
  useEffect(() => {
    if (isAdmin) return;
    generarQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user.idFuncionario]);

  // Renderizado local del QR: convertimos el token (JWT real del backend) en
  // una data URL usando la librería `qrcode`. El token nunca sale del navegador.
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    if (!qrToken) {
      setQrImageUrl(null);
      return;
    }

    QRCode.toDataURL(qrToken, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0F1819", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelado) setQrImageUrl(url);
      })
      .catch(() => {
        if (!cancelado) setQrError("No se pudo renderizar el QR.");
      });

    return () => { cancelado = true; };
  }, [qrToken]);

  return (
    <div className="min-h-screen bg-platinum-100">
      <div className="border-b border-platinum-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-1 items-start gap-6">
              <div className="relative flex-shrink-0">
                {user.foto ? (
                  <img
                    src={user.foto}
                    alt={`${user.nombre} ${user.apellidos}`}
                    className="h-20 w-20 rounded-lg border-4 border-pale-sky-500 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border-4 border-pale-sky-500 bg-gradient-to-br from-[#203D47] to-[#0F1819] text-xl font-bold text-white shadow-sm">
                    {iniciales}
                  </div>
                )}
                {isActivo && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-ink-black-500 shadow-md">
                    <span className="text-xs font-bold text-white">✓</span>
                  </div>
                )}
              </div>

              <div className="flex-1 pt-1">
                <h1 className="text-3xl font-bold text-jet-black-900">
                  {user.nombre} {user.apellidos}
                </h1>
                <p className="mt-1 font-medium text-platinum-700">{user.cargo} • {user.area}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-platinum-700">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-platinum-600">EMP-{codigoVisible}</span>
                  </span>
                  {user.fechaIngreso && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-platinum-600" />
                      Ingresó {new Date(user.fechaIngreso).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {user.ubicacion && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-platinum-600" />
                      {user.ubicacion}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-3" aria-label={`Estado: ${estadoConfig.label}`}>
                <span className="text-xs font-medium text-platinum-600">Estado</span>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${estadoConfig.dotBg}`} />
                  <span className={`text-sm font-semibold ${estadoConfig.chipText}`}>
                    {estadoConfig.label}
                  </span>
                </div>
              </div>

              {!isAdmin && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400"
                >
                  <Edit3 className="h-4 w-4" />
                  Editar Información
                </button>
              )}

              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400"
              >
                <LockKeyhole className="h-4 w-4" />
                Editar Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-platinum-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-8">
            {[
              { id: 'trayectoria', label: 'Trayectoria', icon: '◆' },
              { id: 'contratos',   label: 'Contratos',   icon: '□' },
              { id: 'desempeño',   label: 'Desempeño',   icon: '▽' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-jet-black-800 text-jet-black-900'
                    : 'border-transparent text-platinum-600 hover:text-jet-black-900'
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {activeTab === 'trayectoria' && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <h2 className="mb-8 text-lg font-bold text-jet-black-900">Trayectoria Profesional</h2>

                {trayectoriaLoading && (
                  <p className="py-6 text-center text-sm text-platinum-700">Cargando trayectoria...</p>
                )}
                {trayectoriaError && (
                  <p className="py-6 text-center text-sm text-rose-500">{trayectoriaError}</p>
                )}
                {!trayectoriaLoading && !trayectoriaError && trayectoriaOrdenada.length === 0 && (
                  <p className="py-6 text-center text-sm text-platinum-700">No hay eventos en tu trayectoria todavía.</p>
                )}

                <div className="space-y-8">
                  {trayectoriaOrdenada.map((item, idx) => (
                    <div key={item.id ?? item.id_record ?? idx} className="flex gap-6">
                      <div className="flex flex-shrink-0 flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pale-sky-600 text-sm font-bold text-white shadow-sm">
                          ●
                        </div>
                        {idx < trayectoriaOrdenada.length - 1 && <div className="mt-4 h-24 w-0.5 bg-platinum-300" />}
                      </div>
                      <div className="flex-1 pb-4 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-platinum-600">
                          {formatCareerDate(item.event_date)} · {CAREER_TYPE_LABEL[item.type] ?? item.type}
                        </p>
                        <h3 className="mt-2 text-base font-bold text-jet-black-900">
                          {CAREER_TYPE_LABEL[item.type] ?? 'Evento de carrera'}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-platinum-700">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'contratos' && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <h2 className="mb-6 text-lg font-bold text-jet-black-900">Contratos</h2>

                {contratosLoading && (
                  <p className="py-6 text-center text-sm text-platinum-700">Cargando contratos...</p>
                )}
                {contratosError && (
                  <p className="py-6 text-center text-sm text-rose-500">{contratosError}</p>
                )}
                {!contratosLoading && !contratosError && contratosOrdenados.length === 0 && (
                  <p className="py-12 text-center text-platinum-700">No hay contratos disponibles en este momento.</p>
                )}

                <div className="space-y-3">
                  {contratosOrdenados.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-4 rounded-lg border border-platinum-200 px-4 py-3 hover:bg-[#fafcfc]">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-jet-black-900">
                            {CONTRACT_TYPE_LABEL[c.tipo] ?? c.tipo}
                          </p>
                          <p className="mt-1 text-xs text-platinum-700">
                            Inicio: {formatContractDate(c.fechaInicio)} · Fin: {formatContractDate(c.fechaFin)}
                          </p>
                          {c.notas && (
                            <p className="mt-1 text-xs italic text-platinum-600 line-clamp-2">{c.notas}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CONTRACT_STATUS_CLASS[c.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                          {CONTRACT_STATUS_LABEL[c.estado] ?? c.estado}
                        </span>
                        {c.pdfUrl && (
                          <a
                            href={c.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-emerald-600 hover:underline"
                          >
                            Ver PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'desempeño' && (
              <PerformanceMain
                evaluations={evaluaciones}
                loading={evaluacionesLoading}
                error={evaluacionesError}
              />
            )}
          </div>

          <div className="space-y-6">
            {activeTab === 'desempeño' && (
              <PerformanceSidebar
                evaluations={evaluaciones}
                loading={evaluacionesLoading}
                error={evaluacionesError}
              />
            )}

            {activeTab !== 'desempeño' && (
              <>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2 border-b border-platinum-200 pb-4">
                    <span className="text-lg">📋</span>
                    <h3 className="font-bold text-jet-black-900">Información Personal</h3>
                  </div>
                  <div className="space-y-5 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Correo</p>
                        <p className="break-words text-xs font-medium text-jet-black-800">{user.email || '—'}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Edad</p>
                        <p className="text-xs font-medium text-jet-black-800">{user.edad ?? '—'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Cargo</p>
                        <p className="text-xs font-medium text-jet-black-800">{user.cargo || '—'}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Departamento</p>
                        <p className="text-xs font-medium text-jet-black-800">{user.area || '—'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Código</p>
                        <p className="text-xs font-medium text-jet-black-800">EMP-{codigoVisible}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Estado</p>
                        <p className="text-xs font-medium text-jet-black-800">{estadoConfig.label}</p>
                      </div>
                    </div>

                    <div className="border-t border-platinum-200 pt-2">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Reporta A</p>
                      <p className="text-xs font-medium text-jet-black-800">{user.reportaA || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-jet-black-800 via-charcoal-blue-800 to-jet-black-900 p-6 text-white shadow-lg">
                  <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/5" />
                  <div className="absolute -bottom-8 -left-8 h-16 w-16 rounded-full bg-white/5" />

                  <div className="relative z-10">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider opacity-60">PASE DIGITAL DE EMPLEADO</span>
                      {!isAdmin && (
                        <button
                          onClick={generarQr}
                          disabled={qrLoading}
                          title="Generar nuevo QR"
                          className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                          <RefreshCw size={14} className={qrLoading ? 'animate-spin' : ''} />
                        </button>
                      )}
                    </div>

                    <div className="mb-4 flex h-44 items-center justify-center rounded-lg bg-white p-3 shadow-lg">
                      {isAdmin ? (
                        <div className="px-3 text-center text-xs text-gray-500">
                          El pase digital QR solo está disponible para empleados.
                        </div>
                      ) : qrLoading && !qrImageUrl ? (
                        <div className="text-xs text-gray-500">Generando QR…</div>
                      ) : qrError ? (
                        <div className="px-3 text-center text-xs text-rose-500">{qrError}</div>
                      ) : qrImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrImageUrl}
                          alt="Código QR del empleado"
                          className="h-full w-auto"
                        />
                      ) : (
                        <div className="text-xs text-gray-500">Sin QR</div>
                      )}
                    </div>

                    <div className="border-t border-white/20 pt-4 text-center">
                      <p className="text-base font-bold uppercase tracking-wide">{user.nombre} {user.apellidos}</p>
                      <p className="mt-2 text-xs font-medium opacity-60">ID {codigoVisible}</p>
                      {!isAdmin && qrToken && (
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-emerald-300/80">
                          El token es temporal · refresca cuando expire
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
      />

      <ToastNotification
        isVisible={passwordToast.visible}
        onClose={() => setPasswordToast((p) => ({ ...p, visible: false }))}
        title={passwordToast.title}
        message={passwordToast.message}
      />
    </div>
  );
}
