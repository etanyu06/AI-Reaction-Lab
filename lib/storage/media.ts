import { randomUUID } from "crypto";
import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertCanUploadRecording } from "@/lib/usage/limits";

export const MEDIA_BUCKET = "research-media-private";

export const allowedRecordingMimeTypes = [
  "video/webm",
  "audio/webm",
  "video/mp4",
  "audio/mp4"
] as const;

export type RecordingMimeType = (typeof allowedRecordingMimeTypes)[number];

export function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "video/webm":
    case "audio/webm":
      return "webm";
    case "video/mp4":
    case "audio/mp4":
      return "mp4";
    default:
      throw new AppError("VALIDATION_ERROR", "Unsupported file type.");
  }
}

export function buildMediaPath(input: {
  workspaceId: string;
  projectId: string;
  testId: string;
  sessionId: string;
  category: string;
  objectId: string;
  extension: string;
}) {
  return [
    `workspaces/${input.workspaceId}`,
    `projects/${input.projectId}`,
    `tests/${input.testId}`,
    `sessions/${input.sessionId}`,
    input.category,
    `${input.objectId}.${input.extension}`
  ].join("/");
}

export async function createRecordingUpload(input: {
  session: {
    id: string;
    workspace_id: string;
    project_id: string;
    test_id: string;
    consent_status: string;
  };
  type: "screen" | "camera" | "microphone" | "combined";
  mimeType: RecordingMimeType;
  sizeBytes: number;
  durationSeconds: number;
  checksumSha256?: string;
}) {
  if (input.session.consent_status !== "accepted") {
    throw new AppError("FORBIDDEN", "Consent is required before upload.");
  }

  await assertCanUploadRecording({
    workspaceId: input.session.workspace_id,
    sizeBytes: input.sizeBytes,
    durationSeconds: input.durationSeconds
  });

  const supabase = createSupabaseAdminClient();
  const recordingId = randomUUID();
  const extension = extensionForMimeType(input.mimeType);
  const storagePath = buildMediaPath({
    workspaceId: input.session.workspace_id,
    projectId: input.session.project_id,
    testId: input.session.test_id,
    sessionId: input.session.id,
    category: `raw/${input.type}`,
    objectId: recordingId,
    extension
  });

  const { error: insertError } = await supabase.from("recordings").insert({
    id: recordingId,
    workspace_id: input.session.workspace_id,
    test_id: input.session.test_id,
    session_id: input.session.id,
    type: input.type,
    status: "pending",
    storage_bucket: MEDIA_BUCKET,
    storage_path: storagePath,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    duration_seconds: input.durationSeconds,
    checksum_sha256: input.checksumSha256 ?? null
  });

  if (insertError) {
    throw new AppError("INTERNAL_ERROR", "Could not create recording metadata.");
  }

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new AppError("UPLOAD_FAILED", "Could not create upload URL.");
  }

  return {
    recordingId,
    storagePath,
    signedUrl: data.signedUrl,
    path: data.path
  };
}
