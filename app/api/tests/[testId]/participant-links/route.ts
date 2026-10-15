import { randomBytes } from "crypto";
import { fail, ok } from "@/lib/api/responses";
import { readJson } from "@/lib/api/body";
import { requireApiUser } from "@/lib/auth/server";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { participantLinkCreateSchema } from "@/lib/validation/api";
import { getTestOrThrow } from "@/lib/tests/loaders";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { absoluteUrl } from "@/lib/utils";

function createToken() {
  return randomBytes(32).toString("base64url");
}

export async function POST(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { user } = await requireApiUser();
    const { testId } = await params;
    const input = participantLinkCreateSchema.parse(await readJson(request));
    const test = await getTestOrThrow(testId);
    await requireWorkspaceRole(user.id, test.workspace_id, ["owner", "admin", "researcher"]);

    const expiresAt =
      input.expiresAt ??
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const token = createToken();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("participant_links")
      .insert({
        workspace_id: test.workspace_id,
        test_id: test.id,
        token,
        status: "active",
        max_sessions: input.maxSessions ?? null,
        expires_at: expiresAt,
        created_by: user.id
      })
      .select("*")
      .single();

    if (error) throw error;

    await writeAuditLog({
      workspaceId: test.workspace_id,
      actorUserId: user.id,
      action: "participant_link_created",
      resourceType: "participant_link",
      resourceId: data.id
    });

    return ok(
      {
        participantLink: {
          id: data.id,
          expiresAt: data.expires_at,
          maxSessions: data.max_sessions,
          url: absoluteUrl(`/participate/${token}`)
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
