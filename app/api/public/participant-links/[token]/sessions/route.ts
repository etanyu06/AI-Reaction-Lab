import { fail, ok } from "@/lib/api/responses";
import { getClientIpHash, readJson } from "@/lib/api/body";
import { enforceRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { createParticipantSessionSchema, participantTokenSchema } from "@/lib/validation/api";
import { getActiveParticipantLink } from "@/lib/public/participant-links";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertCanCreateSession } from "@/lib/usage/limits";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const parsedToken = participantTokenSchema.parse(token);
    const input = createParticipantSessionSchema.parse(await readJson(request));
    const ipHash = getClientIpHash(request);
    const userAgent = request.headers.get("user-agent") ?? null;

    await enforceRateLimit({
      key: rateLimitKey(["ip", ipHash, "token", parsedToken, "create_session"]),
      limit: 10,
      windowMs: 60 * 60 * 1000
    });

    const link = await getActiveParticipantLink(parsedToken);
    await assertCanCreateSession(link.test_id, link.workspace_id);
    const supabase = createSupabaseAdminClient();

    if (input.idempotencyKey) {
      const { data: existing } = await supabase
        .from("sessions")
        .select("*")
        .eq("participant_link_id", link.id)
        .eq("ip_hash", `${ipHash}:${input.idempotencyKey}`)
        .is("deleted_at", null)
        .maybeSingle();

      if (existing) return ok({ sessionId: existing.id, maxDurationSeconds: link.tests.max_duration_seconds });
    }

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .insert({
        workspace_id: link.workspace_id,
        test_id: link.test_id,
        display_name: input.displayName || null,
        email: input.email || null
      })
      .select("*")
      .single();

    if (participantError) throw participantError;

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        workspace_id: link.workspace_id,
        project_id: link.tests.project_id,
        test_id: link.test_id,
        participant_link_id: link.id,
        participant_id: participant.id,
        status: "created",
        consent_status: "not_requested",
        user_agent: userAgent,
        ip_hash: input.idempotencyKey ? `${ipHash}:${input.idempotencyKey}` : ipHash
      })
      .select("*")
      .single();

    if (sessionError) throw sessionError;

    await supabase
      .from("participant_links")
      .update({ session_count: Number(link.session_count ?? 0) + 1 })
      .eq("id", link.id);

    await writeAuditLog({
      workspaceId: link.workspace_id,
      action: "session_created",
      resourceType: "session",
      resourceId: session.id,
      sessionId: session.id,
      participantId: participant.id,
      ipHash,
      userAgent
    });

    return ok(
      {
        sessionId: session.id,
        maxDurationSeconds: link.tests.max_duration_seconds
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
