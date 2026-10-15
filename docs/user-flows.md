# AI Reaction Lab MVP User Flows

There are two user types:

- Researcher: company user, creator, student founder, or researcher.
- Participant: tester who joins through a public link.

## Researcher Flow

### 1. Sign Up

Goal: Create a researcher account.

Main UI elements:

- App name/logo.
- Email field.
- Password field or magic-link option.
- Continue button.
- Login link.
- Short privacy-first positioning copy.

Primary action: Create account.

Edge cases:

- User already has an account.
- Magic link expired.
- Password too weak.
- Email confirmation required.

Empty states: None.

Error states:

- Invalid email.
- Account already exists.
- Auth provider unavailable.
- Rate-limited signup attempts.

Security/privacy copy:

- "AI Reaction Lab is for opt-in user research. Recordings are created only after participant consent."
- "We never start participant recording without explicit consent."

### 2. Create Workspace

Goal: Create the researcher's workspace.

Main UI elements:

- Workspace name field.
- Optional organization type selector.
- Create workspace button.

Primary action: Create workspace.

Edge cases:

- User refreshes before completing setup.
- User already belongs to a workspace.

Empty state:

- "Create your first workspace to organize projects and tests."

Error states:

- Workspace name missing.
- Workspace creation failed.
- User session expired.

Security/privacy copy:

- "Workspace data is private to authorized members."

### 3. Dashboard

Goal: Give the researcher a starting point for projects, tests, and recent sessions.

Main UI elements:

- Workspace switcher.
- Create project button.
- Project list.
- Recent tests.
- Recent sessions.

Primary action: Create project.

Edge cases:

- No projects yet.
- No sessions yet.
- User has deleted all projects.

Empty states:

- "Create a project to start testing a landing page."
- "No sessions yet. Share a participant link after creating a test."

Error states:

- Failed to load workspace.
- Failed to load projects.
- Unauthorized workspace access.

Security/privacy copy:

- "Participant recordings and reports are private by default."

### 4. Create Project

Goal: Create a container for related landing page tests.

Main UI elements:

- Project name field.
- Optional description field.
- Create project button.
- Cancel/back button.

Primary action: Create project.

Edge cases:

- Duplicate project name.
- User navigates away with unsaved input.
- Very long project name.

Empty states: None.

Error states:

- Missing project name.
- Project creation failed.
- User lacks workspace permission.

Security/privacy copy:

- "Only workspace members can access this project."

### 5. Project Detail

Goal: Show tests and sessions for one project.

Main UI elements:

- Project title.
- Create test button.
- Test list.
- Test status labels.
- Session counts.
- Last session date.

Primary action: Create test.

Edge cases:

- Project has no tests.
- Test exists but has no sessions.
- User opens stale project URL.

Empty state:

- "Create a landing page test to collect your first reaction session."

Error states:

- Project not found.
- Unauthorized access.
- Failed to load tests.

Security/privacy copy:

- "Only people with the participant link can access active tests. Recordings still require consent."

### 6. Create Test

Goal: Create an active landing page reaction test.

Main UI elements:

- Test name.
- Landing page URL.
- Participant intro text.
- Task/question builder.
- 3 to 5 task indicator.
- Recording requirements.
- Max session duration.
- Consent preview.
- Save draft button.
- Publish/generate link button.

Primary action: Generate participant link.

Edge cases:

- Invalid URL.
- Fewer than 3 questions.
- More than 5 questions.
- URL is unreachable.
- Landing page blocks embedding.
- Researcher saves draft before all fields are complete.

Empty states:

- "Add 3 to 5 tasks or questions for participants to complete."
- "Generate a link after adding a URL and tasks."

Error states:

- Invalid URL.
- Missing test name.
- Missing participant intro.
- Too few or too many tasks.
- Failed to save test.
- Failed to generate participant link.

Security/privacy copy:

- "Participants will see a consent screen before any recording starts."
- "Do not ask participants to enter passwords, payment details, or sensitive personal information during a test."

### 7. Test Link Screen

Goal: Let the researcher copy and share the participant link.

Main UI elements:

- Participant link field.
- Copy link button.
- Open preview button.
- Test status.
- Session count.
- Close test button.

Primary action: Copy link.

Edge cases:

- Test is still draft.
- Test is closed.
- Link opened by researcher.
- Link leaked or abused.

Empty state:

- "Share this link with participants to collect sessions."

Error states:

- Failed to copy link.
- Failed to load link.
- Test not active.

Security/privacy copy:

- "Anyone with this link can open the test intro, but recording requires explicit consent."
- "Close the test anytime to stop new sessions."

### 8. Test Session List

Goal: Show all participant sessions for a test.

Main UI elements:

- Session table/list.
- Session status.
- Participant alias/name if provided.
- Created date.
- Duration.
- Upload status.
- AI report status.
- Filters.
- Open session button.
- Delete session action.

Primary action: Open session.

Edge cases:

- No sessions yet.
- Session upload incomplete.
- Session processing failed.
- Participant stopped early.

Empty state:

- "No sessions yet. Share the participant link to start collecting landing page reactions."

Error states:

- Failed to load sessions.
- Unauthorized access.
- Session not found.
- Delete failed.

Security/privacy copy:

- "Sessions include participant recordings and should be shared only with people who need access."

### 9. Individual Session View

Goal: Let the researcher review the raw participant session.

Main UI elements:

- Video player.
- Timeline markers.
- Participant task responses.
- Transcript panel.
- Session metadata.
- Consent status.
- Open AI report button.
- Delete session button.

Primary action: View AI report.

Edge cases:

- Video still processing.
- Transcript not ready.
- AI report not ready.
- Missing camera stream.
- Missing microphone audio.
- Participant denied one permission.
- Short/incomplete session.

Empty states:

- "Transcript will appear after processing."
- "No events captured for this session."
- "Report is being generated."

Error states:

- Failed to load video.
- Signed playback URL expired.
- Media file missing.
- Processing failed.
- Unauthorized access.

Security/privacy copy:

- "This session was recorded after participant consent."
- "Do not share recordings outside your authorized research context."

### 10. AI Report View

Goal: Show structured findings from the landing page reaction session.

Main UI elements:

- Session summary.
- Confusion moments.
- Trust drop-offs.
- Engagement moments.
- Quotes.
- Recommendations.
- Suggested clips.
- Timestamp links to video.
- Task-by-task findings.
- Export/share controls.

Primary action: Export findings or share report.

Edge cases:

- Report still processing.
- Report failed.
- Transcript quality is poor.
- Recording has no speech.
- Participant did not complete all tasks.
- AI has low evidence for a finding.

Empty states:

- "The AI report is being generated."
- "No strong confusion moments were detected."
- "No trust drop-offs were detected."
- "No participant quotes available."

Error states:

- Failed to generate report.
- Failed to load report.
- Failed to regenerate report.
- Unauthorized access.

Security/privacy copy:

- "AI findings are generated from the participant's consented recording, transcript, written responses, and interaction events."
- "AI does not identify the participant, perform biometric analysis, or score emotions."
- "Review findings before sharing or acting on them."

### 11. Export / Share Findings

Goal: Let researcher share useful findings without exposing more data than needed.

Main UI elements:

- Copy summary.
- Download report Markdown.
- Download transcript.
- Optional share link toggle.
- Share link copy button.
- Revoke share link button.

Primary action: Copy summary or create share link.

Edge cases:

- Report incomplete.
- Share link revoked.
- Share link expired.
- Researcher shares with wrong person.

Empty state:

- "Report must finish processing before export."

Error states:

- Failed to create share link.
- Failed to revoke share link.
- Failed to export report.
- Unauthorized access.

Security/privacy copy:

- "Share only with people who are allowed to view this participant research."
- "You can revoke this link anytime."
- "Raw recordings remain private unless explicitly included."

## Participant Flow

### 1. Open Test Link

Goal: Load the public landing page test.

Main UI elements:

- Test name.
- Researcher/workspace name.
- Landing page being tested.
- Estimated duration.
- Start button.

Primary action: Start.

Edge cases:

- Invalid link.
- Test closed.
- Test deleted.
- Test not active.
- Unsupported browser.
- Mobile browser.

Empty states: None.

Error states:

- Test not found.
- Test is closed.
- Browser unsupported.
- Network failure.

Security/privacy copy:

- "This is an opt-in research test. Recording will not start until you review and accept consent."

### 2. Test Intro

Goal: Explain what the participant will do before consent.

Main UI elements:

- Researcher intro/instructions.
- Landing page URL.
- Task list preview.
- Estimated time.
- Continue button.

Primary action: Continue.

Edge cases:

- Participant does not understand task.
- Landing page URL looks suspicious.
- Participant wants to quit before consent.

Error states:

- Test details failed to load.
- Landing page URL invalid or unavailable.

Security/privacy copy:

- "You may stop at any time."
- "Do not enter passwords, payment information, or sensitive personal information during this test."

### 3. Consent Screen

Goal: Collect explicit informed consent before recording.

Main UI elements:

- Plain-language consent summary.
- Recording details.
- Data use explanation.
- Voluntary participation statement.
- Consent checkbox.
- Continue button.
- Decline/exit option.

Primary action: I consent and continue.

Edge cases:

- Participant declines.
- Participant wants camera off but test requires camera.
- Participant has privacy concerns.

Error states:

- Consent record failed to save.
- Session creation failed.
- Consent checkbox not checked.

Security/privacy copy:

- "Recording starts only after you consent and grant browser permissions."
- "This test does not use face recognition, biometric identity verification, or emotion scoring."
- "You can stop the session at any time."

### 4. Permissions Screen

Goal: Guide participant through browser permission prompts.

Main UI elements:

- Required permissions checklist.
- Permission status indicators.
- Request permissions button.
- Troubleshooting hints.
- Back/exit option.

Primary action: Grant permissions.

Edge cases:

- Participant denies camera.
- Participant denies microphone.
- Participant cancels screen sharing.
- Participant selects wrong screen/window.
- Browser does not support screen recording.

Error states:

- Camera unavailable.
- Microphone unavailable.
- Screen capture unavailable.
- Permission denied.
- Browser unsupported.

Security/privacy copy:

- "Choose only the screen or window you want to share."
- "Recording will be visible while active."
- "You can stop recording anytime."

### 5. Recording Setup Check

Goal: Confirm recording inputs work before starting the task.

Main UI elements:

- Camera preview.
- Microphone level indicator.
- Screen selection confirmation.
- Checklist.
- Start test button.

Primary action: Start recording.

Edge cases:

- Camera preview black.
- Microphone muted.
- Wrong screen selected.
- Participant needs to reselect screen.

Error states:

- No video stream.
- No audio track.
- Screen stream ended.
- Device disconnected.

Security/privacy copy:

- "Recording begins when you press Start recording."
- "Close private tabs or windows before sharing your screen."
- "Do not enter sensitive information during the test."

### 6. Active Recording / Task Screen

Goal: Let participant complete landing page tasks while being recorded.

Main UI elements:

- Recording indicator.
- Stop button.
- Landing page open button.
- Current task/question.
- Task progress indicator.
- Written reaction box.
- Optional manual reaction markers.
- Next task button.
- Timer.

Primary action: Next task or finish test.

Edge cases:

- Participant stops early.
- Participant closes landing page.
- Participant goes silent.
- Participant navigates away.
- Participant loses internet.
- Screen share ends.
- Camera or mic disconnects.
- Max duration reached.

Empty state:

- Written reaction box can be blank because it is optional.

Error states:

- Recording stopped unexpectedly.
- MediaRecorder failed.
- Event capture failed.
- Session save failed.
- Network disconnected.

Security/privacy copy:

- Persistent: "Recording active."
- "Speak your thoughts out loud as you complete each task."
- "Do not enter passwords, payment details, or sensitive personal information."

### 7. Submit Session / Upload

Goal: Upload the recording and session data.

Main UI elements:

- Upload progress.
- Upload status text.
- Do-not-close warning.
- Retry button if failed.

Primary action: Automatic upload, then continue.

Edge cases:

- Large recording.
- Slow connection.
- Upload interrupted.
- Participant closes tab.
- Signed upload URL expires.

Error states:

- Upload failed.
- Network disconnected.
- Recording file unavailable.
- Session finalization failed.

Security/privacy copy:

- "Your recording is uploading securely."
- "Only the researcher's authorized workspace can access this session."
- "Do not close this tab until upload completes."

### 8. Completion Page

Goal: Confirm the participant is finished.

Main UI elements:

- Thank-you message.
- Completion confirmation.
- Optional researcher-provided closing note.
- Close tab button.
- Privacy note.

Primary action: Close.

Edge cases:

- Upload completed but AI processing is pending.
- Participant wants to withdraw afterward.
- Participant refreshes completion page.

Error states:

- Completion state unavailable.
- Session not found.

Security/privacy copy:

- "Your session was submitted for research review."
- "Contact the researcher if you have questions about your participation or data."
- "AI Reaction Lab does not use your recording for biometric identification or emotion scoring."
