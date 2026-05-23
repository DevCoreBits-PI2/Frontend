import OtpLoginForm from "@/components/auth/OtpLoginForm";

export default function LoginOtpPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* IZQUIERDA */}
      <div className="bg-[#0f2235] text-white flex flex-col justify-between p-10">
        <div className="flex items-center gap-2 font-semibold">
          <p>Portal de Talento Humano</p>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">
            Iniciá sesión con un código enviado a tu correo
          </h1>
          <p className="text-sm text-white/70 mt-3 leading-relaxed">
            ¿Olvidaste tu contraseña o preferís no usarla? Te enviamos un código
            de un solo uso de 6 dígitos a tu correo registrado. Más rápido y sin
            recordar contraseñas.
          </p>
        </div>
      </div>

      {/* DERECHA */}
      <div className="bg-gray-100 flex items-center justify-center">
        <OtpLoginForm />
      </div>
    </div>
  );
}
