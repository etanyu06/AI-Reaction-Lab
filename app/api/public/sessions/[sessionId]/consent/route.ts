import { fail, ok } from "@/lib/api/responses";
import { getClientIpHash, readJson } from "@/lib/api/body";
import { consentCreateSchema } from "@/lib/validation/api";
import { getSessionForToken } from "@/lib/public/participant-links";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const input = consentCreateSchema.parse(await readJson(request));
    const ipHash = getClientIpHash(request);
    const userAgent = request.headers.get("user-agent") ?? null;
    const { session } = await getSessionForToken(sessionId, input.token);
    const supabase = createSupabaseAdminClient();

    const { data: existing } = await supabase
      .from("consent_records")
      .select("id")
      .eq("session_id", session.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("consent_records").insert({
        workspace_id: session.workspace_id,
        test_id: session.test_id,
        session_id: session.id,
        participant_id: session.participant_id,
        consent_text: input.consentText,
        accepted: true,
        accepted_at: new Date().toISOString(),
        screen_consented: input.screenConsented,
        camera_consented: input.cameraConsented,
        microphone_consented: input.microphoneConsented,
        clicks_consented: input.clicksConsented,
        scrolls_consented: input.scrollsConsented,
        written_responses_consented: input.writtenResponsesConsented,
        ip_hash: ipHash,
        user_agent: userAgent
      });
      if (error) throw error;
    }

    await supabase
      .from("sessions")
      .update({
        status: "consented",
        consent_status: "accepted",
        updated_at: new Date().toISOString()
      })
      .eq("id", session.id);

    await writeAuditLog({
      workspaceId: session.workspace_id,
      action: "consent_accepted",
      resourceType: "consent_record",
      resourceId: session.id,
      sessionId: session.id,
      participantId: session.participant_id,
      ipHash,
      userAgent
    });

    return ok({ accepted: true });
  } catch (error) {
    return fail(error);
  }
}
