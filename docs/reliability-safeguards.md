# AI Reaction Lab Reliability Safeguards

The highest-risk workflow is participant recording and upload. Reliability design should optimize for three outcomes:

1. Never record before consent.
2. Avoid losing a recording after capture starts.
3. Keep storage, database state, and AI processing consistent enough to recover safely.

## Failure Modes

## Browser Permission Denial

What the user sees:

```txt
Permission was not granted. This test needs screen, camera, and microphone access to continue.
```

If camera/mic is optional:

```txt
Camera was not allowed. You can continue with screen and microphone only if the researcher allows it.
```

What the system does:

- Does not start recording.
- Records a `permission_denied` session event only after consent/session creation.
- Returns participant to device check.
- Keeps existing consent record.

What gets logged:

- `session_events.type = permission_denied`.
- Payload includes permission type, browser support state, and timestamp.
- Abuse/audit log only if repeated denials look automated.

Retry strategy:

- Let participant retry permission request.
- Show browser-specific instructions.

Data consistency strategy:

- Session remains `consented` or `permission_check`.
- No recording row is created unless upload is attempted.

Alerting/monitoring:

- Track permission denial rate by browser/version.
- Alert if denial rate spikes after a release.

## Screen Share Stopped Early

What the user sees:

```txt
Screen sharing stopped. The recorded portion is saved on this device. You can submit the partial session or restart if allowed.
```

What the system does:

- Stops `MediaRecorder`.
- Stops camera/mic tracks.
- Flushes current chunk.
- Persists local chunks/events.
- Moves to upload/recovery flow.

What gets logged:

- `recording_stop` event.
- `error` event with reason `screen_share_ended`.
- Session status transitions to `uploading` or `failed` if upload cannot start.

Retry strategy:

- Allow upload of partial recording.
- Optional restart creates a new session; do not merge sessions in MVP.

Data consistency strategy:

- Mark duration based on captured recording time.
- Report should note session ended early.

Alerting/monitoring:

- Track early screen-share stop rate.

## Camera Unavailable

What the user sees:

```txt
Camera is unavailable or already in use.
```

What the system does:

- If camera is required, block recording and allow retry.
- If optional, continue without camera and record capability state.

What gets logged:

- `permission_denied` or `error` event with `camera_unavailable`.

Retry strategy:

- Let participant recheck devices.
- Suggest closing other apps using the camera.

Data consistency strategy:

- Consent records camera scope separately from actual available track.
- Recording metadata should not claim camera was recorded if no camera track exists.

Alerting/monitoring:

- Monitor camera unavailable rates by browser/OS.

## Microphone Unavailable

What the user sees:

```txt
Microphone is unavailable or muted. Please check your input device.
```

What the system does:

- If mic is required, block recording until resolved.
- If optional, continue without mic and mark transcript quality risk.

What gets logged:

- `permission_denied` or `error` event with `microphone_unavailable`.

Retry strategy:

- Retry device check.
- Let participant select another device later if implemented.

Data consistency strategy:

- Mark transcript as unavailable if no audio track exists.
- AI report uses events/written feedback only.

Alerting/monitoring:

- Track sessions with no audio but mic required.

## User Closes Tab

What the user sees:

- Native browser warning while recording/uploading.
- On return:

```txt
A recording from this session is saved on this device but has not finished uploading. You can retry upload or discard it.
```

What the system does:

- Uses `beforeunload` while recording/uploading.
- Persists chunks, event batches, and manifest to IndexedDB.
- On reload, checks for unfinished local sessions.

What gets logged:

- If possible, send `session_interrupted` via `navigator.sendBeacon`.
- Otherwise recover from local manifest on next load.

Retry strategy:

- Retry upload from IndexedDB.
- Refresh signed URLs.
- If session expired, ask participant to contact researcher.

Data consistency strategy:

- Session remains `recording`, `uploading`, or `failed`.
- Server cleanup job marks abandoned sessions after timeout.

Alerting/monitoring:

- Track abandoned session rate.

## Network Drops During Recording

What the user sees:

```txt
Connection lost. Recording is still being saved on this device.
```

What the system does:

- Continues local recording.
- Stores chunks/events in IndexedDB.
- Pauses upload attempts until online.

What gets logged:

- Local event `network_offline`.
- Server receives event after reconnect.

Retry strategy:

- Retry queued uploads when `online` fires.
- Exponential backoff for failed requests.

Data consistency strategy:

- Local manifest remains source of truth until server finalization.
- Do not mark complete until server confirms upload completion.

Alerting/monitoring:

- Track upload retry count and offline recovery success.

## Upload Chunk Fails

What the user sees:

```txt
Upload is retrying. Your recording is still saved on this device.
```

What the system does:

- Keeps chunk in IndexedDB.
- Marks chunk `failed_retryable`.
- Requests a fresh signed URL if needed.

What gets logged:

- Client local upload attempt count.
- Server abuse event after repeated failures.
- Storage/API error code, sanitized.

Retry strategy:

- Backoff: 2s, 5s, 15s, 30s, 60s.
- Stop automatic retry after a threshold and show manual retry.

Data consistency strategy:

- Chunk manifest tracks uploaded/not uploaded.
- Server finalization verifies all required chunks or full object exists.

Alerting/monitoring:

- Alert on upload failure rate spike.
- Track provider error rates.

## Duplicate Upload Completion Calls

What the user sees:

```txt
Upload complete.
```

What the system does:

- Treats completion as idempotent.
- If recording already `uploaded` or `ready`, returns success.
- Does not double-count storage.

What gets logged:

- First completion logs `recording_uploaded`.
- Duplicate completion can be ignored or logged at debug level.

Retry strategy:

- Client can safely retry completion after timeout.

Data consistency strategy:

- Use `recording_id` as idempotency key.
- Storage usage increments only on first transition from pending/uploading to uploaded.

Alerting/monitoring:

- Track duplicate completions if high; it may indicate client retry instability.

## AI Analysis Fails

What the user sees:

```txt
AI analysis failed temporarily. You can retry after processing is available again.
```

What the system does:

- Marks report `failed`.
- Stores sanitized error message.
- Keeps transcript and recording unchanged.

What gets logged:

- `ai_report_failed` operational event.
- Provider error category, not raw prompt/output.
- Retry count.

Retry strategy:

- Retry transient failures 2 to 3 times.
- Manual researcher retry after failure.

Data consistency strategy:

- Report lifecycle: `pending -> processing -> complete|failed`.
- Existing complete report is not overwritten until replacement succeeds.

Alerting/monitoring:

- Alert on AI failure rate.
- Alert on queue backlog.

## Transcript Generation Fails

What the user sees:

```txt
Transcript generation failed. The recording is still available, and AI analysis may be limited.
```

What the system does:

- Marks transcript `failed`.
- Allows limited report from events/written feedback if enough data exists.

What gets logged:

- `transcript_failed` event.
- Audio availability, duration, provider error category.

Retry strategy:

- Retry transient errors.
- Do not retry if audio track is missing.

Data consistency strategy:

- Transcript failure should not delete recording.
- AI report includes limitation if generated.

Alerting/monitoring:

- Track transcript failure rate and no-audio rate.

## Storage Upload Succeeds But Database Write Fails

What the user sees:

```txt
Upload finished, but final confirmation failed. We are retrying.
```

What the system does:

- Keeps local manifest until DB completion succeeds.
- Retries completion endpoint.
- Server reconciliation job detects orphaned objects if possible.

What gets logged:

- Client completion failure.
- Server DB error.
- Orphan object detection event.

Retry strategy:

- Retry completion with same recording/session metadata.
- If DB recording row is missing, server can recreate from idempotency record if available.

Data consistency strategy:

- Prefer creating DB recording row before issuing upload URL.
- Orphan cleanup job deletes storage objects without matching DB row after grace period.

Alerting/monitoring:

- Alert on orphaned object count.
- Alert on DB write failures in upload completion.

## Database Write Succeeds But Storage Upload Fails

What the user sees:

```txt
Upload did not finish. Your recording is still saved on this device and can be retried.
```

What the system does:

- Recording row remains `pending` or `uploading`.
- Client keeps chunks locally.
- Cleanup job expires stale pending recordings.

What gets logged:

- `upload_failed` event.
- Recording ID, status, retry count, sanitized provider error.

Retry strategy:

- Retry upload with fresh signed URL.
- Manual retry from recovery screen.

Data consistency strategy:

- Do not mark uploaded until object existence is verified.
- Stale `pending` rows are deleted or marked `failed` after timeout.

Alerting/monitoring:

- Track stale pending recordings.

## User Submits Session Twice

What the user sees:

```txt
Session already submitted.
```

What the system does:

- Treats submit/finalize as idempotent.
- Returns current session completion status.

What gets logged:

- First submit logs normal completion.
- Duplicate submit ignored or debug-logged.

Retry strategy:

- Client can retry safely after network timeout.

Data consistency strategy:

- Use `session_id` and `recording_id` idempotency.
- State transitions should be monotonic.

Alerting/monitoring:

- Track duplicate finalization rate.

## Large Video File Size

What the user sees:

```txt
This recording is too large to upload. Please record a shorter session or reduce what you share.
```

What the system does:

- Blocks signed upload URL if claimed size exceeds limit.
- If size grows during recording, warns participant near limit.
- Auto-stops at hard limit if possible.

What gets logged:

- `upload_size_rejected`.
- Session ID, claimed size, limit.

Retry strategy:

- Participant can restart with shorter recording.

Data consistency strategy:

- No upload URL for over-limit file.
- Existing local chunks can be discarded by participant.

Alerting/monitoring:

- Track size rejection rate.

## Long Recording Duration

What the user sees:

```txt
The maximum session length has been reached. Recording is stopping now.
```

What the system does:

- Auto-stops recorder at test/workspace max duration.
- Moves to upload flow.

What gets logged:

- `recording_stop` with reason `max_duration_reached`.

Retry strategy:

- No automatic retry. New session required.

Data consistency strategy:

- Duration validated before upload URL and after upload completion.

Alerting/monitoring:

- Track max-duration stops.

## Expired Signed Upload URL

What the user sees:

```txt
Upload link expired. Getting a fresh upload link.
```

What the system does:

- Requests a new signed URL for the same recording/chunk.
- Does not create duplicate recording rows when idempotency key matches.

What gets logged:

- `upload_url_refreshed` operational event if repeated.

Retry strategy:

- Refresh URL and retry upload.

Data consistency strategy:

- Signed URL expiry does not change recording ownership/status.

Alerting/monitoring:

- Track expired upload URL rate.

## Participant Link Expired Or Revoked

What the user sees:

```txt
This test link is unavailable. It may have expired or been closed.
```

What the system does:

- Blocks new sessions.
- Blocks new upload URLs for sessions not already valid.
- Existing in-progress sessions should be allowed to complete if they were created before revocation, depending on policy.

What gets logged:

- `participant_link_expired_access` or `participant_link_revoked_access`.
- Token hash, IP hash, user agent hash.

Retry strategy:

- Participant contacts researcher for a new link.

Data consistency strategy:

- Link status is checked at session creation.
- Session-scoped upload can continue only if session was already consented.

Alerting/monitoring:

- Alert on repeated access to revoked links.

## Free Usage Limit Reached

What the user sees:

Storage:

```txt
This workspace has reached its storage limit. Delete old recordings before uploading more sessions.
```

AI:

```txt
This workspace has reached today's AI report limit. You can review existing sessions now and generate more reports later.
```

Sessions:

```txt
This test has reached its session limit and is no longer accepting new participants.
```

What the system does:

- Blocks new resource creation before cost is incurred.
- Does not start AI jobs or create upload URLs when limits are exceeded.

What gets logged:

- `workspace_quota_exceeded`.
- `storage_quota_exceeded`.
- `ai_quota_exceeded`.

Retry strategy:

- Retry after daily reset for AI.
- Delete old media for storage.
- Close old tests or create fewer sessions.

Data consistency strategy:

- Limit checks happen in server-side route handlers.
- AI usage increments atomically before job enqueue.

Alerting/monitoring:

- Track quota exceeded rates.
- Alert if many workspaces hit storage unexpectedly.

## Cross-Cutting Consistency Rules

- Create DB metadata before issuing upload URLs.
- Never mark recording uploaded until storage object exists.
- Keep local chunks until server finalization succeeds.
- Make completion endpoints idempotent.
- Use monotonic state transitions.
- Store sanitized failure reasons.
- Run cleanup jobs for stale sessions, stale pending recordings, and orphaned objects.
- Do not expose permanent media links.

## Minimum MVP Monitoring Stack

Application errors:

- Sentry for Next.js server/client errors.
- Capture route name, status code, workspace ID, session ID, and sanitized error code.
- Do not capture raw transcripts, signed URLs, participant emails, or recording content.

Product/ops metrics:

- Vercel Analytics or OpenTelemetry metrics.
- Track:
  - Participant link validation failures.
  - Session creation count.
  - Consent acceptance count.
  - Permission denial rate.
  - Recording start/stop count.
  - Upload URL creation count.
  - Upload completion success/failure.
  - Average upload retries.
  - Stale pending recordings.
  - AI analysis success/failure.
  - Transcript success/failure.
  - Storage usage by workspace.
  - Quota exceeded events.

Logs:

- Structured JSON logs from route handlers and workers.
- Include request ID, route, user ID if authenticated, workspace ID, session ID, error code.
- Exclude raw media URLs, signed URLs, transcripts, prompts, and secrets.

Uptime checks:

- Health check route for app.
- Supabase connectivity check.
- Storage signed URL generation check.
- AI provider health check if processing is enabled.

Alerts:

- Upload completion failure rate > 5% over 15 minutes.
- AI report failure rate > 10% over 30 minutes.
- Transcript failure rate > 10% over 30 minutes.
- Orphaned storage objects > threshold.
- Stale pending recordings older than 2 hours.
- Public participant endpoint 429 spike.
- Storage usage growth anomaly.

MVP tooling:

```txt
Sentry
Vercel logs or hosting provider logs
Supabase logs
Supabase scheduled jobs for cleanup
Upstash Redis or Vercel KV for distributed rate limits
Simple internal admin dashboard for failed uploads and stuck sessions
```

Before production, replace in-memory rate limiting with a distributed limiter.
