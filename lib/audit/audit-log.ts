import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AuditAction =
  | "workspace_created"
  | "workspace_updated"
  | "member_added"
  | "member_removed"
  | "project_created"
  | "project_deleted"
  | "test_created"
  | "test_published"
  | "test_closed"
  | "participant_link_created"
  | "session_created"
  | "session_viewed"
  | "session_deleted"
  | "participant_anonymized"
  | "recording_upload_url_created"
  | "recording_uploaded"
  | "recording_viewed"
  | "recording_deleted"
  | "session_event_ingested"
  | "ai_analysis_requested"
  | "report_viewed"
  | "ai_report_generated"
  | "share_export_created"
  | "consent_accepted"
  | "consent_withdrawn";

export async function writeAuditLog(input: {
  workspaceId?: string | null;
  actorUserId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  sessionId?: string | null;
  participantId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("audit_logs").insert({
    workspace_id: input.workspaceId ?? null,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    session_id: input.sessionId ?? null,
    participant_id: input.participantId ?? null,
    ip_hash: input.ipHash ?? null,
    user_agent: input.userAgent ?? null,
    metadata: input.metadata ?? {}
  });
}
