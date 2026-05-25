import { createClient } from "@/utils/supabase/client";

export const logOutUser = async () => {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return true;
};
