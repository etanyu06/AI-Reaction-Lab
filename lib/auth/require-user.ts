import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}
