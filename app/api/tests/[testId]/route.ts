import { fail, ok } from "@/lib/api/responses";
import { readJson } from "@/lib/api/body";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { testUpdateApiSchema } from "@/lib/validation/api";
import { getTestOrThrow } from "@/lib/tests/loaders";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function GET(_request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { testId } = await params;
    const supabase = createSupabaseAdminClient();
    const test = await getTestOrThrow(testId);
    await requireWorkspaceRole(user.id, test.workspace_id, ["owner", "admin", "researcher", "viewer"]);
    const { data: tasks, error } = await supabase
      .from("test_tasks")
      .select("*")
      .eq("test_id", test.id)
      .is("deleted_at", null)
      .order("position");

    if (error) throw error;
    return ok({ test, tasks: tasks ?? [] });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { testId } = await params;
    const input = testUpdateApiSchema.parse(await readJson(request));
    const test = await getTestOrThrow(testId);
    await requireWorkspaceRole(user.id, test.workspace_id, ["owner", "admin", "researcher"]);
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("tests")
      .update({
        name: input.name?.trim() ?? test.name,
        landing_page_url: input.landingPageUrl ?? test.landing_page_url,
        participant_intro: input.participantIntro ?? test.participant_intro,
        require_screen: input.requireScreen ?? test.require_screen,
        require_camera: input.requireCamera ?? test.require_camera,
        require_microphone: input.requireMicrophone ?? test.require_microphone,
        capture_clicks: input.captureClicks ?? test.capture_clicks,
        capture_scrolls: input.captureScrolls ?? test.capture_scrolls,
        max_duration_seconds: input.maxDurationSeconds ?? test.max_duration_seconds,
        updated_at: new Date().toISOString()
      })
      .eq("id", test.id)
      .select("*")
      .single();

    if (error) throw error;

    if (input.tasks) {
      await supabase.from("test_tasks").update({ deleted_at: new Date().toISOString() }).eq("test_id", test.id);
      await supabase.from("test_tasks").insert(
        input.tasks.map((task, index) => ({
          workspace_id: test.workspace_id,
          test_id: test.id,
          position: index + 1,
          type: task.type,
          prompt: task.prompt,
          is_required: task.isRequired,
          metadata: task.metadata
        }))
      );
    }

    return ok({ test: data });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { testId } = await params;
    const test = await getTestOrThrow(testId);
    await requireWorkspaceRole(user.id, test.workspace_id, ["owner", "admin"]);
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("tests")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", test.id);

    if (error) throw error;

    await writeAuditLog({
      workspaceId: test.workspace_id,
      actorUserId: user.id,
      action: "test_closed",
      resourceType: "test",
      resourceId: test.id,
      metadata: { deleted: true }
    });

    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}
