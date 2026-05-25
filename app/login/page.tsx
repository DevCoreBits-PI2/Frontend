import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

            {/* Fondo de la Izquierda de la pantalla */}
            <div className="bg-[#0f2235] text-white flex flex-col justify-between p-10">

                <div className="flex items-center gap-2 font-semibold">

                    <p>Portal de Talento Humano</p>
                </div>

                <div>
                    
                    <h1 className="text-2xl font-bold mb-2">
                        La puerta de la aplicación para gestionar el talento global
                    </h1>


                </div>


            </div>

            {/* Formulario a la derecha de la pantalla. */}
            <div className="bg-gray-100 flex items-center justify-center">
                <LoginForm />
            </div>
        </div>
    );
}