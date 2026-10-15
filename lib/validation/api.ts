import { z } from "zod";
import { allowedRecordingMimeTypes } from "@/lib/storage/media";

export const uuidSchema = z.string().uuid();
export const idempotencyKeySchema = z.string().min(16).max(128);
export const participantTokenSchema = z.string().min(16).max(256).regex(/^[A-Za-z0-9_-]+$/);

export const workspaceScopedSchema = z.object({
  workspaceId: uuidSchema.optional()
});

export const projectCreateApiSchema = z.object({
  workspaceId: uuidSchema.optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional().nullable()
});

export const projectUpdateApiSchema = z.object({
  workspaceId: uuidSchema.optional(),
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(["active", "archived"]).optional()
});

export const testTaskApiSchema = z.object({
  prompt: z.string().min(3).max(1000),
  type: z.enum(["instruction", "question", "rating", "written_reaction"]).default("question"),
  isRequired: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const testCreateApiSchema = z.object({
  workspaceId: uuidSchema.optional(),
  projectId: uuidSchema,
  name: z.string().min(2).max(140),
  landingPageUrl: z.string().url().max(2048),
  participantIntro: z.string().min(10).max(2000),
  tasks: z.array(testTaskApiSchema).min(3).max(5),
  requireScreen: z.boolean().default(true),
  requireCamera: z.boolean().default(true),
  requireMicrophone: z.boolean().default(true),
  captureClicks: z.boolean().default(true),
  captureScrolls: z.boolean().default(true),
  maxDurationSeconds: z.number().int().min(60).max(1200).default(900)
});

export const testUpdateApiSchema = testCreateApiSchema
  .omit({ projectId: true, tasks: true })
  .partial()
  .extend({
    workspaceId: uuidSchema.optional(),
    tasks: z.array(testTaskApiSchema).min(3).max(5).optional()
  });

export const participantLinkCreateSchema = z.object({
  workspaceId: uuidSchema.optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxSessions: z.number().int().min(1).max(500).optional().nullable(),
  idempotencyKey: idempotencyKeySchema.optional()
});

export const createParticipantSessionSchema = z.object({
  displayName: z.string().max(120).optional().nullable(),
  email: z.string().email().max(320).optional().nullable(),
  idempotencyKey: idempotencyKeySchema.optional()
});

export const consentCreateSchema = z.object({
  token: participantTokenSchema,
  consentText: z.string().min(20).max(5000),
  screenConsented: z.boolean(),
  cameraConsented: z.boolean(),
  microphoneConsented: z.boolean(),
  clicksConsented: z.boolean(),
  scrollsConsented: z.boolean(),
  writtenResponsesConsented: z.boolean(),
  idempotencyKey: idempotencyKeySchema.optional()
});

export const uploadUrlSchema = z.object({
  token: participantTokenSchema,
  recordingType: z.enum(["screen", "camera", "microphone", "combined"]),
  mimeType: z.enum(allowedRecordingMimeTypes),
  sizeBytes: z.number().int().min(1).max(2_000_000_000),
  durationSeconds: z.number().int().min(1).max(1200),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  idempotencyKey: idempotencyKeySchema
});

export const completeUploadSchema = z.object({
  token: participantTokenSchema,
  sizeBytes: z.number().int().min(1),
  durationSeconds: z.number().int().min(1).max(1200),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  idempotencyKey: idempotencyKeySchema
});

export const sessionEventSchema = z.object({
  type: z.enum([
    "click",
    "scroll",
    "navigation",
    "task_start",
    "task_complete",
    "manual_reaction",
    "recording_start",
    "recording_stop",
    "permission_granted",
    "permission_denied",
    "error"
  ]),
  timestampMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
  taskId: uuidSchema.optional().nullable(),
  payload: z.record(z.string(), z.unknown()).default({})
});

export const ingestEventsSchema = z.object({
  token: participantTokenSchema,
  batchId: idempotencyKeySchema,
  events: z.array(sessionEventSchema).min(1).max(100)
});

export const aiAnalysisRequestSchema = z.object({
  workspaceId: uuidSchema.optional(),
  forceRegenerate: z.boolean().default(false),
  idempotencyKey: idempotencyKeySchema
});
