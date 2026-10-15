# AI Reaction Lab MVP Definition

AI Reaction Lab MVP is a free web app for opt-in AI reaction testing of landing pages only.

The first version should prove one loop:

1. Researcher creates a landing page test.
2. Participant consents and records a session.
3. AI produces a useful landing page reaction report.

No billing, subscriptions, pricing, Stripe, paid tiers, invoices, or customer portal logic belongs in the MVP.

## Must-Have

### Researcher Account

- Sign up, login, logout.
- Basic profile record.
- User can belong to one or more workspaces.
- Create workspace.
- Rename workspace.

### Projects

- Create project.
- View project list.
- Open project.
- Delete project.

### Landing Page Tests

- Create test inside a project.
- Required test fields:
  - Test name.
  - Landing page URL.
  - 3 to 5 tasks/questions.
  - Short participant instructions.
- Test statuses:
  - Draft.
  - Active.
  - Closed.
- Generate participant test link.
- Copy participant test link.
- View session list for a test.

### Participant Consent

- Public participant link.
- Clear consent screen before recording.
- Required consent checkbox.
- Stored consent timestamp and accepted consent text.
- No camera, microphone, screen, click, or scroll recording before consent.

Consent must explain:

- Screen may be recorded.
- Camera may be recorded.
- Microphone may be recorded.
- Clicks and scrolls may be captured.
- Written responses may be saved.
- Participation is voluntary.
- Participant can stop anytime.
- The product does not perform face recognition, biometric identity verification, or emotion scoring.

### Participant Recording

- Browser-based recording.
- Screen recording.
- Camera recording.
- Microphone recording.
- Click tracking.
- Scroll tracking.
- Written task/question responses.
- Stop recording button.
- Completion screen.
- Basic upload progress.
- Max session duration, initially 15 to 20 minutes.
- Permission-denied error state.

### Media Upload And Storage

- Private object storage.
- Store object paths in Postgres, not raw media.
- Signed upload URLs or server-mediated upload.
- Signed playback URLs for authorized researchers.
- Store recording metadata:
  - Session ID.
  - Test ID.
  - Duration.
  - File size.
  - MIME type.
  - Upload status.

### Researcher Session Review

- Session list per test.
- Session status:
  - Created.
  - Consented.
  - Recording.
  - Uploading.
  - Uploaded.
  - Processing.
  - Complete.
  - Failed.
- Video playback.
- Written responses.
- Basic click and scroll timeline markers.
- Delete session.

### AI Report

- Audio transcription.
- Structured session summary.
- Confusion moments with timestamps.
- Trust drop-offs with timestamps.
- Engagement moments with timestamps.
- Participant quotes with timestamps.
- Landing page recommendations.
- Suggested clips as timestamp ranges.
- Report status:
  - Pending.
  - Processing.
  - Complete.
  - Failed.

### Security And Privacy

- Supabase Auth.
- Supabase Postgres.
- Supabase Row Level Security.
- Workspace-owned data isolation.
- Private storage bucket.
- Server-side authorization checks.
- No public media URLs.
- Rate limiting on public participant endpoints.
- Input validation on all forms and APIs.
- Delete test.
- Delete session.
- No hidden recording.
- No passive tracking.
- No biometric identity checks.
- No emotion scoring.

## Should-Have

- Preview participant flow before sharing.
- Edit draft tests.
- Close and reopen active tests.
- Default consent text.
- Default landing page testing question templates.
- URL validation and normalization.
- Optional participant display name.
- Local temporary recording buffer.
- Retry failed upload.
- Unsupported-browser messaging.
- Auto-stop at max duration.
- Warning before leaving during recording.
- Severity labels for AI findings.
- Recommendation priority.
- Evidence links from report item to video timestamp.
- Separate summary by task/question.
- Regenerate report button.
- Basic dashboard with projects, active tests, and recent sessions.
- Copyable report summary.
- Download transcript as text.
- Test-level retention setting.
- Delete raw recording while keeping report.
- Basic audit log for deletes and share-link access.

## Could-Have

- Workspace member invitations.
- Workspace roles in UI.
- Comments on sessions.
- Internal notes.
- Shareable report links.
- Revoke share link.
- Password-protected report link.
- Pause/resume recording.
- Manual participant reaction buttons.
- Task-by-task timer.
- Automatic thumbnails.
- Rendered clip files.
- Cross-session rollup report.
- Compare multiple participants.
- Landing page section-level insights.
- Export report as PDF.
- Export CSV of findings.
- Email researcher when report is ready.

## Not-Now

- Payments.
- Subscriptions.
- Pricing pages.
- Stripe.
- Paid tiers.
- Invoices.
- Customer portal.
- Usage-based billing.
- App prototype testing.
- Checkout-flow testing.
- Article testing.
- Video testing.
- Course lesson testing.
- Pitch deck testing.
- Game tutorial testing.
- Mobile app testing.
- Live moderated testing.
- Heatmaps.
- Passive analytics SDK.
- Browser extension.
- Eye tracking.
- Facial expression analysis.
- Emotion scoring.
- Biometric identity verification.
- Keystroke logging.
- Enterprise SSO.
- SCIM.
- Data residency controls.
- Full video editor.
- Participant recruiting.
- Incentives.
- Scheduling.
