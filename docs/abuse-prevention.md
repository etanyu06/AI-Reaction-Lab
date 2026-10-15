# AI Reaction Lab Abuse Prevention

AI Reaction Lab is free and handles sensitive media. The abuse model must protect storage, AI processing, participant links, and researcher trust without making the MVP unusable.

The core principle: keep the happy path simple for real users, but enforce cost and abuse controls server-side.

## 1. Free Usage Limits

Default free MVP limits per workspace:

```txt
projects: 5
active tests: 5
participant links per test: 5
sessions per test: 25
recording duration: 15 minutes
recording size: 1 GB per session
workspace storage: 10 GB
AI reports: 25 per day
test summary reports: 5 per day
clip suggestions: included in report
rendered clips: not enabled by default
workspace members: 5
invites: 10 per day
```

Default free MVP limits per user:

```txt
workspace creation: 3 per day
project creation: 20 per day
test creation: 30 per day
manual AI analysis requests: 50 per day
exports: 100 per day
```

Default public participant limits:

```txt
session creation: 10 per hour per IP/token
link validation: 60 per hour per IP
event ingestion: 120 requests per minute per session
upload URL generation: 20 per hour per session
failed uploads: 5 per hour per session
```

Store limits in `usage_limits` and enforce them in trusted server code. Client UI can show limits but must not be the source of truth.

## 2. Rate Limits

Use layered rate limits:

- Per IP hash.
- Per authenticated user ID.
- Per workspace ID.
- Per participant token.
- Per session ID.
- Per endpoint/action.

Suggested limits:

```txt
POST /api/workspaces
  5/hour/user
  20/day/ip

POST /api/workspaces/:id/invitations
  10/day/workspace
  10/hour/user
  30/day/ip

POST /api/projects
  30/hour/workspace
  60/day/user

POST /api/tests
  30/hour/workspace
  60/day/user

POST /api/tests/:id/participant-links
  20/day/test
  50/day/workspace

GET /api/public/participant-links/:token
  60/hour/ip
  120/hour/token

POST /api/public/participant-links/:token/sessions
  10/hour/ip/token
  100/day/token

POST /api/public/sessions/:id/upload-url
  20/hour/session
  10/hour/ip/token

POST /api/public/sessions/:id/events
  120/minute/session
  600/hour/session

POST /api/sessions/:id/request-analysis
  5/hour/session
  25/day/workspace

POST /api/reports/:id/export
  60/hour/user
  100/day/workspace
```

Implementation notes:

- Use Upstash Redis, Vercel KV, Cloudflare Workers KV/Durable Objects, or Supabase-backed counters for MVP.
- Prefer Redis-style atomic increments with TTL.
- Return `429 RATE_LIMITED` with a retry time.
- Never include whether a participant token exists in rate-limit responses.

## 3. Workspace Quotas

Quotas should protect the most expensive resources:

- Storage bytes.
- Recording duration.
- Session count.
- AI reports.
- Active test count.
- Invite count.

Enforce before:

- Project creation.
- Test activation.
- Participant session creation.
- Upload URL generation.
- Upload completion.
- AI analysis request.
- Clip rendering.
- Export artifact creation.

Recommended quota checks:

```txt
current_projects < max_projects_per_workspace
active_tests < max_active_tests_per_workspace
sessions_for_test < max_sessions_per_test
incoming_duration <= max_recording_duration_seconds
storage_bytes_used + incoming_size <= max_storage_bytes_per_workspace
ai_reports_used_today < max_ai_reports_per_day
```

Quotas must be checked in transactions for resources that can be created concurrently.

## 4. Participant Link Expiration Rules

Participant links must be:

- High entropy.
- Scoped to exactly one test.
- Expirable.
- Revocable.
- Count-limited.

Defaults:

```txt
default expiration: 14 days
maximum expiration: 60 days
default max sessions per link: test remaining session allowance
maximum sessions per link: 100
inactive draft tests: no public access
closed tests: no new sessions
revoked links: no validation, no sessions, no uploads
```

Recommended token:

```txt
32+ bytes random
base64url encoded
not sequential
not derived from test ID
```

Public link abuse controls:

- Close test button.
- Revoke link button.
- Regenerate link button.
- Link-level session cap.
- Link-level expiration.
- Suspicious traffic detection.
- Optional CAPTCHA after risk threshold.

When a link is invalid, return generic copy:

```txt
This test link is unavailable. It may have expired or been closed.
```

Do not reveal whether the token existed.

## 5. CAPTCHA Or Bot Protection Strategy

Do not require CAPTCHA for every participant by default. It adds friction to legitimate testers.

Use progressive bot protection:

### Always-on checks

- Rate limit public routes.
- Validate user agent presence.
- Reject obvious datacenter abuse patterns if using an abuse intelligence provider.
- Honeypot field on public session creation.
- Minimum human interaction time before session creation, for example intro page viewed for at least 2 seconds.
- JavaScript challenge through hosting provider if traffic spikes.

### Trigger CAPTCHA when risky

Require CAPTCHA before session creation if:

- Many validations from same IP/token.
- Multiple failed upload URL requests.
- Many sessions created but no recordings uploaded.
- Suspicious user agent.
- Known bad ASN/IP reputation.
- Link receives unusual geographic or traffic spike.

Providers:

- Cloudflare Turnstile preferred for low-friction privacy posture.
- hCaptcha acceptable.

CAPTCHA verification happens server-side. Never trust client-only CAPTCHA state.

## 6. Email Verification Strategy

Researcher accounts:

- Require email verification before creating participant links.
- Allow unverified users to create a workspace/project/test draft.
- Block publishing tests and inviting members until email is verified.

Risk-based restrictions:

- New unverified account cannot upload or request AI analysis.
- New verified account starts with default free quotas.
- If abuse score is elevated, require additional email verification before allowing public links.

Workspace invites:

- Invite recipients must verify email before accessing workspace data.
- Do not expose workspace reports to unverified invited accounts.

User-facing message:

```txt
Verify your email before sharing a participant link. This helps keep free research sessions available for everyone.
```

## 7. Upload Validation Rules

Validate at three stages:

### Before signed upload URL

- Session exists.
- Participant token matches session.
- Consent accepted.
- Test active when session was created.
- Recording type is allowed for test.
- MIME type is allowlisted.
- Claimed size is below max.
- Claimed duration is below max.
- Workspace has storage remaining.
- Failed upload count is below threshold.

### During upload

- Signed URL expires quickly.
- Storage path is server-generated.
- Storage path includes workspace/project/test/session.
- Upload method and content type are constrained when provider supports it.
- Client cannot overwrite arbitrary object path.

### After upload

- Object exists.
- Object size matches expected value.
- Content type matches allowlist where available.
- Checksum matches if provided.
- Duration is probed by worker before AI processing.
- Malware scan if provider/workflow supports it.
- Reject files with unsupported container/codec.

Allowed MVP types:

```txt
video/webm
audio/webm
video/mp4
audio/mp4
image/jpeg
image/png
image/webp
application/json
text/plain
text/markdown
```

Never process:

- Executables.
- HTML uploads.
- SVG uploads from participants.
- Archives.
- Unknown binary blobs.

Repeated failures:

- 3 failed uploads in 10 minutes: slow down.
- 5 failed uploads in 1 hour: block new upload URLs for the session.
- 10 failed uploads for a token/day: require CAPTCHA or revoke link pending review.

## 8. AI Report Generation Limits

AI is cost-sensitive. Generate reports only when preconditions pass:

- Consent accepted.
- Recording uploaded.
- Recording duration within limit.
- Transcript exists or transcription can be generated.
- Workspace daily AI limit available.
- Session has not already produced a complete report unless regeneration is explicitly requested.

Default limits:

```txt
session reports: 25/day/workspace
manual regenerate: 3/session/day
test summary reports: 5/day/workspace
max sessions in summary: 25
max transcript length per session: capped by model budget
```

Abuse controls:

- Lock `usage_limits` row before incrementing AI usage.
- Queue AI jobs.
- Deduplicate jobs by `session_id + report_type + input_hash`.
- Do not regenerate for identical input.
- Reject repeated failed AI requests after threshold.
- Do not run AI on files marked suspicious or failed validation.

Failure behavior:

- Mark report `failed` with sanitized error.
- Do not repeatedly auto-retry provider errors without backoff.
- Retry transient failures at most 2 to 3 times.

## 9. Abuse Detection Events

Create structured abuse events separate from user-facing audit logs or as typed audit metadata.

Events:

```txt
account_signup_rate_limited
email_verification_required
workspace_quota_exceeded
invite_rate_limited
participant_link_high_traffic
participant_link_expired_access
participant_link_revoked_access
participant_session_rate_limited
participant_session_no_upload
captcha_required
captcha_failed
upload_url_rate_limited
upload_size_rejected
upload_type_rejected
upload_duration_rejected
upload_checksum_mismatch
upload_repeated_failure
storage_quota_exceeded
ai_quota_exceeded
ai_repeated_failure
report_scrape_suspected
export_rate_limited
token_enumeration_suspected
```

Event fields:

```ts
type AbuseEvent = {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  workspaceId?: string;
  userId?: string;
  testId?: string;
  sessionId?: string;
  participantLinkId?: string;
  ipHash?: string;
  userAgentHash?: string;
  count?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
```

Avoid storing raw IP addresses unless there is a clear operational need. Prefer salted IP hashes and short retention.

## 10. Admin Moderation Tools

MVP internal admin tools:

- Workspace lookup.
- User lookup.
- Participant link lookup.
- Storage usage dashboard.
- AI usage dashboard.
- Failed upload dashboard.
- Suspicious traffic dashboard.
- Revoke participant link.
- Close test.
- Temporarily suspend workspace.
- Temporarily block new uploads for workspace/test/link.
- Temporarily block AI generation for workspace.
- Reduce workspace quotas.
- Force email verification.
- Trigger media retention/deletion job.
- View audit and abuse events.

Moderation actions should be audited:

```txt
admin_workspace_suspended
admin_workspace_unsuspended
admin_link_revoked
admin_test_closed
admin_uploads_blocked
admin_ai_blocked
admin_quota_adjusted
admin_retention_job_triggered
```

Admin tools should never expose raw recordings unless the admin has a strict operational reason and access is logged.

## 11. User-Facing Error Messages For Limits

Use clear, non-accusatory messages.

Project limit:

```txt
You have reached the project limit for this workspace. Archive or delete an unused project to create another one.
```

Active test limit:

```txt
This workspace has reached the active test limit. Close an active test before publishing another one.
```

Session limit:

```txt
This test has reached its session limit and is no longer accepting new participants.
```

Recording duration:

```txt
This recording is longer than the allowed session duration. Please record a shorter session.
```

Storage limit:

```txt
This workspace has reached its storage limit. Delete old recordings before uploading more sessions.
```

AI report daily limit:

```txt
This workspace has reached today's AI report limit. You can review existing sessions now and generate more reports later.
```

Upload failures:

```txt
Upload did not complete after several attempts. Your recording is still saved on this device. Please retry later or contact the researcher.
```

Participant link unavailable:

```txt
This test link is unavailable. It may have expired or been closed.
```

CAPTCHA required:

```txt
Please complete this quick check before starting the test.
```

Invite limit:

```txt
This workspace has sent too many invitations today. Try again later.
```

Do not reveal internal abuse scores or detailed detection rules.

## 12. Safe Defaults For A Free MVP

Recommended launch defaults:

```txt
Require researcher email verification before publishing tests.
Participant links expire after 14 days by default.
Participant links can be revoked.
Each test accepts 25 sessions by default.
Each session can record up to 15 minutes.
Each workspace gets 10 GB storage.
Each workspace gets 25 AI reports per day.
Each workspace can have 5 active tests.
Each workspace can invite 5 members.
Signed upload URLs expire in 5 to 10 minutes.
Signed read URLs expire in 1 to 5 minutes.
No permanent public media URLs.
No participant account required.
No AI analysis for unvalidated uploads.
No rendered clip generation by default.
No broad anonymous table access.
No raw IP storage unless explicitly needed.
```

Operational defaults:

- Use private buckets only.
- Use server-generated storage paths only.
- Queue AI jobs.
- Queue storage deletion jobs.
- Keep participant route handlers rate-limited.
- Use CAPTCHA only when risk is elevated.
- Log abuse events separately from normal product analytics.
- Give users deletion controls early.
- Give researchers simple controls to close tests and revoke links.

## Implementation Priority

Phase 1:

- Email verification before publishing.
- Workspace quotas.
- Participant token expiration/revocation.
- Public endpoint rate limits.
- Upload validation.
- Storage usage tracking.
- AI daily limits.
- Signed URL expiry.

Phase 2:

- CAPTCHA on risky public flows.
- Abuse event table.
- Admin moderation dashboard.
- Suspicious link traffic alerts.
- Upload failure scoring.

Phase 3:

- IP reputation.
- Malware scanning.
- Worker-based media probing.
- Automated workspace suspension rules.
- Advanced anomaly detection.
