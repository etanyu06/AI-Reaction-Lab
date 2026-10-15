import { fail, ok } from "@/lib/api/responses";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { getTestOrThrow } from "@/lib/tests/loaders";
import { assertCanActivateTest } from "@/lib/usage/limits";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function POST(_request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { testId } = await params;
    const test = await getTestOrThrow(testId);
    await requireWorkspaceRole(user.id, test.workspace_id, ["owner", "admin", "researcher"]);

    if (test.status !== "active") {
      await assertCanActivateTest(test.workspace_id);
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tests")
      .update({
        status: "active",
        published_at: test.published_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", test.id)
      .select("*")
      .single();

    if (error) throw error;

    await writeAuditLog({
      workspaceId: test.workspace_id,
      actorUserId: user.id,
      action: "test_published",
      resourceType: "test",
      resourceId: test.id
    });

    return ok({ test: data });
  } catch (error) {
    return fail(error);
  }
}
