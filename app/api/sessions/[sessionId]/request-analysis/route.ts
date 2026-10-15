import { fail, ok } from "@/lib/api/responses";
import { readJson } from "@/lib/api/body";
import { AppError } from "@/lib/api/errors";
import { enforceRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { aiAnalysisRequestSchema } from "@/lib/validation/api";
import { getSessionOrThrow } from "@/lib/tests/loaders";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertCanRequestAiReport } from "@/lib/usage/limits";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { sessionId } = await params;
    const input = aiAnalysisRequestSchema.parse(await readJson(request));
    await enforceRateLimit({
      key: rateLimitKey(["user", user.id, "request_ai_analysis"]),
      limit: 25,
      windowMs: 24 * 60 * 60 * 1000
    });

    const session = await getSessionOrThrow(sessionId);
    await requireWorkspaceRole(user.id, session.workspace_id, ["owner", "admin", "researcher"]);

    if (input.workspaceId && input.workspaceId !== session.workspace_id) {
      throw new AppError("FORBIDDEN", "Workspace does not match this session.");
    }

    if (session.consent_status !== "accepted") {
      throw new AppError("CONFLICT", "Consent is required before AI analysis.");
    }

    const supabase = createSupabaseAdminClient();
    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .select("id")
      .eq("session_id", session.id)
      .in("status", ["uploaded", "processing", "ready"])
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (recordingError) throw recordingError;
    if (!recording) {
      throw new AppError("CONFLICT", "Upload a recording before requesting AI analysis.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("ai_reports")
      .select("*")
      .eq("session_id", session.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing && !input.forceRegenerate) {
      return ok({ reportId: existing.id, status: existing.status, idempotent: true });
    }

    await assertCanRequestAiReport(session.workspace_id);

    const { data: report, error } = await supabase
      .from("ai_reports")
      .insert({
        workspace_id: session.workspace_id,
        project_id: session.project_id,
        test_id: session.test_id,
        session_id: session.id,
        status: "pending",
        structured_output: {}
      })
      .select("*")
      .single();

    if (error) throw error;

    await supabase
      .from("sessions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", session.id);

    await writeAuditLog({
      workspaceId: session.workspace_id,
      actorUserId: user.id,
      action: "ai_analysis_requested",
      resourceType: "ai_report",
      resourceId: report.id,
      sessionId: session.id,
      metadata: { idempotencyKey: input.idempotencyKey }
    });

    return ok({ reportId: report.id, status: report.status, idempotent: false }, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}
