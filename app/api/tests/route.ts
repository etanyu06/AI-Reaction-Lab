import { fail, ok } from "@/lib/api/responses";
import { readJson } from "@/lib/api/body";
import { enforceRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { AppError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { testCreateApiSchema } from "@/lib/validation/api";
import { getProjectOrThrow } from "@/lib/tests/loaders";
import { getUsageLimits } from "@/lib/usage/limits";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireApiUser();
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId && !projectId) {
      return ok({ tests: [] });
    }

    let resolvedWorkspaceId = workspaceId ?? "";
    if (projectId) {
      const project = await getProjectOrThrow(projectId);
      resolvedWorkspaceId = project.workspace_id;
    }

    await requireWorkspaceRole(user.id, resolvedWorkspaceId, ["owner", "admin", "researcher", "viewer"]);

    let query = supabase
      .from("tests")
      .select("*")
      .eq("workspace_id", resolvedWorkspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (projectId) query = query.eq("project_id", projectId);
    const { data, error } = await query;
    if (error) throw error;
    return ok({ tests: data ?? [] });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireApiUser();
    await enforceRateLimit({
      key: rateLimitKey(["user", user.id, "create_test"]),
      limit: 30,
      windowMs: 60 * 60 * 1000
    });

    const input = testCreateApiSchema.parse(await readJson(request));
    const project = await getProjectOrThrow(input.projectId);
    await requireWorkspaceRole(user.id, project.workspace_id, ["owner", "admin", "researcher"]);
    const limits = await getUsageLimits(project.workspace_id);

    if (input.maxDurationSeconds > Number(limits.max_recording_duration_seconds)) {
      throw new AppError("LIMIT_EXCEEDED", "This recording duration exceeds the workspace limit.");
    }

    const { data: test, error } = await supabase
      .from("tests")
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        name: input.name.trim(),
        landing_page_url: input.landingPageUrl,
        participant_intro: input.participantIntro,
        status: "draft",
        require_screen: input.requireScreen,
        require_camera: input.requireCamera,
        require_microphone: input.requireMicrophone,
        capture_clicks: input.captureClicks,
        capture_scrolls: input.captureScrolls,
        max_duration_seconds: input.maxDurationSeconds,
        created_by: user.id
      })
      .select("*")
      .single();

    if (error) throw error;

    const taskRows = input.tasks.map((task, index) => ({
      workspace_id: project.workspace_id,
      test_id: test.id,
      position: index + 1,
      type: task.type,
      prompt: task.prompt,
      is_required: task.isRequired,
      metadata: task.metadata
    }));

    const { error: tasksError } = await supabase.from("test_tasks").insert(taskRows);
    if (tasksError) throw tasksError;

    await writeAuditLog({
      workspaceId: project.workspace_id,
      actorUserId: user.id,
      action: "test_created",
      resourceType: "test",
      resourceId: test.id
    });

    return ok({ test }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
