# AI Reaction Lab Test Plan

This test plan covers the free MVP for opt-in landing page reaction testing. It excludes monetization flows.

## Test Matrix

### Auth

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Sign up with email/password | Researcher | App running, Supabase configured | Open `/auth`, switch to sign up, enter valid email/password, submit | Account is created or verification email is sent | Weak password, duplicate email, Supabase unavailable | P0 |
| Login with valid credentials | Researcher | Verified user exists | Open `/auth`, enter credentials, submit | User is redirected to `/dashboard` | Bad password, unverified email if enforced, expired session | P0 |
| Reject invalid auth input | Researcher | None | Submit invalid email and short password | Field-level errors are shown | Errors not associated with inputs | P1 |
| Authenticated route protection | Anonymous | No active session | Open `/dashboard` | User is redirected to `/auth` | Dashboard data visible to anonymous user | P0 |

### Workspace Permissions

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Owner can access workspace | Owner | Owner belongs to workspace | Open dashboard | Workspace data loads | Forbidden error for owner | P0 |
| Non-member cannot access workspace | Authenticated non-member | User belongs to different workspace | Request project/session/report from another workspace | Request is denied | Cross-workspace data returned | P0 |
| Viewer cannot mutate workspace | Viewer | Viewer membership exists | Try create project/test or update workspace | Request denied | Mutation succeeds | P0 |
| Researcher can create research assets | Researcher | Researcher membership exists | Create project and test | Project/test created | Forbidden response | P0 |
| Admin can manage member role | Admin | Admin and member exist | Update member role | Role updates and audit log written | Last-owner rule bypassed, unauthorized update | P1 |

### Project Creation

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Create project | Researcher | Workspace exists, under project limit | Submit project name/description | Project row created in workspace | Wrong workspace_id accepted, audit missing | P0 |
| Enforce project limit | Researcher | Workspace at project cap | Create another project | Limit error shown | Project created beyond limit | P0 |
| Project list empty state | Researcher | Workspace has no projects | Open `/dashboard/projects` | Empty state prompts project creation | Blank page, misleading data | P2 |
| Delete project | Owner/Admin | Project exists | Delete project | Soft delete; hidden from list | Hard deletes unexpectedly, child data exposed | P1 |

### Test Creation

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Create test with valid fields | Researcher | Project exists | Submit URL, intro, 3 tasks | Draft test and tasks created | Tasks not persisted, wrong workspace | P0 |
| Reject invalid URL | Researcher | Project exists | Submit invalid URL | Validation error shown | Invalid URL stored | P1 |
| Enforce 3 to 5 tasks | Researcher | Project exists | Submit 2 or 6 tasks | Validation error shown | Test created | P0 |
| Publish valid test | Researcher | Draft test has valid fields | Call publish | Test status becomes active | Active limit bypassed, audit missing | P0 |
| Enforce active test limit | Researcher | Workspace at active test cap | Publish another test | Limit error shown | Test becomes active | P0 |

### Participant Link Validation

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Valid link loads test intro | Participant | Active test and active link | Open `/participate/[token]` or public API | Test intro/tasks load | Internal IDs or private data leaked | P0 |
| Expired link blocked | Participant | Link expired | Open link | Generic unavailable message | Test details returned | P0 |
| Revoked link blocked | Participant | Link revoked | Open link | Generic unavailable message | New session can start | P0 |
| Draft/closed test link blocked | Participant | Link exists but test inactive | Open link | Link unavailable | Participant can start | P0 |
| Link session cap enforced | Participant | Link at max sessions | Create session | Limit error | New session created | P0 |

### Consent Flow

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Consent copy visible | Participant | Valid link | Open consent page | Screen/camera/mic/events/AI disclosures visible | Missing recording scope | P0 |
| Cannot continue before consent | Participant | Consent page open | Leave checkbox unchecked, attempt continue | Continue blocked | Device check reachable | P0 |
| Consent record stored | Participant | Session created | Accept consent | Consent record stores exact text, timestamp, scopes | Consent accepted without record | P0 |
| Consent scope matches test requirements | Participant | Test requires screen/mic | Submit false consent scope | Request rejected | Session marked accepted | P0 |
| Decline consent | Participant | Consent page open | Click decline | User exits; no recording starts | Media permission prompt appears | P0 |

### Camera/Mic/Screen Permission Flow

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Grant all permissions | Participant | Consent accepted, desktop browser | Grant screen/camera/mic | Device check shows ready | Missing preview/status | P0 |
| Deny screen permission | Participant | Consent accepted | Deny screen share | Error explains retry; no recording starts | Recording starts anyway | P0 |
| Camera unavailable | Participant | Camera disabled/in use | Start device check | Clear camera error; required camera blocks recording | Silent failure | P1 |
| Microphone unavailable | Participant | Mic disabled/in use | Start device check | Clear mic error; required mic blocks recording | Recording starts with missing required mic | P1 |
| Unsupported browser | Participant | Browser lacks APIs | Open device check | Unsupported browser message | Crashes or blank UI | P0 |

### Recording Flow

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Start recording after consent | Participant | Consent accepted and permissions granted | Start recording | Recording state active; event logged | Starts before consent | P0 |
| Pause and resume | Participant | Recording active | Pause, resume | Pause/resume events timestamped | Timeline mismatch | P1 |
| Stop recording | Participant | Recording active | Stop and submit | Tracks stop; upload begins | Camera/mic continue running | P0 |
| Screen share stopped early | Participant | Recording active | Stop browser screen share | Partial recording saved/upload flow begins | Data lost without recovery | P0 |
| Max duration auto-stop | Participant | Recording active | Reach max duration | Recording stops and uploads | Duration cap bypassed | P0 |
| Tab close warning | Participant | Recording/uploading | Attempt close tab | Browser warning appears | No warning and local data lost | P1 |

### Upload Flow

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Generate signed upload URL | Participant | Consented session | Request upload URL | URL returned; recording metadata pending | URL without consent | P0 |
| Complete upload | Participant | Object uploaded | Call complete endpoint | Recording status uploaded; audit log written | Marks uploaded before object exists | P0 |
| Duplicate completion | Participant | Recording already uploaded | Retry complete | Idempotent success; storage not double-counted | Usage double-counted | P0 |
| Expired upload URL | Participant | Signed URL expired | Retry upload | Fresh URL requested | Permanent failure | P1 |
| Upload fails network | Participant | Network drops | Upload chunk/final blob | Local data remains; retry available | Recording lost | P0 |
| Large file rejected | Participant | File exceeds max | Request upload URL | Limit error | Signed URL issued | P0 |

### Session Event Capture

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Capture task timestamps | Participant | Recording active | Start/complete task | Task events stored with video timestamps | Missing or negative timestamps | P1 |
| Capture manual reactions | Participant | Recording active | Mark reaction | `manual_reaction` event stored | Event not persisted | P1 |
| Deduplicate event batches | Participant | Batch submitted once | Submit same batch ID twice | Second ignored | Duplicate rows created | P1 |
| Reject oversized event payload | Participant | Recording active | Submit huge payload | Request rejected/sanitized | Sensitive payload stored | P0 |

### AI Report Generation

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Request analysis | Researcher | Uploaded consented session | Request AI analysis | Pending report created; audit log written | Created without recording/consent | P0 |
| Idempotent analysis request | Researcher | Report exists | Request again same session | Existing report returned unless forced | Duplicate jobs | P0 |
| AI quota enforced | Researcher | Daily AI limit reached | Request analysis | Limit error | New report created | P0 |
| Low-quality transcript handling | Researcher | Failed/poor transcript | Generate report | Limited-confidence report or safe failure | Invented quotes | P0 |
| Unsafe AI claims blocked | Researcher | Report output contains hidden emotion/protected trait claim | Validate output | Report rejected/repaired | Unsafe claim shown | P0 |

### Report Access Permissions

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Workspace member reads report | Viewer | Viewer belongs to workspace | Open report | Report loads | Forbidden for viewer | P1 |
| Non-member cannot read report | Authenticated non-member | Report exists in other workspace | Request report | Forbidden/not found | Report returned | P0 |
| Report response redacts internals | Viewer | Report has model/error metadata | Fetch report | Only safe DTO fields returned | Model errors/internal columns leaked | P0 |
| Report view audit | Researcher/viewer | Report exists | Open report | `report_viewed` logged | No audit log | P1 |

### Free Usage Limits

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Project limit | Researcher | At max projects | Create project | Limit error | Project created | P0 |
| Active test limit | Researcher | At max active tests | Publish test | Limit error | Test active | P0 |
| Session per test limit | Participant | Test at cap | Create session | Limit error | Session created | P0 |
| Storage limit | Participant | Workspace near storage cap | Request upload URL | Limit error | Upload URL issued | P0 |
| AI daily limit | Researcher | AI cap reached | Request analysis | Limit error | Report job created | P0 |

### Rate Limits

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Public link validation rate limit | Participant/bot | Valid/invalid token | Send over limit | `429` safe error | Unlimited requests | P0 |
| Session creation rate limit | Participant/bot | Valid token | Send over limit | `429`; no extra sessions | Unlimited fake sessions | P0 |
| Upload URL rate limit | Participant/bot | Session exists | Request many URLs | `429`; no unlimited rows | Many pending recordings | P0 |
| Event ingest rate limit | Participant/bot | Session exists | Send many batches | `429` | DB flooded | P0 |

### Data Deletion

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Anonymize participant | Owner/Admin | Participant exists | Run anonymize | PII removed; session remains | Email/name retained | P0 |
| Delete session data | Owner/Admin | Session with media/report exists | Delete session | Rows soft-deleted; storage deletion queued | Media still accessible | P0 |
| Delete denied to viewer | Viewer | Session exists | Attempt delete | Forbidden | Delete succeeds | P0 |
| Retention cleanup | System | Expired recording | Run retention job | Recording hidden/deleted; audit written | Expired media accessible | P1 |

### RLS Policies

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Workspace isolation | Non-member | Two workspaces | Query other workspace tables | No rows | Cross-tenant rows returned | P0 |
| Viewer read-only | Viewer | Viewer membership | Try insert/update/delete | Denied | Mutation succeeds | P0 |
| Audit logs owner/admin only | Researcher/viewer | Audit rows exist | Query audit logs | Denied unless owner/admin | Logs visible | P0 |
| No anon table access | Anonymous | None | Query public tables directly | Denied | Rows returned | P0 |

### Signed URL Expiration

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Signed read URL expires | Researcher | Recording exists | Generate URL, wait expiry, fetch | Access denied after expiry | URL remains valid | P0 |
| Signed upload URL expires | Participant | Upload URL issued | Wait expiry, upload | Upload fails; fresh URL flow works | Permanent URL accepted | P0 |
| No permanent public URL | Any | Recording exists | Inspect API response | No permanent storage URL/path exposed | Public URL leaked | P0 |

### Browser Compatibility

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Chrome desktop recording | Participant | Chrome latest | Complete full flow | Recording/upload succeeds | API unsupported crash | P0 |
| Edge desktop recording | Participant | Edge latest | Complete full flow | Recording/upload succeeds | Browser-specific failure | P1 |
| Firefox desktop check | Participant | Firefox latest | Device check/record | Supported behavior or clear limitation | Silent failure | P1 |
| Safari desktop behavior | Participant | Safari latest | Open device check | Supported behavior or unsupported message | Broken recording UI | P2 |

### Mobile/Tablet Behavior

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Mobile unsupported state | Participant | iOS/Android browser | Open test link | Clear desktop-required message | Broken permission flow | P0 |
| Tablet behavior | Participant | iPad/Android tablet | Open test link | Clear support/unsupported state | Partial recording starts unexpectedly | P1 |
| Researcher dashboard responsive | Researcher | Mobile viewport | Open dashboard | Usable navigation/read-only review | Content unusable | P2 |

### Accessibility

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Keyboard auth forms | Researcher | Auth page open | Navigate with keyboard | All controls reachable | Focus trap/lost focus | P0 |
| Consent screen screen reader | Participant | Consent page open | Read with screen reader | Recording scope and checkbox clear | Checkbox unlabeled | P0 |
| Visible focus states | Any | App open | Tab through controls | Visible focus indicator | No focus indication | P1 |
| Error announcements | Any | Form error | Submit invalid input | Error announced with `role=alert` or associated text | Silent error | P1 |
| Color contrast | Any | Pages open | Run axe/contrast check | WCAG AA for text/controls | Low contrast | P1 |

### Error States

| Test name | User type | Preconditions | Steps | Expected result | Failure cases | Priority |
|---|---|---|---|---|---|---|
| Network failure during upload | Participant | Recording ready | Disable network mid-upload | Recovery/retry shown | Data lost | P0 |
| Supabase unavailable | Researcher | Backend DB unavailable | Load dashboard/create project | Safe error shown | Stack trace leaked | P0 |
| Storage unavailable | Participant | Storage fails | Request upload URL/complete | Safe upload error; local data retained | Recording lost | P0 |
| AI provider unavailable | Researcher | AI route fails | Request analysis | Report failed/pending state with retry | Infinite loading | P1 |

## 1. Unit Test Plan

| Test name | Scope | Expected result | Priority |
|---|---|---|---|
| Zod project schema | `lib/validation/projects.ts` | Valid project passes; invalid names fail | P1 |
| Zod test schema | `lib/validation/tests.ts` | Enforces URL, 3-5 tasks, duration | P0 |
| Zod API upload schema | `lib/validation/api.ts` | Rejects unsupported MIME, huge size, bad token | P0 |
| Rate limiter behavior | `lib/api/rate-limit.ts` | Allows up to limit, rejects over limit | P1 |
| Error normalization | `lib/api/errors.ts` | Zod and app errors return safe messages | P1 |
| Media path builder | `lib/storage/media.ts` | Includes workspace/project/test/session and no PII | P0 |
| MIME extension mapping | `lib/storage/media.ts` | Allows only approved types | P0 |
| Usage limit helpers | `lib/usage/limits.ts` | Throws on over-limit states | P0 |
| Authorization helper | `lib/auth/authorization.ts` | Allows/denies correct roles | P0 |
| Consent copy constants | `lib/privacy/consent-copy.ts` | Contains required disclosure strings | P1 |

## 2. Integration Test Plan

| Test name | Scope | Expected result | Priority |
|---|---|---|---|
| Project API create/list/delete | `/api/projects` | Auth, role, quota, audit all work | P0 |
| Test API create/publish | `/api/tests` | Tasks persisted and active cap enforced | P0 |
| Participant link lifecycle | `/api/tests/[testId]/participant-links` + public validate | Active/expired/revoked states enforced | P0 |
| Session creation transaction | Public session endpoint/RPC | Link/session caps cannot be exceeded | P0 |
| Consent + upload URL | Consent endpoint + upload URL endpoint | Upload URL denied before consent; allowed after | P0 |
| Upload completion idempotency | Complete endpoint | Duplicate completion safe and no double-count | P0 |
| Event ingestion dedupe | Events endpoint | Duplicate batch ignored | P1 |
| AI request idempotency | Request analysis endpoint | Existing report returned | P0 |
| Report access isolation | Report endpoint | Non-member denied; viewer gets safe DTO | P0 |
| Audit logging | Sensitive routes | Audit rows created with no signed URLs/secrets | P0 |

## 3. End-to-End Playwright Test Plan

| Test name | Browser | Steps | Expected result | Priority |
|---|---|---|---|---|
| Researcher creates project/test/link | Chromium | Login, create project, create test, publish, create link | Link generated | P0 |
| Participant consent flow | Chromium | Open link, consent, continue device check | Consent copy visible and route advances | P0 |
| Permission denied path | Chromium | Mock denied permissions | Clear error, no recording | P0 |
| Recording shell happy path | Chromium | Mock media APIs, start/pause/stop | Recording states update | P0 |
| Upload retry path | Chromium | Mock failed upload then success | Retry succeeds, completion page shown | P0 |
| Report view authorization | Chromium | Login as member/non-member | Member sees report, non-member denied | P0 |
| Accessibility smoke | Chromium | Run axe on auth, consent, dashboard, report | No critical axe violations | P1 |
| Mobile participant route | Mobile viewport | Open participant link | Desktop-required or safe responsive state | P1 |

Playwright media mocking notes:

- Stub `navigator.mediaDevices.getDisplayMedia`.
- Stub `navigator.mediaDevices.getUserMedia`.
- Stub `MediaRecorder`.
- Stub upload endpoint responses.
- Use deterministic fake chunks and timestamps.

## 4. Manual QA Checklist

- Auth pages have labeled inputs and safe error messages.
- Dashboard loads with empty states for new workspace.
- Project and test forms validate required fields.
- Test creation warns against sensitive information.
- Participant link can be copied and opened.
- Consent page clearly lists all recording scopes.
- Consent checkbox is required before device check.
- Browser permission denial is understandable.
- Camera/mic preview works in supported desktop browsers.
- Recording active/paused/uploading states are obvious.
- Stop button is always visible during recording.
- Network interruption does not lose local recording.
- Upload progress and retry messaging are clear.
- Session list shows processing/failed/complete states.
- Report page uses cautious language and evidence.
- No permanent media URLs are visible in the UI.
- Delete/anonymize actions have confirmations.
- Expired/revoked links show generic unavailable copy.
- Mobile/tablet does not start unsupported recording flows.

## 5. Security QA Checklist

- Anonymous users cannot query app tables directly.
- Non-members cannot access projects/tests/sessions/reports across workspaces.
- Viewers cannot create/update/delete workspace resources.
- Public participant APIs never accept client-provided workspace/project/test IDs.
- Participant token is high entropy and not guessable.
- Expired/revoked participant links block new sessions.
- Consent is stored before any upload URL is issued.
- Upload URL endpoint rejects unsupported MIME types.
- Upload completion verifies actual storage object metadata.
- Signed read URLs expire quickly.
- Signed upload URLs expire quickly.
- API responses do not include storage paths or service details.
- Audit logs do not include signed URLs, raw IPs, secrets, or transcripts.
- Event payloads reject sensitive/unbounded fields.
- AI report validation rejects hidden emotion/protected-trait claims.
- Prompt-injection strings in transcript/events are treated as data, not instructions.
- Rate limits cover public link validation, session creation, upload URLs, events, AI requests, and exports.
- Free usage limits are enforced server-side.
- RLS policies are enabled and forced on exposed tables.
- Service role key is never imported into client components.
- Error responses do not expose stack traces, SQL errors, provider errors, or secrets.
