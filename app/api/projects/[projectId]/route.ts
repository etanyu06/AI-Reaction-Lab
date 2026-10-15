import { fail, ok } from "@/lib/api/responses";
import { readJson } from "@/lib/api/body";
import { AppError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { projectUpdateApiSchema } from "@/lib/validation/api";
import { writeAuditLog } from "@/lib/audit/audit-log";

async function loadProject(projectId: string, userId: string) {
  const { supabase } = await requireApiUser();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND", "Project not found.");
  await requireWorkspaceRole(userId, data.workspace_id, ["owner", "admin", "researcher", "viewer"]);
  return data;
}

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { projectId } = await params;
    const project = await loadProject(projectId, user.id);
    return ok({ project });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, supabase } = await requireApiUser();
    const { projectId } = await params;
    const project = await loadProject(projectId, user.id);
    await requireWorkspaceRole(user.id, project.workspace_id, ["owner", "admin", "researcher"]);
    const input = projectUpdateApiSchema.parse(await readJson(request));

    const { data, error } = await supabase
      .from("projects")
      .update({
        name: input.name?.trim() ?? project.name,
        description: input.description === undefined ? project.description : input.description || null,
        status: input.status ?? project.status,
        updated_at: new Date().toISOString()
      })
      .eq("id", project.id)
      .select("*")
      .single();

    if (error) throw error;
    return ok({ project: data });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, supabase } = await requireApiUser();
    const { projectId } = await params;
    const project = await loadProject(projectId, user.id);
    await requireWorkspaceRole(user.id, project.workspace_id, ["owner", "admin"]);

    const { error } = await supabase
      .from("projects")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", project.id);

    if (error) throw error;

    await writeAuditLog({
      workspaceId: project.workspace_id,
      actorUserId: user.id,
      action: "project_deleted",
      resourceType: "project",
      resourceId: project.id
    });

    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}
