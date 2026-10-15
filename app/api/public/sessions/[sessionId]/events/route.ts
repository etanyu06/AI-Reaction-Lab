import { fail, ok } from "@/lib/api/responses";
import { getClientIpHash, readJson } from "@/lib/api/body";
import { enforceRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { ingestEventsSchema } from "@/lib/validation/api";
import { getSessionForToken } from "@/lib/public/participant-links";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const input = ingestEventsSchema.parse(await readJson(request));
    await enforceRateLimit({
      key: rateLimitKey(["session", sessionId, "events"]),
      limit: 120,
      windowMs: 60 * 1000
    });

    const { session } = await getSessionForToken(sessionId, input.token);
    const supabase = createSupabaseAdminClient();

    const { data: existing } = await supabase
      .from("session_events")
      .select("id")
      .eq("session_id", session.id)
      .contains("payload", { batchId: input.batchId })
      .limit(1);

    if (existing && existing.length > 0) {
      return ok({ insertedCount: 0, ignoredDuplicate: true });
    }

    const rows = input.events.map((event) => ({
      workspace_id: session.workspace_id,
      test_id: session.test_id,
      session_id: session.id,
      task_id: event.taskId ?? null,
      type: event.type,
      timestamp_ms: event.timestampMs,
      payload: { ...event.payload, batchId: input.batchId }
    }));

    const { error } = await supabase.from("session_events").insert(rows);
    if (error) throw error;

    if (rows.some((row) => row.type === "error" || row.type === "permission_denied")) {
      await writeAuditLog({
        workspaceId: session.workspace_id,
        action: "session_event_ingested",
        resourceType: "session",
        resourceId: session.id,
        sessionId: session.id,
        participantId: session.participant_id,
        ipHash: getClientIpHash(request),
        metadata: { batchId: input.batchId, eventCount: rows.length }
      });
    }

    return ok({ insertedCount: rows.length, ignoredDuplicate: false });
  } catch (error) {
    return fail(error);
  }
}
