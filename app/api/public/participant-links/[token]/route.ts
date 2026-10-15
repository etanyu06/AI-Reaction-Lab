import { fail, ok } from "@/lib/api/responses";
import { getClientIpHash } from "@/lib/api/body";
import { enforceRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { participantTokenSchema } from "@/lib/validation/api";
import { getActiveParticipantLink } from "@/lib/public/participant-links";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const parsedToken = participantTokenSchema.parse(token);
    const ipHash = getClientIpHash(request);
    await enforceRateLimit({
      key: rateLimitKey(["ip", ipHash, "validate_link"]),
      limit: 60,
      windowMs: 60 * 60 * 1000
    });

    const link = await getActiveParticipantLink(parsedToken);
    const supabase = createSupabaseAdminClient();
    const { data: tasks, error } = await supabase
      .from("test_tasks")
      .select("id, position, type, prompt, is_required, metadata")
      .eq("test_id", link.test_id)
      .is("deleted_at", null)
      .order("position");

    if (error) throw error;

    return ok({
      test: {
        id: link.tests.id,
        name: link.tests.name,
        landingPageUrl: link.tests.landing_page_url,
        participantIntro: link.tests.participant_intro,
        requireScreen: link.tests.require_screen,
        requireCamera: link.tests.require_camera,
        requireMicrophone: link.tests.require_microphone,
        captureClicks: link.tests.capture_clicks,
        captureScrolls: link.tests.capture_scrolls,
        maxDurationSeconds: link.tests.max_duration_seconds,
        tasks: tasks ?? []
      }
    });
  } catch (error) {
    return fail(error);
  }
}
