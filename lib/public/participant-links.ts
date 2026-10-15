import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getActiveParticipantLink(token: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("participant_links")
    .select("*, tests!inner(*, projects!inner(id, workspace_id))")
    .eq("token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Could not validate participant link.");
  }

  if (!data) {
    throw new AppError("NOT_FOUND", "This test link is unavailable.");
  }

  if (data.status !== "active" || data.revoked_at) {
    throw new AppError("TOKEN_REVOKED", "This test link is unavailable.");
  }

  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    throw new AppError("TOKEN_EXPIRED", "This test link is unavailable.");
  }

  if (data.max_sessions !== null && data.session_count >= data.max_sessions) {
    throw new AppError("LIMIT_EXCEEDED", "This test has reached its session limit.");
  }

  if (data.tests.status !== "active" || data.tests.deleted_at) {
    throw new AppError("NOT_FOUND", "This test link is unavailable.");
  }

  return data;
}

export async function getSessionForToken(sessionId: string, token: string) {
  const link = await getActiveParticipantLink(token);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("participant_link_id", link.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new AppError("INTERNAL_ERROR", "Could not load session.");
  if (!data) throw new AppError("NOT_FOUND", "Session not found.");

  return { session: data, link };
}
