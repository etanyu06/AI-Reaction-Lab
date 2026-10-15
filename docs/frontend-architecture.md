# AI Reaction Lab Frontend Architecture

AI Reaction Lab should feel like a clean research workspace: calm, trustworthy, clear, and privacy-first. The UI should avoid decorative AI tropes and focus on consent, evidence, session review, and practical findings.

## Stack

- Next.js App Router.
- TypeScript.
- React Server Components by default.
- Client Components only for interactive forms, media recording, media playback, menus, and realtime status.
- Tailwind.
- shadcn/ui style primitives.
- Accessible UI patterns with semantic HTML, visible focus states, keyboard support, and screen reader labels.

## Product UI Principles

- Use restrained layouts with dense but readable information.
- Keep recording and consent states explicit.
- Use plain privacy copy near sensitive actions.
- Avoid vague AI language. Reports should emphasize evidence, timestamps, quotes, and recommendations.
- Do not expose storage paths, internal IDs where not useful, model prompts, or provider errors.
- Keep destructive actions behind confirmation dialogs.
- Use private-by-default sharing.

## App Shells

### Marketing Shell

Used by public informational pages.

Components:

- `MarketingHeader`
- `MarketingNav`
- `MarketingFooter`
- `TrustBanner`
- `PrivacyNoticeLink`

### Researcher App Shell

Used by authenticated dashboard pages.

Components:

- `AppSidebar`
- `WorkspaceSwitcher`
- `UserMenu`
- `Breadcrumbs`
- `PageHeader`
- `CommandMenu`
- `GlobalToastRegion`

### Participant Shell

Used by tokenized participant test pages.

Components:

- `ParticipantHeader`
- `RecordingStatusBar`
- `ParticipantProgress`
- `PrivacyReminder`
- `ExitTestDialog`

## Shared UI Components

shadcn/ui style components:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `RadioGroup`
- `Switch`
- `Tabs`
- `Dialog`
- `AlertDialog`
- `DropdownMenu`
- `Popover`
- `Tooltip`
- `Toast`
- `Card`
- `Badge`
- `Table`
- `Skeleton`
- `Progress`
- `Alert`
- `Separator`

Application components:

- `ConsentSummary`
- `PermissionChecklist`
- `DevicePreview`
- `RecorderControls`
- `UploadProgress`
- `SessionStatusBadge`
- `TestStatusBadge`
- `ReportStatusBadge`
- `Timeline`
- `VideoPlayer`
- `TranscriptPanel`
- `ReportSection`
- `EvidenceTimestampLink`
- `ClipList`
- `CopyLinkButton`
- `EmptyState`
- `ErrorState`
- `DeleteConfirmationDialog`

## Data Fetching Pattern

- Server Components fetch authenticated read data using a Supabase server client.
- Mutations use Server Actions for authenticated researcher actions.
- Public participant actions use Route Handlers because they are token-scoped and need rate limiting.
- Browser recording/upload logic lives in Client Components.
- Processing statuses can use polling first. Realtime can be added later if needed.

## Page Specifications

## Marketing Pages

### Home Page

Route: `/`

Components:

- `MarketingHeader`
- `HeroSection`
- `UseCaseStrip`
- `HowItWorks`
- `ConsentFirstSection`
- `ResearchOutputPreview`
- `SecuritySummary`
- `MarketingFooter`

State needed:

- None beyond simple nav state.

Server-side data needed:

- None.

Client-side interactions:

- Header menu on mobile.
- CTA links to signup and login.

Loading states:

- None for static content.

Error states:

- None.

Empty states:

- None.

Accessibility requirements:

- H1 clearly names the product.
- CTA buttons have descriptive text.
- Marketing illustrations must have meaningful alt text or be marked decorative.
- Mobile nav must trap focus when open and close on Escape.

### About Page

Route: `/about`

Components:

- `MarketingHeader`
- `AboutIntro`
- `WhoItIsFor`
- `WhatItIsNot`
- `ResearchPrinciples`
- `MarketingFooter`

State needed:

- None.

Server-side data needed:

- None.

Client-side interactions:

- Mobile nav only.

Loading states:

- None.

Error states:

- None.

Empty states:

- None.

Accessibility requirements:

- Use semantic sections and headings.
- "What it is not" should be plain text, not hidden in hover-only UI.

### Security / Privacy Page

Route: `/security`

Components:

- `MarketingHeader`
- `PrivacyFirstIntro`
- `ConsentPolicySection`
- `DataHandlingSection`
- `StorageSecuritySection`
- `AIUseBoundariesSection`
- `DeletionControlsSection`
- `MarketingFooter`

State needed:

- None.

Server-side data needed:

- None.

Client-side interactions:

- Mobile nav.

Loading states:

- None.

Error states:

- None.

Empty states:

- None.

Accessibility requirements:

- Privacy commitments must be readable without animation or collapsed content.
- Use lists for recording scopes and data use boundaries.

### Login / Signup Page

Route: `/auth`

Components:

- `AuthCard`
- `EmailAuthForm`
- `MagicLinkForm`
- `AuthModeTabs`
- `AuthPrivacyNote`

State needed:

- Auth mode: `login` or `signup`.
- Email/password form state.
- Pending submit state.
- Auth error message.

Server-side data needed:

- If already authenticated, redirect to `/dashboard`.

Client-side interactions:

- Toggle login/signup.
- Submit credentials.
- Submit magic link.

Loading states:

- Button loading state.
- Form disabled while submitting.

Error states:

- Invalid email.
- Weak password.
- Existing account.
- Magic link failed.
- Rate-limited auth attempt.

Empty states:

- None.

Accessibility requirements:

- Inputs have labels.
- Errors are linked to fields with `aria-describedby`.
- Form-level error uses `role="alert"`.
- Auth mode tabs are keyboard accessible.

## Authenticated Researcher Dashboard

### Dashboard Overview

Route: `/dashboard`

Components:

- `AppShell`
- `DashboardStats`
- `RecentProjects`
- `RecentTests`
- `RecentSessions`
- `CreateProjectButton`

State needed:

- Workspace selection.

Server-side data needed:

- Current user profile.
- Workspaces.
- Selected workspace.
- Project count.
- Active test count.
- Recent sessions.
- Recent reports.

Client-side interactions:

- Switch workspace.
- Navigate to create project/test.
- Copy recent test link if available.

Loading states:

- Page-level skeleton.
- Skeleton rows for recent sessions.

Error states:

- Workspace failed to load.
- Unauthorized workspace.

Empty states:

- No workspace: prompt to create workspace.
- No projects: prompt to create first project.
- No sessions: explain that sessions appear after sharing a participant link.

Accessibility requirements:

- Stats have readable labels, not color-only meaning.
- Recent session rows are keyboard reachable.

### Workspace Settings

Route: `/dashboard/settings`

Components:

- `WorkspaceSettingsForm`
- `MemberList`
- `InviteMemberDialog`
- `RoleSelect`
- `RetentionSettingsForm`
- `DangerZone`

State needed:

- Editing workspace fields.
- Invite dialog state.
- Role update pending state.
- Delete confirmation state.

Server-side data needed:

- Workspace details.
- Current user's role.
- Workspace members.
- Retention settings.

Client-side interactions:

- Rename workspace.
- Invite member.
- Update member role.
- Change retention settings.
- Delete workspace if owner.

Loading states:

- Form skeleton.
- Member row skeleton.

Error states:

- Insufficient permissions.
- Last owner cannot be demoted.
- Invite failed.
- Role update failed.

Empty states:

- No other members.

Accessibility requirements:

- Role selects have explicit labels.
- Destructive actions use accessible confirmation dialogs.
- Member table has headers.

### Projects List

Route: `/dashboard/projects`

Components:

- `ProjectListHeader`
- `CreateProjectDialog`
- `ProjectTable`
- `ProjectCardGrid` for narrow screens
- `ProjectFilters`

State needed:

- Search query.
- Create project dialog state.
- Sort/filter state.

Server-side data needed:

- Workspace projects.
- Basic counts per project.

Client-side interactions:

- Search projects.
- Create project.
- Open project.

Loading states:

- Table skeleton.

Error states:

- Failed to load projects.
- Create project failed.

Empty states:

- "Create a project to start testing a landing page."

Accessibility requirements:

- Search input has label.
- Table row actions are keyboard accessible.

### Project Detail

Route: `/dashboard/projects/[projectId]`

Components:

- `ProjectHeader`
- `TestList`
- `CreateTestButton`
- `ProjectSessionSummary`
- `ProjectSettingsMenu`

State needed:

- Test status filter.
- Delete project confirmation.

Server-side data needed:

- Project.
- Tests in project.
- Session counts by test.
- Current user's role.

Client-side interactions:

- Filter tests.
- Create test.
- Open test.
- Archive/delete project if allowed.

Loading states:

- Header skeleton.
- Test list skeleton.

Error states:

- Project not found.
- Unauthorized.
- Failed to load tests.

Empty states:

- "Create a landing page test for this project."

Accessibility requirements:

- Status badges include text labels.
- Project actions menu supports keyboard navigation.

### Create Test Page

Route: `/dashboard/projects/[projectId]/tests/new`

Components:

- `CreateTestForm`
- `LandingPageUrlField`
- `TaskBuilder`
- `RecordingSettingsPanel`
- `ConsentPreview`
- `SaveDraftButton`
- `PublishButton`

State needed:

- Form fields.
- Task array with 3 to 5 tasks.
- Validation errors.
- Save/publish pending state.

Server-side data needed:

- Project.
- Workspace usage limits.
- Current user's role.
- Default consent copy.

Client-side interactions:

- Add/remove/reorder tasks.
- Validate landing page URL.
- Save draft.
- Publish test.
- Generate participant link after publish.

Loading states:

- Initial form skeleton if project data is loading.
- Button loading states.

Error states:

- Invalid URL.
- Too few or too many tasks.
- Save failed.
- Publish failed.
- Active test limit exceeded.

Empty states:

- Task builder starts with three blank task rows.

Accessibility requirements:

- Each task has a programmatic label.
- Reorder controls are keyboard accessible.
- Validation summary links to invalid fields.
- Consent preview is readable text, not image-only.

### Test Detail Page

Route: `/dashboard/tests/[testId]`

Components:

- `TestHeader`
- `ParticipantLinkPanel`
- `TestTaskList`
- `RecordingRequirements`
- `SessionSummaryCards`
- `TestActionsMenu`

State needed:

- Copy link state.
- Close/reopen confirmation state.

Server-side data needed:

- Test.
- Tasks.
- Participant links.
- Session counts.
- Current user's role.

Client-side interactions:

- Copy participant link.
- Create new participant link.
- Close test.
- Reopen test if allowed.
- Navigate to sessions.

Loading states:

- Link panel skeleton.
- Summary cards skeleton.

Error states:

- Test not found.
- Failed to create/copy link.
- Test closed.

Empty states:

- No participant link yet.
- No sessions yet.

Accessibility requirements:

- Copy result announced through `aria-live`.
- Link field has accessible label.
- Status changes are confirmed.

### Session List Page

Route: `/dashboard/tests/[testId]/sessions`

Components:

- `SessionListHeader`
- `SessionFilters`
- `SessionTable`
- `SessionStatusBadge`
- `ReportStatusBadge`
- `DeleteSessionDialog`

State needed:

- Status filter.
- Search/filter state.
- Delete pending state.

Server-side data needed:

- Test.
- Sessions.
- Report statuses.
- Consent statuses.

Client-side interactions:

- Filter sessions.
- Open session replay.
- Delete session.
- Request analysis for uploaded session.

Loading states:

- Table skeleton.

Error states:

- Failed to load sessions.
- Unauthorized.
- Delete failed.
- Analysis request failed.

Empty states:

- "No sessions yet. Share the participant link to collect landing page reactions."

Accessibility requirements:

- Table headers describe status/date/duration.
- Row actions have labels.
- Deletion confirmation includes what will be removed.

### Session Replay Page

Route: `/dashboard/sessions/[sessionId]`

Components:

- `SessionReplayHeader`
- `VideoPlayer`
- `Timeline`
- `TranscriptPanel`
- `TaskResponsesPanel`
- `ConsentSummaryCard`
- `RequestAnalysisButton`

State needed:

- Current playback time.
- Selected timeline marker.
- Transcript search.
- Signed playback URL state.
- Analysis request pending state.

Server-side data needed:

- Session.
- Consent status.
- Recording metadata.
- Signed playback URL generated server-side or via short-lived API.
- Events.
- Transcript.
- AI report status.

Client-side interactions:

- Play/pause video.
- Jump to timestamp.
- Select timeline marker.
- Search transcript.
- Request AI analysis.

Loading states:

- Video loading state.
- Transcript skeleton.
- Timeline skeleton.

Error states:

- Recording unavailable.
- Signed URL expired.
- Transcript failed.
- Session processing failed.
- Unauthorized.

Empty states:

- No transcript yet.
- No captured events.
- No recording uploaded.

Accessibility requirements:

- Video player has captions/transcript when available.
- Timeline markers are buttons with timestamp labels.
- Playback controls are keyboard accessible.
- Consent status is visible text.

### AI Report Page

Route: `/dashboard/sessions/[sessionId]/report`

Components:

- `ReportHeader`
- `ReportSummary`
- `ReportSectionList`
- `ConfusionMoments`
- `TrustDropoffs`
- `EngagementMoments`
- `QuoteList`
- `RecommendationList`
- `ClipSuggestions`
- `ExportReportMenu`

State needed:

- Selected section.
- Export pending state.
- Regenerate pending state if exposed.

Server-side data needed:

- AI report.
- Report sections.
- Clips.
- Session metadata.
- Recording timestamp availability.

Client-side interactions:

- Jump from report section to replay timestamp.
- Export report.
- Create clip from suggestion.

Loading states:

- Report processing state.
- Section skeletons.

Error states:

- Report failed.
- Report not found.
- Export failed.
- Clip creation failed.

Empty states:

- No confusion moments found.
- No trust drop-offs found.
- No quotes available.
- No recommendations available.

Accessibility requirements:

- AI report sections use headings.
- Timestamp links describe destination.
- Findings must not rely on color alone for severity.
- Export menu is keyboard accessible.

## Participant Pages

### Test Landing Page

Route: `/participate/[token]`

Components:

- `ParticipantHeader`
- `TestIntroCard`
- `TaskPreviewList`
- `RecordingScopeSummary`
- `StartTestButton`

State needed:

- None beyond token validation result.

Server-side data needed:

- Public test details by token.
- Tasks.
- Recording requirements.

Client-side interactions:

- Continue to consent.

Loading states:

- Intro skeleton.

Error states:

- Link invalid.
- Link expired.
- Link revoked.
- Test closed.
- Browser unsupported warning.

Empty states:

- None.

Accessibility requirements:

- Test name is H1.
- Recording scope is plain text.
- Start button clearly says consent comes next.

### Consent Page

Route: `/participate/[token]/consent`

Components:

- `ConsentSummary`
- `RecordingScopeList`
- `DataUseNotice`
- `ConsentCheckbox`
- `DeclineButton`
- `ContinueButton`

State needed:

- Checkbox state.
- Submit pending state.
- Participant session ID if created before consent, or creation pending state.

Server-side data needed:

- Public test details by token.
- Consent copy.

Client-side interactions:

- Accept consent.
- Decline and exit.

Loading states:

- Consent copy skeleton.
- Button loading state.

Error states:

- Consent save failed.
- Session creation failed.
- Token expired during flow.

Empty states:

- None.

Accessibility requirements:

- Checkbox label includes consent meaning.
- Continue disabled until checkbox checked.
- Consent text is not hidden behind a required scroll box.
- Errors announced with `role="alert"`.

### Device Check Page

Route: `/participate/[token]/device-check`

Components:

- `PermissionChecklist`
- `CameraPreview`
- `MicrophoneMeter`
- `ScreenShareStatus`
- `DeviceTroubleshooting`
- `StartRecordingButton`

State needed:

- Camera permission state.
- Microphone permission state.
- Screen permission state.
- Media stream refs.
- Device error state.

Server-side data needed:

- Public test recording requirements.
- Session ID validation through token.

Client-side interactions:

- Request camera/microphone permissions.
- Request screen share.
- Reselect screen.
- Start recording.

Loading states:

- Permission request pending state.

Error states:

- Camera denied.
- Microphone denied.
- Screen share cancelled.
- Browser unsupported.
- Device in use.

Empty states:

- Waiting for permissions.

Accessibility requirements:

- Permission statuses use text and icons.
- Camera preview has accessible label.
- Microphone meter has text status for screen readers.
- Troubleshooting content is keyboard reachable.

### Recording Session Page

Route: `/participate/[token]/record`

Components:

- `RecordingStatusBar`
- `RecorderControls`
- `CurrentTaskPanel`
- `TaskProgress`
- `WrittenReactionBox`
- `ManualReactionButtons`
- `LandingPageOpenButton`
- `Timer`
- `UploadPreparationDialog`

State needed:

- Active task index.
- Written reaction text.
- Manual reaction markers.
- MediaRecorder state.
- Captured chunks.
- Event queue.
- Network status.
- Timer.
- Upload preparation state.

Server-side data needed:

- Public test details.
- Tasks.
- Session ID validation.
- Max duration.

Client-side interactions:

- Start/stop recording.
- Advance task.
- Add written reaction.
- Mark manual reaction.
- Capture click/scroll/navigation events where possible.
- Auto-stop at max duration.

Loading states:

- Preparing recorder.
- Saving event batch.

Error states:

- Recorder failed.
- Screen share ended.
- Camera/mic disconnected.
- Network offline.
- Event ingest failed.

Empty states:

- Written reaction is optional and may be empty.

Accessibility requirements:

- Recording state is visible and announced.
- Stop button is always reachable by keyboard.
- Timer has accessible text and should not create noisy screen reader updates.
- Manual reaction buttons have clear labels.

### Post-Session Written Feedback Page

Route: `/participate/[token]/feedback`

Components:

- `UploadProgress`
- `PostSessionFeedbackForm`
- `TaskFeedbackList`
- `SubmitFeedbackButton`

State needed:

- Upload progress.
- Feedback responses.
- Submit pending state.
- Upload retry state.

Server-side data needed:

- Session validation.
- Tasks for response labels.

Client-side interactions:

- Upload recording using signed URL.
- Complete upload.
- Submit written feedback.
- Retry upload.

Loading states:

- Uploading.
- Finalizing session.
- Saving feedback.

Error states:

- Upload failed.
- Signed URL expired.
- Feedback save failed.
- Session expired.

Empty states:

- Feedback fields can be blank if optional.

Accessibility requirements:

- Upload progress uses `aria-valuenow`.
- Do-not-close warning is visible text.
- Retry button has clear label.

### Completion Page

Route: `/participate/[token]/complete`

Components:

- `CompletionMessage`
- `ResearcherClosingNote`
- `PrivacyFooterNote`
- `CloseTabButton`

State needed:

- None.

Server-side data needed:

- Public completion state by token/session.
- Optional researcher closing note.

Client-side interactions:

- Close tab where browser allows.

Loading states:

- Completion confirmation loading state.

Error states:

- Session not found.
- Completion status unavailable.

Empty states:

- None.

Accessibility requirements:

- Confirmation uses H1.
- Closing note is readable text.
- Do not auto-redirect after completion.

## Initial File And Folder Structure

```txt
app/
  (marketing)/
    layout.tsx
    page.tsx
    about/
      page.tsx
    security/
      page.tsx
  auth/
    page.tsx
    callback/
      route.ts
  dashboard/
    layout.tsx
    page.tsx
    settings/
      page.tsx
    projects/
      page.tsx
      [projectId]/
        page.tsx
        tests/
          new/
            page.tsx
    tests/
      [testId]/
        page.tsx
        sessions/
          page.tsx
    sessions/
      [sessionId]/
        page.tsx
        report/
          page.tsx
  participate/
    [token]/
      layout.tsx
      page.tsx
      consent/
        page.tsx
      device-check/
        page.tsx
      record/
        page.tsx
      feedback/
        page.tsx
      complete/
        page.tsx
  api/
    public/
      participant-links/
        [token]/
          route.ts
          sessions/
            route.ts
      sessions/
        [sessionId]/
          upload-url/
            route.ts
          recordings/
            [recordingId]/
              complete/
                route.ts
          events/
            route.ts
          feedback/
            route.ts
    internal/
      sessions/
        [sessionId]/
          generate-report/
            route.ts
components/
  app-shell/
    app-sidebar.tsx
    breadcrumbs.tsx
    page-header.tsx
    user-menu.tsx
    workspace-switcher.tsx
  marketing/
    marketing-footer.tsx
    marketing-header.tsx
    trust-banner.tsx
  participant/
    consent-summary.tsx
    device-preview.tsx
    exit-test-dialog.tsx
    participant-header.tsx
    participant-progress.tsx
    permission-checklist.tsx
    privacy-reminder.tsx
    recorder-controls.tsx
    recording-status-bar.tsx
    upload-progress.tsx
  reports/
    clip-list.tsx
    evidence-timestamp-link.tsx
    export-report-menu.tsx
    report-section.tsx
    report-status-badge.tsx
  sessions/
    session-status-badge.tsx
    task-responses-panel.tsx
    timeline.tsx
    transcript-panel.tsx
    video-player.tsx
  tests/
    copy-link-button.tsx
    recording-settings-panel.tsx
    task-builder.tsx
    test-status-badge.tsx
  ui/
    alert.tsx
    alert-dialog.tsx
    badge.tsx
    button.tsx
    card.tsx
    checkbox.tsx
    dialog.tsx
    dropdown-menu.tsx
    input.tsx
    progress.tsx
    select.tsx
    separator.tsx
    skeleton.tsx
    table.tsx
    tabs.tsx
    textarea.tsx
    toast.tsx
    tooltip.tsx
lib/
  actions/
    projects.ts
    reports.ts
    sessions.ts
    tests.ts
    workspaces.ts
  api/
    errors.ts
    rate-limit.ts
    responses.ts
  auth/
    require-user.ts
    roles.ts
  recording/
    media-recorder.ts
    upload.ts
  supabase/
    browser.ts
    server.ts
  validation/
    participant.ts
    projects.ts
    reports.ts
    sessions.ts
    tests.ts
    workspaces.ts
types/
  database.ts
  reports.ts
  sessions.ts
  tests.ts
```

## Implementation Notes

- Keep participant recording pages fully client-side where browser media APIs are required.
- Keep dashboard pages mostly Server Components and pass minimal props to Client Components.
- Generate signed playback URLs from server-only code.
- Use optimistic UI sparingly for sensitive actions; prefer confirmed server state for consent, upload completion, deletion, and report generation.
- Use route-level `loading.tsx` and `error.tsx` files for major sections once implementation begins.
- Keep the MVP navigation limited to research, participant sessions, reports, security, and account access.
