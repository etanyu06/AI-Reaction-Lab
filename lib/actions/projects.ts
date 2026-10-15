"use server";

import { revalidatePath } from "next/cache";
import { AppError, normalizeError } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { requireApiUser } from "@/lib/auth/server";
import { assertCanCreateProject } from "@/lib/usage/limits";
import { createProjectSchema } from "@/lib/validation/projects";
import { getCurrentWorkspaceForUser } from "@/lib/workspaces/current";

export type ActionState = {
  ok: boolean;
  message: string;
};

export async function createProjectAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const parsed = createProjectSchema.safeParse({
      workspaceId: formData.get("workspaceId") || undefined,
      name: formData.get("name"),
      description: formData.get("description")
    });

    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Check the project fields."
      };
    }

    const { user, supabase } = await requireApiUser();
    const { workspaceId } = await getCurrentWorkspaceForUser(user.id, parsed.data.workspaceId);
    await requireWorkspaceRole(user.id, workspaceId, ["owner", "admin", "researcher"]);
    await assertCanCreateProject(workspaceId);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        name: parsed.data.name.trim(),
        description: parsed.data.description || null,
        created_by: user.id
      })
      .select("id")
      .single();

    if (error) throw new AppError("INTERNAL_ERROR", "Could not create project.");

    await writeAuditLog({
      workspaceId,
      actorUserId: user.id,
      action: "project_created",
      resourceType: "project",
      resourceId: data.id
    });

    revalidatePath("/dashboard/projects");

    return {
      ok: true,
      message: "Project created."
    };
  } catch (error) {
    return {
      ok: false,
      message: normalizeError(error).message
    };
  }
}
