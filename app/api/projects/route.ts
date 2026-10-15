import { fail, ok } from "@/lib/api/responses";
import { readJson } from "@/lib/api/body";
import { enforceRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { getCurrentWorkspaceForUser } from "@/lib/workspaces/current";
import { projectCreateApiSchema } from "@/lib/validation/api";
import { assertCanCreateProject } from "@/lib/usage/limits";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await requireApiUser();
    const url = new URL(request.url);
    const requestedWorkspaceId = url.searchParams.get("workspaceId") ?? undefined;
    const { workspaceId } = await getCurrentWorkspaceForUser(user.id, requestedWorkspaceId);
    await requireWorkspaceRole(user.id, workspaceId, ["owner", "admin", "researcher", "viewer"]);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ok({ projects: data ?? [] });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireApiUser();
    await enforceRateLimit({
      key: rateLimitKey(["user", user.id, "create_project"]),
      limit: 30,
      windowMs: 60 * 60 * 1000
    });

    const input = projectCreateApiSchema.parse(await readJson(request));
    const { workspaceId } = await getCurrentWorkspaceForUser(user.id, input.workspaceId);
    await requireWorkspaceRole(user.id, workspaceId, ["owner", "admin", "researcher"]);
    await assertCanCreateProject(workspaceId);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        name: input.name.trim(),
        description: input.description || null,
        created_by: user.id
      })
      .select("*")
      .single();

    if (error) throw error;

    await writeAuditLog({
      workspaceId,
      actorUserId: user.id,
      action: "project_created",
      resourceType: "project",
      resourceId: data.id
    });

    return ok({ project: data }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
