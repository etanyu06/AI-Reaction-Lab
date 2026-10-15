# AI Reaction Lab Backend API Design

This design uses Next.js App Router with Server Actions for authenticated product mutations and Route Handlers for public participant, upload, export, and background processing endpoints.

Raw media is never returned by API responses. APIs return recording IDs, status values, and short-lived signed URLs only after authorization checks.

## Common Conventions

### Runtime

- TypeScript.
- Zod for input validation.
- Supabase Auth for authenticated researchers.
- Supabase Postgres with RLS.
- Supabase Storage or R2 for media objects.
- Route Handlers for public/tokenized APIs and file upload URL generation.
- Server Actions for dashboard mutations where form integration is useful.

### Auth Context

```ts
type AuthContext = {
  userId: string;
  email?: string;
};

type WorkspaceRole = "owner" | "admin" | "researcher" | "viewer";
```

### Standard Error Shape

```ts
type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED"
  | "LIMIT_EXCEEDED"
  | "UPLOAD_FAILED"
  | "PROCESSING_FAILED"
  | "INTERNAL_ERROR";

type ApiError = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId: string;
  };
};
```

Do not include stack traces, storage paths, service details, SQL errors, model prompts, or provider error bodies in client-facing errors.

### Standard Success Shape

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};
```

### Shared Zod Schemas

```ts
import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const workspaceRoleSchema = z.enum([
  "owner",
  "admin",
  "researcher",
  "viewer",
]);

export const landingPageUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
    message: "Only http and https URLs are supported",
  });

export const idempotencyKeySchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

export const testTaskSchema = z.object({
  id: uuidSchema.optional(),
  position: z.number().int().min(1).max(5),
  type: z.enum(["instruction", "question", "rating", "written_reaction"]),
  prompt: z.string().min(3).max(1000),
  isRequired: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const participantTokenSchema = z
  .string()
  .min(32)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/);

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
    "error",
  ]),
  timestampMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
  taskId: uuidSchema.optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});
```

### Authorization Helpers

```ts
type RequiredRole = "owner" | "admin" | "researcher" | "viewer";

async function requireWorkspaceRole(
  workspaceId: string,
  allowed: RequiredRole[],
): Promise<void> {
  // Query workspace_members using authenticated Supabase client.
  // Throw FORBIDDEN if no non-deleted membership with an allowed role exists.
}
```

Role rules:

- `owner`, `admin`: workspace settings, members, deletion, audit logs.
- `researcher`: create projects/tests, manage tests, view sessions, request AI analysis.
- `viewer`: read sessions/reports only.

### Rate Limit Keys

Use server-side rate limits. Suggested keys:

- Authenticated mutations: `user:{userId}:action:{name}`.
- Workspace mutations: `workspace:{workspaceId}:action:{name}`.
- Public participant: `ip:{ipHash}:token:{token}:action:{name}`.
- Upload URL: `session:{sessionId}:action:generateUploadUrl`.
- AI jobs: `workspace:{workspaceId}:action:ai`.

### Idempotency

Use an `Idempotency-Key` header or input field for mutation endpoints that create durable resources, trigger processing, or finalize uploads.

Store idempotency records server-side with:

```ts
type IdempotencyRecord = {
  key: string;
  actorType: "user" | "participant" | "worker";
  actorId: string;
  route: string;
  inputHash: string;
  responseBody: unknown;
  expiresAt: string;
};
```

If the same key is reused with a different input hash, return `CONFLICT`.

## Backend Functions

## createWorkspace

Route/action name: `createWorkspace` Server Action, optional `POST /api/workspaces`.

Input schema:

```ts
export const createWorkspaceInput = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const createWorkspaceOutput = z.object({
  workspaceId: uuidSchema,
  name: z.string(),
  role: z.literal("owner"),
});
```

Authentication required: yes.

Authorization rules:

- Any authenticated user can create a workspace.
- Creator becomes `owner`.

Validation rules:

- Normalize and reserve-check slug.
- Enforce workspace count abuse limit server-side if needed.

Rate limits:

- `5/hour/user`.

Audit log events:

- `workspace_created`.

Error handling:

- Duplicate slug: `CONFLICT`.
- Invalid name/slug: `VALIDATION_ERROR`.

Idempotency behavior:

- Required.
- Replaying same key returns existing workspace response.

## inviteWorkspaceMember

Route/action name: `inviteWorkspaceMember` Server Action, `POST /api/workspaces/:workspaceId/invitations`.

Input schema:

```ts
export const inviteWorkspaceMemberInput = z.object({
  workspaceId: uuidSchema,
  email: z.string().email().max(320),
  role: workspaceRoleSchema.exclude(["owner"]),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const inviteWorkspaceMemberOutput = z.object({
  invitationId: uuidSchema.optional(),
  memberId: uuidSchema.optional(),
  email: z.string().email(),
  role: workspaceRoleSchema,
  status: z.enum(["invited", "added_existing_user"]),
});
```

Authentication required: yes.

Authorization rules:

- Only `owner` and `admin`.
- Admin cannot invite an owner.

Validation rules:

- Email normalized to lowercase.
- Cannot invite a deleted/blocked user without explicit restore flow.
- Cannot duplicate active member.

Rate limits:

- `20/day/workspace`.
- `10/hour/user`.

Audit log events:

- `member_added` if user exists and is added.
- `workspace_invitation_created` if invitations table is added later.

Error handling:

- Existing member: `CONFLICT`.
- Unauthorized role assignment: `FORBIDDEN`.

Idempotency behavior:

- Required.
- Same key/email/role returns same invite/member result.

## updateMemberRole

Route/action name: `updateMemberRole` Server Action, `PATCH /api/workspaces/:workspaceId/members/:memberId`.

Input schema:

```ts
export const updateMemberRoleInput = z.object({
  workspaceId: uuidSchema,
  memberId: uuidSchema,
  role: workspaceRoleSchema,
});
```

Output schema:

```ts
export const updateMemberRoleOutput = z.object({
  memberId: uuidSchema,
  role: workspaceRoleSchema,
  updatedAt: z.string().datetime(),
});
```

Authentication required: yes.

Authorization rules:

- Only `owner` and `admin`.
- Only owners can assign or remove `owner`.
- Cannot demote the last owner.
- Cannot change own role from owner if it would leave no owner.

Validation rules:

- Member must belong to workspace.
- Member must not be soft-deleted.

Rate limits:

- `60/hour/workspace`.

Audit log events:

- `member_role_updated`.

Error handling:

- Last-owner violation: `CONFLICT`.
- Member not found: `NOT_FOUND`.

Idempotency behavior:

- Natural idempotency. Setting the same role twice returns success.

## createProject

Route/action name: `createProject` Server Action, `POST /api/projects`.

Input schema:

```ts
export const createProjectInput = z.object({
  workspaceId: uuidSchema,
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const projectOutput = z.object({
  projectId: uuidSchema,
  workspaceId: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["active", "archived", "deleted"]),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.

Validation rules:

- Enforce `usage_limits.max_projects_per_workspace` server-side.
- Trim name.

Rate limits:

- `30/hour/workspace`.

Audit log events:

- `project_created`.

Error handling:

- Usage exceeded: `LIMIT_EXCEEDED`.
- Workspace not found: `NOT_FOUND`.

Idempotency behavior:

- Required.

## createTest

Route/action name: `createTest` Server Action, `POST /api/tests`.

Input schema:

```ts
export const createTestInput = z.object({
  workspaceId: uuidSchema,
  projectId: uuidSchema,
  name: z.string().min(2).max(140),
  landingPageUrl: landingPageUrlSchema,
  participantIntro: z.string().min(10).max(2000),
  tasks: z.array(testTaskSchema).min(3).max(5),
  requireScreen: z.boolean().default(true),
  requireCamera: z.boolean().default(true),
  requireMicrophone: z.boolean().default(true),
  captureClicks: z.boolean().default(true),
  captureScrolls: z.boolean().default(true),
  maxDurationSeconds: z.number().int().min(60).max(1200).default(1200),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const testOutput = z.object({
  testId: uuidSchema,
  workspaceId: uuidSchema,
  projectId: uuidSchema,
  status: z.enum(["draft", "active", "closed", "archived", "deleted"]),
  taskCount: z.number().int(),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.
- Project must belong to workspace.

Validation rules:

- Exactly 3 to 5 tasks for MVP.
- Task positions must be unique and sequential.
- Landing page URL must be HTTP/HTTPS.
- Max duration must not exceed workspace usage limit.

Rate limits:

- `60/hour/workspace`.

Audit log events:

- `test_created`.

Error handling:

- Invalid project/workspace pairing: `VALIDATION_ERROR` or `NOT_FOUND`.
- Duration above limit: `LIMIT_EXCEEDED`.

Idempotency behavior:

- Required.
- Reusing key returns same test and tasks.

## updateTest

Route/action name: `updateTest` Server Action, `PATCH /api/tests/:testId`.

Input schema:

```ts
export const updateTestInput = createTestInput
  .omit({ idempotencyKey: true })
  .partial()
  .extend({
    testId: uuidSchema,
    workspaceId: uuidSchema,
  });
```

Output schema:

```ts
export const updateTestOutput = testOutput.extend({
  updatedAt: z.string().datetime(),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.
- Test must belong to workspace.
- Closed/deleted tests cannot be updated except status/metadata by owner/admin.

Validation rules:

- If tasks are provided, 3 to 5 tasks.
- If published test has sessions, changing tasks should create a revision or be blocked for MVP.

Rate limits:

- `120/hour/workspace`.

Audit log events:

- `test_updated`.

Error handling:

- Editing deleted test: `CONFLICT`.
- Task change after sessions exist: `CONFLICT`.

Idempotency behavior:

- Natural idempotency for PATCH with same body.

## publishTest

Route/action name: `publishTest` Server Action, `POST /api/tests/:testId/publish`.

Input schema:

```ts
export const publishTestInput = z.object({
  workspaceId: uuidSchema,
  testId: uuidSchema,
  createLink: z.boolean().default(true),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const publishTestOutput = z.object({
  testId: uuidSchema,
  status: z.literal("active"),
  participantLinkId: uuidSchema.optional(),
  participantUrl: z.string().url().optional(),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.

Validation rules:

- Test has landing page URL.
- Test has 3 to 5 tasks.
- Enforce `max_active_tests_per_workspace`.
- Consent defaults exist.

Rate limits:

- `30/hour/workspace`.

Audit log events:

- `test_published`.
- `participant_link_created` if a link is created.

Error handling:

- Missing required fields: `VALIDATION_ERROR`.
- Active test limit exceeded: `LIMIT_EXCEEDED`.

Idempotency behavior:

- Required.
- Replaying returns active status and same generated link if created by original request.

## createParticipantLink

Route/action name: `createParticipantLink` Server Action, `POST /api/tests/:testId/participant-links`.

Input schema:

```ts
export const createParticipantLinkInput = z.object({
  workspaceId: uuidSchema,
  testId: uuidSchema,
  expiresAt: z.string().datetime().optional(),
  maxSessions: z.number().int().min(1).max(500).optional(),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const createParticipantLinkOutput = z.object({
  participantLinkId: uuidSchema,
  token: participantTokenSchema,
  participantUrl: z.string().url(),
  expiresAt: z.string().datetime().nullable(),
  maxSessions: z.number().int().nullable(),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.
- Test must be active or publishable draft, depending on product flow.

Validation rules:

- Token must be high-entropy and server-generated.
- Expiration cannot be in the past.

Rate limits:

- `50/day/test`.

Audit log events:

- `participant_link_created`.

Error handling:

- Test deleted/closed: `CONFLICT`.

Idempotency behavior:

- Required.

## validateParticipantLink

Route/action name: `GET /api/public/participant-links/:token`.

Input schema:

```ts
export const validateParticipantLinkInput = z.object({
  token: participantTokenSchema,
});
```

Output schema:

```ts
export const validateParticipantLinkOutput = z.object({
  testId: uuidSchema,
  workspaceName: z.string(),
  testName: z.string(),
  landingPageUrl: z.string().url(),
  participantIntro: z.string().nullable(),
  tasks: z.array(testTaskSchema.pick({
    position: true,
    type: true,
    prompt: true,
    isRequired: true,
  })),
  recording: z.object({
    requireScreen: z.boolean(),
    requireCamera: z.boolean(),
    requireMicrophone: z.boolean(),
    captureClicks: z.boolean(),
    captureScrolls: z.boolean(),
    maxDurationSeconds: z.number().int(),
  }),
});
```

Authentication required: no.

Authorization rules:

- Token must be active, scoped to one test, not expired, not revoked, not soft-deleted.
- Test must be active.

Validation rules:

- Do not return workspace IDs that are not needed by client.
- Do not return participant link row metadata, session counts, storage paths, reports, or internal IDs except test/task IDs needed for event correlation.

Rate limits:

- `60/hour/ip`.
- `120/hour/token`.

Audit log events:

- Optional `participant_link_validated`, sampled or omitted to avoid noisy logs.

Error handling:

- Invalid token: return generic `NOT_FOUND`.
- Expired token: `TOKEN_EXPIRED`.
- Revoked token: `TOKEN_REVOKED`.

Idempotency behavior:

- Read-only.

## createParticipantSession

Route/action name: `POST /api/public/participant-links/:token/sessions`.

Input schema:

```ts
export const createParticipantSessionInput = z.object({
  token: participantTokenSchema,
  displayName: z.string().max(120).optional(),
  email: z.string().email().max(320).optional(),
  browser: z.object({
    userAgent: z.string().max(1000).optional(),
    browserName: z.string().max(80).optional(),
    osName: z.string().max(80).optional(),
    deviceType: z.string().max(80).optional(),
  }).default({}),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const createParticipantSessionOutput = z.object({
  sessionId: uuidSchema,
  expiresAt: z.string().datetime(),
  maxDurationSeconds: z.number().int(),
});
```

Authentication required: no.

Authorization rules:

- Token-scoped only.
- Creates a session only for the linked active test.
- Participant cannot choose workspace/project/test IDs.

Validation rules:

- Enforce `max_sessions_per_test`.
- Enforce participant link `max_sessions`.
- Hash IP server-side if stored.

Rate limits:

- `10/hour/ip/token`.
- `100/day/token`.

Audit log events:

- `session_created`.

Error handling:

- Limit exceeded: `LIMIT_EXCEEDED`.
- Invalid token: generic `NOT_FOUND`.

Idempotency behavior:

- Required.
- Same token/key returns same session.

## generateUploadUrl

Route/action name: `POST /api/public/sessions/:sessionId/upload-url`.

Input schema:

```ts
export const generateUploadUrlInput = z.object({
  token: participantTokenSchema,
  sessionId: uuidSchema,
  recordingType: z.enum(["screen", "camera", "microphone", "combined"]),
  mimeType: z.enum(["video/webm", "audio/webm", "video/mp4", "audio/mp4"]),
  sizeBytes: z.number().int().min(1).max(2_000_000_000),
  durationSeconds: z.number().int().min(1).max(1200),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const generateUploadUrlOutput = z.object({
  recordingId: uuidSchema,
  uploadUrl: z.string().url(),
  uploadMethod: z.enum(["PUT", "POST"]),
  expiresAt: z.string().datetime(),
  maxSizeBytes: z.number().int(),
});
```

Authentication required: no for participant upload; yes for internal researcher-created uploads if ever needed.

Authorization rules:

- Token must belong to the session's participant link.
- Session must have accepted consent.
- Recording type must match test requirements.
- Never let client choose storage path.

Validation rules:

- Duration cannot exceed test/workspace usage limit.
- Size cannot exceed per-recording and workspace storage limits.
- MIME type allowlist only.

Rate limits:

- `20/hour/session`.
- `10/hour/ip/token`.

Audit log events:

- `recording_upload_url_created`.

Error handling:

- Consent missing: `FORBIDDEN`.
- Storage limit exceeded: `LIMIT_EXCEEDED`.
- Signed URL provider error: `UPLOAD_FAILED`.

Idempotency behavior:

- Required.
- Replaying returns the same recording ID and a fresh signed URL for the same storage path.

## completeRecordingUpload

Route/action name: `POST /api/public/sessions/:sessionId/recordings/:recordingId/complete`.

Input schema:

```ts
export const completeRecordingUploadInput = z.object({
  token: participantTokenSchema,
  sessionId: uuidSchema,
  recordingId: uuidSchema,
  sizeBytes: z.number().int().min(1),
  durationSeconds: z.number().int().min(1).max(1200),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const completeRecordingUploadOutput = z.object({
  recordingId: uuidSchema,
  sessionId: uuidSchema,
  status: z.enum(["uploaded", "processing", "ready"]),
  nextStatus: z.enum(["awaiting_events", "ready_for_analysis"]),
});
```

Authentication required: no.

Authorization rules:

- Token/session/recording must match.
- Recording must belong to session.

Validation rules:

- Verify object exists in storage.
- Verify object size matches or is within tolerance.
- Verify duration under limit.
- Update workspace storage usage server-side.

Rate limits:

- `20/hour/session`.

Audit log events:

- `recording_uploaded`.

Error handling:

- Missing object: `UPLOAD_FAILED`.
- Size mismatch: `VALIDATION_ERROR`.

Idempotency behavior:

- Required.
- Completing an already uploaded recording returns current status.

## ingestSessionEvents

Route/action name: `POST /api/public/sessions/:sessionId/events`.

Input schema:

```ts
export const ingestSessionEventsInput = z.object({
  token: participantTokenSchema,
  sessionId: uuidSchema,
  events: z.array(sessionEventSchema).min(1).max(100),
  batchId: idempotencyKeySchema,
});
```

Output schema:

```ts
export const ingestSessionEventsOutput = z.object({
  insertedCount: z.number().int().min(0),
  ignoredDuplicate: z.boolean(),
});
```

Authentication required: no.

Authorization rules:

- Token must belong to the session's participant link.
- Session must not be deleted.
- Events must belong to the session only.

Validation rules:

- Batch max 100 events.
- Timestamp bounded by session max duration.
- Payload allowlist by event type.
- Strip sensitive fields from payload.

Rate limits:

- `120/minute/session`.
- `600/hour/session`.

Audit log events:

- Usually none for every batch.
- Log only suspicious event abuse as `session_event_ingest_blocked`.

Error handling:

- Invalid event type or payload: `VALIDATION_ERROR`.
- Unknown session: generic `NOT_FOUND`.

Idempotency behavior:

- `batchId` required.
- Duplicate batch returns `ignoredDuplicate: true`.

## submitPostSessionFeedback

Route/action name: `POST /api/public/sessions/:sessionId/feedback`.

Input schema:

```ts
export const submitPostSessionFeedbackInput = z.object({
  token: participantTokenSchema,
  sessionId: uuidSchema,
  responses: z.array(z.object({
    taskId: uuidSchema.optional(),
    prompt: z.string().max(1000).optional(),
    value: z.union([
      z.string().max(5000),
      z.number().min(1).max(5),
      z.boolean(),
      z.array(z.string().max(200)).max(10),
    ]),
  })).max(10),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const submitPostSessionFeedbackOutput = z.object({
  sessionId: uuidSchema,
  savedCount: z.number().int(),
});
```

Authentication required: no.

Authorization rules:

- Token/session must match.
- Session must be created by that participant link.

Validation rules:

- Do not accept arbitrary workspace/test IDs.
- Text max lengths enforced.
- Strip HTML.

Rate limits:

- `10/hour/session`.

Audit log events:

- Optional `post_session_feedback_submitted`.

Error handling:

- Late feedback after retention/deletion: `NOT_FOUND`.

Idempotency behavior:

- Required.
- Same key replaces or returns previous saved response set.

## requestAIAnalysis

Route/action name: `requestAIAnalysis` Server Action, `POST /api/sessions/:sessionId/request-analysis`.

Input schema:

```ts
export const requestAIAnalysisInput = z.object({
  workspaceId: uuidSchema,
  sessionId: uuidSchema,
  forceRegenerate: z.boolean().default(false),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const requestAIAnalysisOutput = z.object({
  sessionId: uuidSchema,
  reportId: uuidSchema,
  status: z.enum(["pending", "processing", "complete"]),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.
- Session must belong to workspace.

Validation rules:

- Consent must be accepted.
- At least one uploaded recording must exist.
- Enforce `max_ai_reports_per_day`.
- Lock usage row before incrementing AI counter.

Rate limits:

- `20/hour/workspace`.
- `5/hour/session`.

Audit log events:

- `ai_analysis_requested`.

Error handling:

- No recording: `CONFLICT`.
- AI daily limit exceeded: `LIMIT_EXCEEDED`.

Idempotency behavior:

- Required.
- Existing pending/processing report returned unless `forceRegenerate` is true.

## generateSessionReport

Route/action name: `POST /api/internal/sessions/:sessionId/generate-report`.

Input schema:

```ts
export const generateSessionReportInput = z.object({
  sessionId: uuidSchema,
  reportId: uuidSchema,
  workerSecret: z.string().min(32),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const generateSessionReportOutput = z.object({
  reportId: uuidSchema,
  status: z.enum(["complete", "failed"]),
  sectionCount: z.number().int().min(0),
  clipSuggestionCount: z.number().int().min(0),
});
```

Authentication required: internal worker authentication.

Authorization rules:

- Only trusted worker/server.
- Never callable from browser.

Validation rules:

- Report/session must match.
- Transcript should exist or be generated first.
- AI output must validate against structured output schema before persistence.
- Do not store model chain-of-thought.

Rate limits:

- Queue concurrency controlled by worker.
- Per-workspace AI usage already enforced by `requestAIAnalysis`.

Audit log events:

- `ai_report_generated`.

Error handling:

- Invalid AI JSON: retry with repair once, then `PROCESSING_FAILED`.
- Provider failure: mark report `failed` with sanitized message.

Idempotency behavior:

- Required.
- If report is already complete, return existing result.

## generateTestSummaryReport

Route/action name: `POST /api/tests/:testId/summary-report`.

Input schema:

```ts
export const generateTestSummaryReportInput = z.object({
  workspaceId: uuidSchema,
  testId: uuidSchema,
  sessionIds: z.array(uuidSchema).min(1).max(25).optional(),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const generateTestSummaryReportOutput = z.object({
  testId: uuidSchema,
  includedSessionCount: z.number().int(),
  summary: z.string(),
  recommendations: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    title: z.string(),
    evidenceSessionIds: z.array(uuidSchema),
  })),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.
- All included sessions must belong to the test/workspace.

Validation rules:

- Only complete AI reports can be included.
- Limit to 25 sessions for MVP cost control.
- Enforce daily AI report usage if this persists/generated by AI.

Rate limits:

- `10/day/workspace`.

Audit log events:

- `test_summary_report_generated`.

Error handling:

- No complete reports: `CONFLICT`.
- Too many sessions: `VALIDATION_ERROR`.

Idempotency behavior:

- Required.
- Same input returns same generated summary if available.

## createClip

Route/action name: `createClip` Server Action, `POST /api/sessions/:sessionId/clips`.

Input schema:

```ts
export const createClipInput = z.object({
  workspaceId: uuidSchema,
  sessionId: uuidSchema,
  aiReportId: uuidSchema.optional(),
  aiReportSectionId: uuidSchema.optional(),
  recordingId: uuidSchema.optional(),
  title: z.string().min(2).max(140),
  description: z.string().max(1000).optional(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(1),
  renderVideo: z.boolean().default(false),
  idempotencyKey: idempotencyKeySchema,
}).refine((value) => value.endMs > value.startMs, {
  message: "endMs must be greater than startMs",
  path: ["endMs"],
});
```

Output schema:

```ts
export const createClipOutput = z.object({
  clipId: uuidSchema,
  status: z.enum(["suggested", "processing", "ready"]),
  title: z.string(),
  startMs: z.number().int(),
  endMs: z.number().int(),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`.
- Session/report/recording must belong to workspace.

Validation rules:

- Clip range must fit recording duration.
- MVP can create timestamp clip metadata without rendering video.
- If `renderVideo` true, enqueue worker and enforce storage usage.

Rate limits:

- `100/day/workspace` for metadata clips.
- `20/day/workspace` for rendered clips.

Audit log events:

- `clip_created`.

Error handling:

- Invalid timestamp range: `VALIDATION_ERROR`.
- Recording missing: `NOT_FOUND`.

Idempotency behavior:

- Required.

## deleteParticipantData

Route/action name: `deleteParticipantData` Server Action, `DELETE /api/participants/:participantId`.

Input schema:

```ts
export const deleteParticipantDataInput = z.object({
  workspaceId: uuidSchema,
  participantId: uuidSchema,
  mode: z.enum(["anonymize", "delete_session_data"]),
  reason: z.string().min(3).max(1000),
  idempotencyKey: idempotencyKeySchema,
});
```

Output schema:

```ts
export const deleteParticipantDataOutput = z.object({
  participantId: uuidSchema,
  mode: z.enum(["anonymize", "delete_session_data"]),
  anonymizedAt: z.string().datetime().nullable(),
  deletedSessionIds: z.array(uuidSchema),
});
```

Authentication required: yes for researcher/admin action. A participant self-service deletion flow should be tokenized and separate.

Authorization rules:

- `owner`, `admin` for full deletion.
- `owner`, `admin`, `researcher` for anonymization if product allows.
- Participant must belong to workspace.

Validation rules:

- `anonymize`: clear name, email, external ref, IP hashes where appropriate.
- `delete_session_data`: soft-delete sessions, recordings, transcripts, reports, clips, and queue object deletion.
- Never hard-delete audit logs.

Rate limits:

- `30/day/workspace`.

Audit log events:

- `participant_anonymized`.
- `session_deleted`.
- `recording_deleted`.

Error handling:

- Participant not found: `NOT_FOUND`.
- Storage deletion worker failure: return success for DB soft-delete and expose background status internally.

Idempotency behavior:

- Required.
- Re-running anonymization/deletion returns current final state.

## exportReport

Route/action name: `POST /api/reports/:reportId/export`.

Input schema:

```ts
export const exportReportInput = z.object({
  workspaceId: uuidSchema,
  reportId: uuidSchema,
  format: z.enum(["markdown", "json", "txt"]),
  includeTranscript: z.boolean().default(false),
  includeClipTimestamps: z.boolean().default(true),
  includeParticipantIdentifiers: z.boolean().default(false),
});
```

Output schema:

```ts
export const exportReportOutput = z.object({
  fileName: z.string(),
  contentType: z.enum(["text/markdown", "application/json", "text/plain"]),
  content: z.string(),
});
```

Authentication required: yes.

Authorization rules:

- `owner`, `admin`, `researcher`, `viewer` can export report findings.
- Only `owner`, `admin`, `researcher` can include participant identifiers.
- Report must belong to workspace.

Validation rules:

- Do not include raw recording URLs.
- Redact storage paths.
- Redact internal model/provider metadata.
- If participant was anonymized, identifiers stay redacted regardless of input.

Rate limits:

- `60/hour/user`.
- `200/day/workspace`.

Audit log events:

- `share_export_created`.

Error handling:

- Report not complete: `CONFLICT`.
- Unauthorized identifier export: `FORBIDDEN`.

Idempotency behavior:

- Read-derived export. Idempotency not required unless storing export artifacts.

## Minimal Route Map

Authenticated:

```txt
POST   /api/workspaces
POST   /api/workspaces/:workspaceId/invitations
PATCH  /api/workspaces/:workspaceId/members/:memberId
POST   /api/projects
POST   /api/tests
PATCH  /api/tests/:testId
POST   /api/tests/:testId/publish
POST   /api/tests/:testId/participant-links
POST   /api/sessions/:sessionId/request-analysis
POST   /api/tests/:testId/summary-report
POST   /api/sessions/:sessionId/clips
DELETE /api/participants/:participantId
POST   /api/reports/:reportId/export
```

Public participant:

```txt
GET    /api/public/participant-links/:token
POST   /api/public/participant-links/:token/sessions
POST   /api/public/sessions/:sessionId/upload-url
POST   /api/public/sessions/:sessionId/recordings/:recordingId/complete
POST   /api/public/sessions/:sessionId/events
POST   /api/public/sessions/:sessionId/feedback
```

Internal:

```txt
POST   /api/internal/sessions/:sessionId/generate-report
```

## Sensitive Data Rules

- Do not return storage paths to browsers unless the endpoint is specifically returning a short-lived signed URL.
- Do not expose participant email to viewers by default.
- Do not expose IP hashes outside owner/admin audit views.
- Do not return consent records in public participant APIs.
- Do not let public clients provide workspace IDs, project IDs, or test IDs.
- Do not rely on client-side usage limit checks.
- Do not log raw transcripts or AI prompts in request logs.
- Do not include hidden tracking, biometric analysis, identity verification, or emotion scoring fields in API schemas.
