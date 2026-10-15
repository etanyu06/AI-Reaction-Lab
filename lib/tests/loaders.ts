import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getProjectOrThrow(projectId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new AppError("INTERNAL_ERROR", "Could not load project.");
  if (!data) throw new AppError("NOT_FOUND", "Project not found.");
  return data;
}

export async function getTestOrThrow(testId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new AppError("INTERNAL_ERROR", "Could not load test.");
  if (!data) throw new AppError("NOT_FOUND", "Test not found.");
  return data;
}

export async function getSessionOrThrow(sessionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new AppError("INTERNAL_ERROR", "Could not load session.");
  if (!data) throw new AppError("NOT_FOUND", "Session not found.");
  return data;
}
