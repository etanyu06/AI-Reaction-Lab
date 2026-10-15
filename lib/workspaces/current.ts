import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getCurrentWorkspaceForUser(userId: string, requestedWorkspaceId?: string) {
  const supabase = createSupabaseAdminClient();

  if (requestedWorkspaceId) {
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("workspace_id", requestedWorkspaceId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new AppError("INTERNAL_ERROR", "Could not load workspace.");
    if (!data) throw new AppError("FORBIDDEN", "You do not have access to this workspace.");
    return { workspaceId: data.workspace_id as string, role: data.role as string };
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces!inner(deleted_at)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .is("workspaces.deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) throw new AppError("INTERNAL_ERROR", "Could not load workspace.");
  if (!data) throw new AppError("NOT_FOUND", "Create a workspace to continue.");

  return { workspaceId: data.workspace_id as string, role: data.role as string };
}
