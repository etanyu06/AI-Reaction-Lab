"use server";

import { revalidatePath } from "next/cache";
import { AppError, normalizeError } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { requireApiUser } from "@/lib/auth/server";
import { getProjectOrThrow } from "@/lib/tests/loaders";
import { getUsageLimits } from "@/lib/usage/limits";
import { createTestSchema } from "@/lib/validation/tests";

export type TestActionState = {
  ok: boolean;
  message: string;
};

export async function createTestAction(
  _previousState: TestActionState,
  formData: FormData
): Promise<TestActionState> {
  try {
    const tasks = [0, 1, 2, 3, 4]
      .map((index) => ({
        prompt: String(formData.get(`tasks.${index}.prompt`) ?? ""),
        type: "question" as const
      }))
      .filter((task) => task.prompt.trim().length > 0);

    const parsed = createTestSchema.safeParse({
      projectId: formData.get("projectId"),
      workspaceId: formData.get("workspaceId") || undefined,
      name: formData.get("name"),
      landingPageUrl: formData.get("landingPageUrl"),
      participantIntro: formData.get("participantIntro"),
      tasks,
      requireScreen: formData.get("requireScreen") === "on",
      requireCamera: formData.get("requireCamera") === "on",
      requireMicrophone: formData.get("requireMicrophone") === "on",
      captureClicks: formData.get("captureClicks") === "on",
      captureScrolls: formData.get("captureScrolls") === "on",
      maxDurationSeconds: Number(formData.get("maxDurationSeconds") ?? 900)
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Check the test fields."
      };
    }

    const { user, supabase } = await requireApiUser();
    const project = await getProjectOrThrow(parsed.data.projectId);
    await requireWorkspaceRole(user.id, project.workspace_id, ["owner", "admin", "researcher"]);
    const limits = await getUsageLimits(project.workspace_id);

    if (parsed.data.maxDurationSeconds > Number(limits.max_recording_duration_seconds)) {
      throw new AppError("LIMIT_EXCEEDED", "This recording duration exceeds the workspace limit.");
    }

    const { data: test, error } = await supabase
      .from("tests")
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        name: parsed.data.name.trim(),
        landing_page_url: parsed.data.landingPageUrl,
        participant_intro: parsed.data.participantIntro,
        status: "draft",
        require_screen: parsed.data.requireScreen,
        require_camera: parsed.data.requireCamera,
        require_microphone: parsed.data.requireMicrophone,
        capture_clicks: parsed.data.captureClicks,
        capture_scrolls: parsed.data.captureScrolls,
        max_duration_seconds: parsed.data.maxDurationSeconds,
        created_by: user.id
      })
      .select("id")
      .single();

    if (error) throw new AppError("INTERNAL_ERROR", "Could not create test.");

    const { error: tasksError } = await supabase.from("test_tasks").insert(
      parsed.data.tasks.map((task, index) => ({
        workspace_id: project.workspace_id,
        test_id: test.id,
        position: index + 1,
        type: task.type,
        prompt: task.prompt,
        is_required: true,
        metadata: {}
      }))
    );

    if (tasksError) throw new AppError("INTERNAL_ERROR", "Could not create test tasks.");

    await writeAuditLog({
      workspaceId: project.workspace_id,
      actorUserId: user.id,
      action: "test_created",
      resourceType: "test",
      resourceId: test.id
    });

    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);

    return {
      ok: true,
      message: "Test draft created."
    };
  } catch (error) {
    return {
      ok: false,
      message: normalizeError(error).message
    };
  }
}
