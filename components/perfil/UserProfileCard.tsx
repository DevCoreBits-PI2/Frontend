'use client';

import { useState } from 'react';
import { MapPin, Calendar, Edit3, LockKeyhole } from 'lucide-react';

import { UserProfile } from '@/types/funcionario';
import { PerformanceMain, PerformanceSidebar } from './PerformanceTab';
import ChangePasswordModal from './ChangePasswordModal';
import ToastNotification from '@/components/ToastNotification';

interface UserProfileCardProps {
  user: UserProfile;
  onEdit?: () => void;
}

export default function UserProfileCard({ user, onEdit }: UserProfileCardProps) {
  const [activeTab, setActiveTab]     = useState<'trayectoria' | 'contratos' | 'desempeño'>('trayectoria');
  const [statusActivo, setStatusActivo] = useState(user.estado === 'ACTIVO');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordToastVisible, setPasswordToastVisible] = useState(false);

  const handleSavePassword = async () => {
    setIsPasswordModalOpen(false);
    setPasswordToastVisible(true);
  };

  return (
    <div className="min-h-screen bg-platinum-100">
      <div className="border-b border-platinum-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-1 items-start gap-6">
              <div className="relative flex-shrink-0">
                <img
                  src={user.foto || '/avatar-placeholder.png'}
                  alt={`${user.nombre} ${user.apellidos}`}
                  className="h-20 w-20 rounded-lg border-4 border-pale-sky-500 object-cover shadow-sm"
                />
                {user.estado === 'ACTIVO' && (
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
                <div className="mt-4 flex gap-6 text-sm text-platinum-700">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-platinum-600">EMP-{user.idFuncionario}-A</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-platinum-600" />
                    Joined {new Date(user.fechaIngreso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-platinum-600" />
                    {user.ubicacion}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              {/* Status toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-platinum-600">Status</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusActivo((v) => !v)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                      statusActivo ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.75 left-0.75 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        statusActivo ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-semibold ${statusActivo ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {statusActivo ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={onEdit}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400"
              >
                <Edit3 className="h-4 w-4" />
                Editar Información
              </button>

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
              { id: 'contratos', label: 'Contratos', icon: '□' },
              { id: 'desempeño', label: 'Desempeño', icon: '▽' },
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
                <h2 className="mb-8 text-lg font-bold text-jet-black-900">Career Timeline</h2>
                <div className="space-y-8">
                  {[
                    {
                      fecha: 'JAN 2024',
                      titulo: 'Promotion to Senior Architect',
                      area: 'ENGINEERING HUB',
                      descripcion: 'Transitioned to leadership role overseeing cloud infrastructure modernization projects across North American regions.',
                      icon: '●',
                    },
                    {
                      fecha: 'JUNE 2021',
                      titulo: 'Transferred to Cloud Division',
                      area: 'STRATEGIC INFRASTRUCTURE',
                      descripcion: 'Departmental move to align with corporate-wide transition towards serverless architecture.',
                      icon: '◆',
                    },
                    {
                      fecha: 'MARCH 2019',
                      titulo: 'Joined as Junior Developer',
                      area: 'CORE PLATFORMS',
                      descripcion: 'Onboarded into the graduate development program focused on legacy system maintenance.',
                      icon: '■',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-6">
                      <div className="flex flex-shrink-0 flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pale-sky-600 text-sm font-bold text-white shadow-sm">
                          {item.icon}
                        </div>
                        {idx < 2 && <div className="mt-4 h-24 w-0.5 bg-platinum-300" />}
                      </div>
                      <div className="flex-1 pb-4 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-platinum-600">{item.fecha} · {item.area}</p>
                        <h3 className="mt-2 text-base font-bold text-jet-black-900">{item.titulo}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-platinum-700">{item.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'contratos' && (
              <div className="rounded-xl bg-white p-8 shadow-sm">
                <h2 className="mb-6 text-lg font-bold text-jet-black-900">Contracts</h2>
                <p className="py-12 text-center text-platinum-700">No contracts available at this time.</p>
              </div>
            )}

            {activeTab === 'desempeño' && <PerformanceMain />}
          </div>

          <div className="space-y-6">
            {activeTab === 'desempeño' && <PerformanceSidebar />}

            {activeTab !== 'desempeño' && (
              <>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-2 border-b border-platinum-200 pb-4">
                    <span className="text-lg">📋</span>
                    <h3 className="font-bold text-jet-black-900">Personal Info</h3>
                  </div>
                  <div className="space-y-5 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Email</p>
                        <p className="break-words text-xs font-medium text-jet-black-800">{user.email}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Phone Number</p>
                        <p className="text-xs font-medium text-jet-black-800">{user.phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Job Role</p>
                        <p className="text-xs font-medium text-jet-black-800">{user.cargo}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Department</p>
                        <p className="text-xs font-medium text-jet-black-800">{user.area}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Birth Date</p>
                        <p className="text-xs font-medium text-jet-black-800">
                          {new Date(user.fechaNacimiento).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Office Location</p>
                        <p className="text-xs font-medium text-jet-black-800">{user.oficina}</p>
                      </div>
                    </div>

                    <div className="border-t border-platinum-200 pt-2">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-platinum-600">Reports To</p>
                      <p className="text-xs font-medium text-jet-black-800">{user.reportaA}</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-jet-black-800 via-charcoal-blue-800 to-jet-black-900 p-6 text-white shadow-lg">
                  <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/5" />
                  <div className="absolute -bottom-8 -left-8 h-16 w-16 rounded-full bg-white/5" />

                  <div className="relative z-10">
                    <div className="mb-6 text-right">
                      <span className="text-xs font-semibold tracking-wider opacity-60">EMPLOYEE DIGITAL PASS</span>
                    </div>

                    <div className="mb-6 flex h-32 items-center justify-center rounded-lg bg-white p-4 shadow-lg">
                      <div className="flex h-28 w-28 items-center justify-center rounded bg-platinum-200">
                        <div className="grid grid-cols-3 gap-1 p-3">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-sm ${[0, 2, 4, 6, 8].includes(i) ? 'bg-jet-black-900' : 'bg-platinum-400'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/20 pt-4 text-center">
                      <p className="text-base font-bold uppercase tracking-wide">{user.nombre} {user.apellidos}</p>
                      <p className="mt-2 text-xs font-medium opacity-60">ID {user.idFuncionario}</p>
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
          isVisible={passwordToastVisible}
          onClose={() => setPasswordToastVisible(false)}
          title="Contraseña actualizada"
          message="La contraseña se cambió correctamente."
        />
    </div>
  );
}
