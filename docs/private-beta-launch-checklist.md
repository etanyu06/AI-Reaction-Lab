# AI Reaction Lab Private Beta Launch Checklist

AI Reaction Lab handles consented screen, camera, microphone, interaction, transcript, and written feedback data. Treat private beta as a real sensitive-data launch, not a disposable prototype.

Priority labels:

- **Blocker before launch:** Must be complete before inviting real participants.
- **Should fix before launch:** Strongly recommended before beta; acceptable only with a documented owner, mitigation, and short follow-up date.
- **Can wait until after beta:** Useful improvement that does not create unacceptable privacy, security, reliability, or trust risk for a small private beta.

## 1. Product Readiness

| Item | Priority |
| --- | --- |
| Researcher can sign up and sign in with verified email. | Blocker before launch |
| Researcher can create a workspace. | Blocker before launch |
| Researcher can create a project. | Blocker before launch |
| Researcher can create a landing page test with URL and 3 to 5 tasks. | Blocker before launch |
| Researcher can generate a scoped participant link. | Blocker before launch |
| Participant can open test link without creating an account. | Blocker before launch |
| Participant can see test intro before consent. | Blocker before launch |
| Participant can complete consent before any recording starts. | Blocker before launch |
| Participant can complete device check. | Blocker before launch |
| Participant can record screen, camera, and microphone in supported desktop browsers. | Blocker before launch |
| Participant can pause, stop, and submit session. | Blocker before launch |
| Participant can submit written feedback after recording. | Blocker before launch |
| Researcher can see session list with processing, failed, and complete states. | Blocker before launch |
| Researcher can view individual session metadata and report. | Blocker before launch |
| AI report includes executive summary, confusion moments, trust drop-offs, quotes, recommendations, and suggested clips. | Blocker before launch |
| Empty states clearly explain what to do next. | Should fix before launch |
| Loading states exist for reports, uploads, link validation, and session submission. | Should fix before launch |
| Failed report state offers retry or support guidance. | Should fix before launch |
| Workspace settings are minimal but usable. | Should fix before launch |
| Report export/share flow works for text findings. | Should fix before launch |
| Clip generation can be manual or limited for beta. | Can wait until after beta |
| Multi-session aggregate reports are polished. | Can wait until after beta |
| Advanced test templates exist. | Can wait until after beta |
| Custom branding exists. | Can wait until after beta |

## 2. Security Readiness

| Item | Priority |
| --- | --- |
| Supabase RLS is enabled and forced on exposed tables. | Blocker before launch |
| RLS policies prevent cross-workspace data access. | Blocker before launch |
| Server-side authorization verifies workspace membership for every authenticated API action. | Blocker before launch |
| Public participant APIs never trust client-provided workspace, project, or test IDs. | Blocker before launch |
| Participant links are high entropy, scoped to one test, expirable, and revocable. | Blocker before launch |
| Service role key is never exposed to client bundles. | Blocker before launch |
| Recordings, transcripts, thumbnails, and clips are private by default. | Blocker before launch |
| Media access uses short-lived signed URLs only. | Blocker before launch |
| Upload URL generation validates ownership, session state, consent state, MIME type, size, and duration limits. | Blocker before launch |
| Upload completion verifies actual storage object metadata server-side. | Blocker before launch |
| API responses do not expose storage paths, internal SQL errors, stack traces, provider errors, or secrets. | Blocker before launch |
| Audit logs record sensitive actions. | Blocker before launch |
| Audit logs do not store signed URLs, raw secrets, full transcripts, or excessive PII. | Blocker before launch |
| CSRF protection exists for state-changing authenticated actions where browser cookies are used. | Blocker before launch |
| Zod validation exists on all route handlers and server actions. | Blocker before launch |
| Prompt injection defenses exist for AI analysis inputs. | Blocker before launch |
| Report schema validation rejects unsupported claims about hidden emotions, identity, protected traits, or biometric scores. | Blocker before launch |
| Dependency scan has no known critical vulnerabilities. | Should fix before launch |
| Security headers are configured. | Should fix before launch |
| File upload malware scanning is evaluated or deferred with strict type/size controls. | Should fix before launch |
| Security review findings have owners and deadlines. | Should fix before launch |
| Formal penetration test is complete. | Can wait until after beta |

## 3. Privacy Readiness

| Item | Priority |
| --- | --- |
| No recording starts before explicit participant consent. | Blocker before launch |
| Consent screen clearly lists screen, camera, microphone, clicks, scrolls, pauses, written feedback, and self-reported reactions. | Blocker before launch |
| Participant can leave before consenting. | Blocker before launch |
| Participant can stop the recording. | Blocker before launch |
| Recording status is visible during the session. | Blocker before launch |
| App does not record outside the participant test session. | Blocker before launch |
| Private media is never exposed through permanent public URLs. | Blocker before launch |
| Participant data deletion/anonymization process exists and is tested. | Blocker before launch |
| Data retention fields exist for workspaces, sessions, recordings, transcripts, reports, and clips. | Blocker before launch |
| Privacy copy states what AI analysis does and does not infer. | Blocker before launch |
| Researcher guidelines prohibit hidden tracking, passive surveillance, protected trait inference, and emotion scoring as fact. | Blocker before launch |
| Workspace owners can view current retention settings. | Should fix before launch |
| Data export flow exists for workspace findings and reports. | Should fix before launch |
| Participant-facing deletion request copy exists. | Should fix before launch |
| Privacy FAQ is published. | Should fix before launch |
| Granular per-field retention controls are available. | Can wait until after beta |
| Automated retention deletion job is fully self-service configurable. | Can wait until after beta |

## 4. Legal / Consent Readiness

| Item | Priority |
| --- | --- |
| Product includes plain-English participant consent summary. | Blocker before launch |
| Product includes full consent text. | Blocker before launch |
| Consent record stores version, timestamp, scopes, participant session, IP hash or coarse metadata, and user agent. | Blocker before launch |
| Consent version is immutable once accepted. | Blocker before launch |
| Consent is required before device permissions and upload URL issuance. | Blocker before launch |
| Prohibited use policy is published. | Blocker before launch |
| Researcher privacy guidelines are shown during onboarding or test creation. | Should fix before launch |
| Terms and privacy policy pages exist with clear "not legal advice" review completed by counsel before public use. | Should fix before launch |
| Children/minors use is explicitly disallowed unless special compliance is handled outside the MVP. | Blocker before launch |
| AI limitations disclosure appears near report outputs. | Blocker before launch |
| Consent copy is reviewed for readability. | Should fix before launch |
| Regional privacy-specific workflows are fully localized. | Can wait until after beta |

## 5. Reliability Readiness

| Item | Priority |
| --- | --- |
| Recording works in supported desktop Chrome and Edge. | Blocker before launch |
| Unsupported browsers show a clear fallback message. | Blocker before launch |
| Mobile/tablet users are blocked from recording with clear copy. | Blocker before launch |
| Camera unavailable state is handled. | Blocker before launch |
| Microphone unavailable state is handled. | Blocker before launch |
| Screen share denial state is handled. | Blocker before launch |
| Screen share stopped early state is handled. | Blocker before launch |
| User closes tab warning exists during active recording/upload. | Blocker before launch |
| Recording chunks are uploaded reliably with retry. | Blocker before launch |
| Local temporary storage prevents immediate data loss during upload failure where browser support allows. | Blocker before launch |
| Upload completion endpoint is idempotent. | Blocker before launch |
| Session submission endpoint is idempotent. | Blocker before launch |
| Expired signed upload URL can be refreshed safely. | Blocker before launch |
| Large file and long duration limits are enforced client-side and server-side. | Blocker before launch |
| Storage upload success but database write failure has recovery path. | Blocker before launch |
| Database session creation success but storage upload failure has recovery path. | Blocker before launch |
| AI analysis failure creates a visible retryable failed state. | Blocker before launch |
| Transcript generation failure creates a visible degraded report state. | Should fix before launch |
| Background jobs have retry limits and dead-letter tracking. | Should fix before launch |
| Browser compatibility matrix has been manually tested. | Should fix before launch |
| Automated recording E2E coverage exists for mocked media flows. | Should fix before launch |
| Multi-region failover exists. | Can wait until after beta |

## 6. Free-Service Abuse Prevention

| Item | Priority |
| --- | --- |
| Email verification is required before participant link creation. | Blocker before launch |
| Account creation rate limits exist. | Blocker before launch |
| Participant link validation rate limits exist. | Blocker before launch |
| Session creation rate limits exist. | Blocker before launch |
| Upload URL generation rate limits exist. | Blocker before launch |
| Session event ingestion rate limits exist. | Blocker before launch |
| AI analysis request rate limits exist. | Blocker before launch |
| Workspace quotas are enforced server-side. | Blocker before launch |
| Max projects per workspace is enforced. | Blocker before launch |
| Max active tests per workspace is enforced. | Blocker before launch |
| Max sessions per test is enforced. | Blocker before launch |
| Max recording duration is enforced. | Blocker before launch |
| Max storage per workspace is enforced. | Blocker before launch |
| Max AI reports per day is enforced. | Blocker before launch |
| Participant links expire by default. | Blocker before launch |
| Participant links can be revoked. | Blocker before launch |
| CAPTCHA or managed challenge is enabled after suspicious public link behavior. | Should fix before launch |
| Abuse detection events are logged. | Should fix before launch |
| Admin moderation view exists for abusive accounts, workspaces, sessions, and links. | Should fix before launch |
| Automated account suspension workflows exist. | Can wait until after beta |

## 7. Customer / User Onboarding

| Item | Priority |
| --- | --- |
| New researcher can understand the product from the first dashboard screen. | Blocker before launch |
| Workspace creation flow is clear. | Blocker before launch |
| First project creation flow is clear. | Blocker before launch |
| First test creation flow includes task examples. | Blocker before launch |
| Participant link screen explains consent-first sharing. | Blocker before launch |
| Researcher sees guidance about recruiting opt-in participants. | Should fix before launch |
| Researcher sees guidance about not collecting sensitive personal data unnecessarily. | Should fix before launch |
| Empty session list tells researcher what happens next. | Should fix before launch |
| First report explains confidence and limitations. | Should fix before launch |
| Beta welcome email exists. | Should fix before launch |
| In-app walkthrough exists. | Can wait until after beta |
| Template gallery exists. | Can wait until after beta |

## 8. Analytics / Monitoring

| Item | Priority |
| --- | --- |
| Application error tracking is enabled. | Blocker before launch |
| API route errors are monitored. | Blocker before launch |
| Recording start, pause, stop, upload started, upload failed, upload completed events are logged as product telemetry without sensitive payloads. | Blocker before launch |
| AI analysis requested, failed, retried, and completed events are monitored. | Blocker before launch |
| Storage usage by workspace is monitored. | Blocker before launch |
| Rate limit hits are monitored. | Blocker before launch |
| Abuse events are monitored. | Blocker before launch |
| RLS policy failures and authorization denials are observable in server logs without leaking data. | Should fix before launch |
| Performance monitoring covers dashboard and participant flow. | Should fix before launch |
| Browser permission denial rates are tracked. | Should fix before launch |
| Upload chunk failure rates are tracked. | Should fix before launch |
| Report quality feedback is tracked. | Should fix before launch |
| Full analytics warehouse exists. | Can wait until after beta |

## 9. Support Process

| Item | Priority |
| --- | --- |
| Support email or intake form exists. | Blocker before launch |
| Support process covers failed uploads, missing reports, participant deletion requests, and link issues. | Blocker before launch |
| Support team has safe internal data access rules. | Blocker before launch |
| Support responses do not expose participant data to unauthorized researchers. | Blocker before launch |
| Known issue documentation exists for browser permissions and recording compatibility. | Should fix before launch |
| Bug report template exists. | Should fix before launch |
| Internal escalation path exists for security/privacy issues. | Blocker before launch |
| Public status page exists. | Can wait until after beta |
| In-app support widget exists. | Can wait until after beta |

## 10. Incident Response

| Item | Priority |
| --- | --- |
| Security incident response owner is assigned. | Blocker before launch |
| Privacy incident response owner is assigned. | Blocker before launch |
| Incident severity definitions exist. | Blocker before launch |
| Process exists for revoking participant links globally or by workspace. | Blocker before launch |
| Process exists for disabling a workspace. | Blocker before launch |
| Process exists for rotating Supabase service keys and storage credentials. | Blocker before launch |
| Process exists for invalidating signed URLs where provider support allows. | Should fix before launch |
| Process exists for deleting exposed media. | Blocker before launch |
| Communication templates exist for affected researchers. | Should fix before launch |
| Communication templates exist for affected participants when contact info is available. | Should fix before launch |
| Incident timeline template exists. | Should fix before launch |
| Post-incident review process exists. | Should fix before launch |
| On-call rotation exists. | Can wait until after beta |

## 11. Data Deletion Process

| Item | Priority |
| --- | --- |
| Participant data deletion request flow exists. | Blocker before launch |
| Workspace owner can request deletion/anonymization of a participant session. | Blocker before launch |
| Deletion removes or anonymizes participant record, consent-linked metadata where legally appropriate, recordings, transcripts, events, reports, sections, and clips. | Blocker before launch |
| Storage objects are deleted when database records are deleted/anonymized. | Blocker before launch |
| Deletion job is idempotent. | Blocker before launch |
| Deletion creates an audit log without storing deleted sensitive content. | Blocker before launch |
| Researcher UI reflects deleted/anonymized state. | Blocker before launch |
| AI report references to deleted participant data are removed or anonymized. | Blocker before launch |
| Retention date fields are populated for sessions and media. | Blocker before launch |
| Manual deletion runbook exists for support. | Should fix before launch |
| Automated retention cleanup is scheduled. | Should fix before launch |
| Self-service participant deletion portal exists. | Can wait until after beta |

## 12. Beta Feedback Process

| Item | Priority |
| --- | --- |
| Beta success criteria are defined. | Blocker before launch |
| Feedback intake form exists. | Blocker before launch |
| In-product report feedback control exists. | Should fix before launch |
| Beta users can report inaccurate or unsafe AI outputs. | Blocker before launch |
| AI output issue review process exists. | Blocker before launch |
| Participant flow friction feedback is collected. | Should fix before launch |
| Researcher onboarding feedback is collected. | Should fix before launch |
| Weekly beta review cadence is scheduled. | Should fix before launch |
| Top issues are triaged by severity and owner. | Should fix before launch |
| Private beta cohort is limited to a manageable number of workspaces. | Blocker before launch |
| Beta invite criteria are documented. | Should fix before launch |
| Public changelog exists. | Can wait until after beta |

## Minimum Launch Bar

Do not invite real beta participants until these are true:

- Recording never starts before explicit consent.
- RLS and server-side authorization prevent cross-workspace access.
- Media is private and served only through short-lived signed URLs.
- Public participant links are tokenized, scoped, expirable, revocable, and rate-limited.
- Uploads are validated, bounded, retryable, and recoverable.
- AI reports use cautious evidence-based language and reject unsupported claims.
- Participant deletion/anonymization is tested end to end.
- Sensitive actions are audit logged.
- Support and incident response owners are assigned.
- Free-service limits are enforced server-side.
