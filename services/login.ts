import { createClient } from "@/utils/supabase/client";

type LoginData = {
  email: string;
  password: string;
};

export const loginUser = async ({ email, password }: LoginData) => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const mustSetPassword = user.app_metadata?.mustSetPassword;

  if (mustSetPassword) {
    throw new Error("Debes completar el registro antes de iniciar sesión");
  }

  return data;
};
