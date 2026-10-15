import type { User } from "@supabase/supabase-js";
import { AppError } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedUser = User;

export async function requireApiUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("UNAUTHENTICATED", "Sign in to continue.");
  }

  return { user, supabase };
}
