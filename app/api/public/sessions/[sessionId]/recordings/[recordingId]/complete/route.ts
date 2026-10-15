import { fail, ok } from "@/lib/api/responses";
import { getClientIpHash, readJson } from "@/lib/api/body";
import { AppError } from "@/lib/api/errors";
import { completeUploadSchema } from "@/lib/validation/api";
import { getSessionForToken } from "@/lib/public/participant-links";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; recordingId: string }> }
) {
  try {
    const { sessionId, recordingId } = await params;
    const input = completeUploadSchema.parse(await readJson(request));
    const ipHash = getClientIpHash(request);
    const { session } = await getSessionForToken(sessionId, input.token);
    const supabase = createSupabaseAdminClient();

    const { data: recording, error } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .eq("session_id", session.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    if (!recording) throw new AppError("NOT_FOUND", "Recording not found.");

    if (recording.status === "uploaded" || recording.status === "ready") {
      return ok({ recordingId: recording.id, status: recording.status, idempotent: true });
    }

    if (Number(recording.size_bytes) !== input.sizeBytes) {
      throw new AppError("VALIDATION_ERROR", "Uploaded object size mismatch.");
    }

    const lastSlashIndex = String(recording.storage_path).lastIndexOf("/");
    const directory = String(recording.storage_path).slice(0, lastSlashIndex);
    const fileName = String(recording.storage_path).slice(lastSlashIndex + 1);
    const { data: objects, error: listError } = await supabase.storage
      .from(recording.storage_bucket)
      .list(directory, { search: fileName, limit: 1 });

    if (listError || !objects?.some((object) => object.name === fileName)) {
      throw new AppError("UPLOAD_FAILED", "Uploaded object could not be verified.");
    }

    const { error: updateError } = await supabase
      .from("recordings")
      .update({
        status: "uploaded",
        uploaded_at: new Date().toISOString(),
        duration_seconds: input.durationSeconds,
        checksum_sha256: input.checksumSha256 ?? recording.checksum_sha256,
        updated_at: new Date().toISOString()
      })
      .eq("id", recording.id);

    if (updateError) throw updateError;

    const { data: limits } = await supabase
      .from("usage_limits")
      .select("storage_bytes_used")
      .eq("workspace_id", session.workspace_id)
      .maybeSingle();

    if (limits) {
      await supabase
        .from("usage_limits")
        .update({
          storage_bytes_used: Number(limits.storage_bytes_used ?? 0) + input.sizeBytes,
          updated_at: new Date().toISOString()
        })
        .eq("workspace_id", session.workspace_id);
    }

    await writeAuditLog({
      workspaceId: session.workspace_id,
      action: "recording_uploaded",
      resourceType: "recording",
      resourceId: recording.id,
      sessionId: session.id,
      participantId: session.participant_id,
      ipHash,
      userAgent: request.headers.get("user-agent"),
      metadata: { sizeBytes: input.sizeBytes, durationSeconds: input.durationSeconds }
    });

    return ok({ recordingId: recording.id, status: "uploaded", idempotent: false });
  } catch (error) {
    return fail(error);
  }
}
