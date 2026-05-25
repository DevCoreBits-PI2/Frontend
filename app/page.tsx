import Link from "next/link";
import {
  Shield,
  Users,
  FileText,
  Star,
  QrCode,
  Clock,
  Database,
  Lock,
  Check,
  X,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#ECEFF1] sticky top-0 bg-white z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0F1819] flex items-center justify-center">
            <Shield size={16} className="text-[#2ECC71]" />
          </div>
          <span className="font-bold text-[#0F1819] text-lg tracking-tight">TalentCore</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#203D47]">
          <a href="#" className="hover:text-[#2ECC71] transition-colors">Tu Cuenta</a>
          <a href="#" className="hover:text-[#2ECC71] transition-colors">Empresa</a>
          <a href="#" className="hover:text-[#2ECC71] transition-colors">Contacto</a>
        </div>
        <Link
          href="/login"
          className="bg-[#0F1819] hover:bg-[#1E333A] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Iniciar Sesión
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 px-8 py-20">
        <div className="flex-1 flex flex-col gap-6">
          <span className="inline-flex items-center gap-2 border border-[#2ECC71] text-[#2ECC71] text-xs font-semibold px-3 py-1 rounded-full w-fit tracking-wide">
            VENTAJAS INSTITUCIONALES
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F1819] leading-tight">
            Gestión integral de tu talento humano, desde el ingreso hasta la salida
          </h1>
          <p className="text-[#8aa3ad] text-lg leading-relaxed max-w-lg">
            Gestiona contratos, empleados, evaluaciones e identificación digital desde una única plataforma institucional diseñada para la seguridad de tu talento.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="bg-[#2ECC71] hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Iniciar Sesión
            </Link>
            <button className="border border-[#203D47] text-[#203D47] font-semibold px-6 py-3 rounded-xl hover:bg-[#ECEFF1] transition-colors">
              Ver Características
            </button>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="flex-1 hidden md:block">
          <div className="bg-[#0F1819] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2ECC71]" />
            </div>
            <div className="bg-[#1E333A] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#ECEFF1] text-xs font-semibold">Panel de Administración</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded bg-[#203D47]" />
                  <div className="w-3 h-3 rounded bg-[#203D47]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Empleados", "Contratos", "Alertas"].map((label) => (
                  <div key={label} className="bg-[#203D47] rounded-lg p-2.5">
                    <div className="w-8 h-1.5 rounded bg-[#2ECC71] mb-2" />
                    <div className="w-12 h-1 rounded bg-[#8aa3ad] mb-1.5" />
                    <p className="text-[#8aa3ad] text-xs">{label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#203D47] rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-[#0F1819] shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="w-24 h-1.5 rounded bg-[#ECEFF1]" />
                      <div className="w-14 h-1 rounded bg-[#8aa3ad]" />
                    </div>
                    <div className="w-10 h-4 rounded-full bg-emerald-900" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHALLENGE / SOLUTION ── */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#ECEFF1] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <X size={16} className="text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-[#0F1819]">El Reto Actual</h2>
            </div>
            <ul className="space-y-3">
              {[
                "Información dispersa en hojas de cálculo y archivos locales.",
                "Sin seguimiento automatizado de fechas y renovaciones de contratos.",
                "Identificación digital ineficiente para el personal en campo.",
                "Falta de trazabilidad del historial laboral de los empleados.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#203D47]">
                  <X size={13} className="text-rose-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0F1819] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-900 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-[#2ECC71]" />
              </div>
              <h2 className="text-xl font-bold text-white">La Solución TalentCore</h2>
            </div>
            <ul className="space-y-3">
              {[
                "Plataforma centralizada con roles y acceso administrativo seguro.",
                "Alertas automáticas de vencimiento y gestión proactiva del talento.",
                "Credencial digital QR del empleado para verificación en cualquier sede.",
                "Historial completo por empleado con eventos y trazabilidad institucional.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#BDD5EA]">
                  <Check size={13} className="text-[#2ECC71] mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0F1819]">Todo lo que necesitas en un solo sistema</h2>
          <p className="text-[#8aa3ad] mt-3 text-base">
            Módulos integrados diseñados para cubrir el ciclo de vida completo de tu personal.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { Icon: Users, title: "Gestión de Empleados", desc: "Registra y busca empleados, evaluaciones y equipos de trabajo." },
            { Icon: FileText, title: "Gestión de Contratos", desc: "Administra cada contrato con seguimiento y alertas de vencimiento." },
            { Icon: Star, title: "Evaluaciones", desc: "Revisa el historial laboral con seguimiento continuo y sin pérdida de datos." },
            { Icon: QrCode, title: "Identificación Digital", desc: "QR único por empleado con verificación institucional en campo." },
          ].map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-2xl border border-[#ECEFF1] hover:border-[#BDD5EA] hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#ECEFF1] flex items-center justify-center">
                <Icon size={20} className="text-[#203D47]" />
              </div>
              <h3 className="font-semibold text-[#0F1819] text-sm leading-snug">{title}</h3>
              <p className="text-[#8aa3ad] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMPACT ── */}
      <section className="bg-[#0F1819] px-8 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-10">Impacto real en tu organización</h2>
            <ul className="space-y-7">
              {[
                { Icon: Clock, title: "Ahorro de tiempo", desc: "Automatiza procesos rutinarios y reduce hasta un 40% la carga administrativa." },
                { Icon: Database, title: "Consolidación total", desc: "Centraliza registros, contratos y evaluaciones en una sola plataforma." },
                { Icon: Lock, title: "Control y seguimiento", desc: "Acceso basado en roles con auditoría completa de cada acción en el sistema." },
              ].map(({ Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1E333A] flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#2ECC71]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{title}</h3>
                    <p className="text-[#8aa3ad] text-sm mt-1 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#1E333A] rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#203D47] flex items-center justify-center">
              <Shield size={32} className="text-[#2ECC71]" />
            </div>
            <h3 className="text-white font-bold text-xl">Seguridad Institucional</h3>
            <p className="text-[#8aa3ad] text-sm">Hecho para trabajar. 100% confiable.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1E333A] px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">¿Listo para acceder a tu plataforma?</h2>
        <p className="text-[#8aa3ad] text-base mb-8 max-w-lg mx-auto leading-relaxed">
          Inicia sesión para seguir gestionando el talento humano y la seguridad institucional de tu organización.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#2ECC71] hover:bg-emerald-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
        >
          Iniciar Sesión
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F1819] px-8 pt-12 pb-6 border-t border-[#1E333A]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#1E333A] flex items-center justify-center">
                <Shield size={13} className="text-[#2ECC71]" />
              </div>
              <span className="font-bold text-white text-sm">TalentCore</span>
            </div>
            <p className="text-[#8aa3ad] text-xs leading-relaxed">
              Tu portal para la gestión del talento humano y la seguridad institucional.
            </p>
          </div>
          {[
            { title: "Navegar", links: ["Tu Cuenta", "Empresa", "Contacto"] },
            { title: "Empresa", links: ["Acerca de Nosotros", "Blog"] },
            { title: "Conecta", links: ["LinkedIn", "Twitter"] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[#8aa3ad] text-xs hover:text-[#BDD5EA] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto pt-6 border-t border-[#1E333A] text-center">
          <p className="text-[#8aa3ad] text-xs">© 2024 TalentCore. Seguridad y Rendimiento Institucional.</p>
        </div>
      </footer>

    </div>
  );
}
