import { fail, ok } from "@/lib/api/responses";
import { AppError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { getSessionOrThrow } from "@/lib/tests/loaders";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { sessionId } = await params;
    const session = await getSessionOrThrow(sessionId);
    await requireWorkspaceRole(user.id, session.workspace_id, [
      "owner",
      "admin",
      "researcher",
      "viewer"
    ]);

    const supabase = createSupabaseAdminClient();
    const { data: report, error } = await supabase
      .from("ai_reports")
      .select("*")
      .eq("session_id", session.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!report) throw new AppError("NOT_FOUND", "Report not found.");

    const { data: sections, error: sectionsError } = await supabase
      .from("ai_report_sections")
      .select("*")
      .eq("ai_report_id", report.id)
      .is("deleted_at", null)
      .order("position");

    if (sectionsError) throw sectionsError;

    await writeAuditLog({
      workspaceId: session.workspace_id,
      actorUserId: user.id,
      action: "report_viewed",
      resourceType: "ai_report",
      resourceId: report.id,
      sessionId: session.id
    });

    return ok({ report, sections: sections ?? [] });
  } catch (error) {
    return fail(error);
  }
}
