import { fail, ok } from "@/lib/api/responses";
import { getClientIpHash, readJson } from "@/lib/api/body";
import { enforceRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { uploadUrlSchema } from "@/lib/validation/api";
import { getSessionForToken } from "@/lib/public/participant-links";
import { createRecordingUpload } from "@/lib/storage/media";
import { writeAuditLog } from "@/lib/audit/audit-log";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const input = uploadUrlSchema.parse(await readJson(request));
    const ipHash = getClientIpHash(request);
    await enforceRateLimit({
      key: rateLimitKey(["session", sessionId, "upload_url"]),
      limit: 20,
      windowMs: 60 * 60 * 1000
    });

    const { session } = await getSessionForToken(sessionId, input.token);
    const upload = await createRecordingUpload({
      session,
      type: input.recordingType,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      durationSeconds: input.durationSeconds,
      checksumSha256: input.checksumSha256
    });

    await writeAuditLog({
      workspaceId: session.workspace_id,
      action: "recording_upload_url_created",
      resourceType: "recording",
      resourceId: upload.recordingId,
      sessionId: session.id,
      participantId: session.participant_id,
      ipHash,
      userAgent: request.headers.get("user-agent"),
      metadata: {
        recordingType: input.recordingType,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        durationSeconds: input.durationSeconds
      }
    });

    return ok({
      recordingId: upload.recordingId,
      uploadUrl: upload.signedUrl,
      uploadMethod: "PUT",
      expiresInSeconds: 600
    });
  } catch (error) {
    return fail(error);
  }
}
