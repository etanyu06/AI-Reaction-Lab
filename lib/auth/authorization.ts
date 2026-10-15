import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type WorkspaceRole = "owner" | "admin" | "researcher" | "viewer";

const roleRank: Record<WorkspaceRole, number> = {
  viewer: 1,
  researcher: 2,
  admin: 3,
  owner: 4
};

export async function getWorkspaceRole(userId: string, workspaceId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Could not verify workspace access.");
  }

  return data?.role as WorkspaceRole | undefined;
}

export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowedRoles: WorkspaceRole[]
) {
  const role = await getWorkspaceRole(userId, workspaceId);

  if (!role || !allowedRoles.includes(role)) {
    throw new AppError("FORBIDDEN", "You do not have access to this workspace.");
  }

  return role;
}

export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole) {
  return roleRank[role] >= roleRank[minimum];
}
