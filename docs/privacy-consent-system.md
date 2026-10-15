# AI Reaction Lab Privacy And Consent System

This is product guidance and UX copy, not legal advice. Teams should review their own legal, institutional, or compliance obligations before running research, especially for regulated data, students, employees, health contexts, or minors.

AI Reaction Lab is for explicit, opt-in user research. It is not hidden tracking, passive surveillance, biometric identification, or emotion scoring.

## 1. Participant Consent Screen

Route:

```txt
/participate/[token]/consent
```

Screen goal:

Make it clear what will be recorded, why it is being recorded, who can review it, what AI may do with it, and that participation is voluntary.

Required UI elements:

- Test/researcher name.
- Plain-English summary.
- Recording scope checklist:
  - Screen.
  - Camera.
  - Microphone.
  - Clicks.
  - Scrolls.
  - Pauses.
  - Written feedback.
  - Self-reported reactions.
- "What this is not" privacy boundary.
- Voluntary participation statement.
- Sensitive information warning.
- Required consent checkbox.
- Continue button disabled until consent is checked.
- Decline/exit button.

Required checkbox copy:

```txt
I understand what will be recorded and consent to participate in this research session.
```

Recommended short screen copy:

```txt
Before you start, please review what this session records. Recording will not begin until you consent, grant browser permissions, and press Start recording.
```

## 2. Plain-English Consent Summary

```txt
You are being invited to take part in a user research session.

If you continue, this session may record your screen, camera, microphone, clicks, scrolls, pauses, written feedback, and any reactions you choose to mark. The researcher uses this information to understand how people respond to the landing page or task.

Participation is voluntary. You can stop at any time. Please do not enter passwords, private account information, financial information, health information, or other sensitive personal information during this test.

AI may help summarize the session into research notes, quotes, moments of confusion, trust concerns, engagement moments, recommendations, and suggested clips. AI Reaction Lab does not use face recognition, biometric identity verification, or emotion scoring.
```

## 3. Full Consent Text

```txt
Consent to participate in a recorded research session

You are being asked to participate in a user research session created by the researcher or organization that shared this link with you.

What may be recorded

If you consent and start the session, AI Reaction Lab may record:
- Your screen during the testing session.
- Your camera, if requested by the test.
- Your microphone, if requested by the test.
- Clicks, scrolls, pauses, task timestamps, and session events.
- Written feedback you submit after the session.
- Self-reported reactions you choose to mark during the session.

Recording does not begin until you:
1. Review this consent notice.
2. Check the consent box.
3. Grant browser permissions.
4. Start the recording.

Purpose of the recording

The researcher may use the recording and related session data to understand how participants react to a landing page, task, product message, or user experience. This may include reviewing moments of confusion, hesitation, trust concern, engagement, task completion, quotes, and recommendations.

Use of AI

AI Reaction Lab may use AI systems to summarize the session and create structured research findings. AI analysis may use transcripts, written feedback, task timestamps, click events, scroll events, pause events, manually marked reactions, and recording metadata.

AI Reaction Lab does not use your recording for face recognition, biometric identity verification, protected trait inference, or emotion scoring. AI-generated findings should be reviewed by the researcher before use.

Voluntary participation

Participation is voluntary. You may decline before starting. You may stop the recording at any time. If you stop early, the portion already recorded may still be submitted unless you are given a separate withdrawal option by the researcher.

Sensitive information

Do not enter passwords, private account information, financial information, health information, government ID numbers, or other sensitive personal information during this test. Close private tabs, windows, documents, and notifications before sharing your screen.

Who can access the session

Your session may be reviewed by the researcher or authorized members of their workspace. Recordings are private by default. AI Reaction Lab does not provide permanent public media links. Access to recordings should use short-lived links after authorization checks.

Retention and deletion

The researcher or workspace controls how long recordings and reports are retained, subject to AI Reaction Lab product settings and applicable obligations. You may contact the researcher to ask about access, deletion, or withdrawal options.

By checking the consent box, you confirm that you understand what may be recorded and agree to participate in this research session.
```

## 4. Researcher Privacy Guidelines

Show these guidelines during test creation and workspace settings.

```txt
Use AI Reaction Lab only for opt-in user research.

Before sharing a test:
- Tell participants what they will be asked to do.
- Use tasks that avoid sensitive information.
- Do not ask participants to enter passwords, financial information, health information, government IDs, or private account data.
- Do not use AI Reaction Lab for hidden monitoring, employee surveillance, or passive tracking.
- Do not record children or students under the age requiring special consent unless you have appropriate compliance support.
- Keep recordings private and share only with people who need them for research.
- Delete recordings when you no longer need them.
- Review AI-generated findings before acting on or sharing them.

Do not use AI Reaction Lab to:
- Identify a person from their face, voice, or body.
- Score emotions as facts.
- Infer age, gender, race, ethnicity, disability, health, personality, or other protected traits.
- Make high-impact decisions about employment, credit, housing, education, insurance, healthcare, or legal status.
```

## 5. Data Retention Settings

Workspace-level defaults:

```txt
Default recording retention: 90 days
Available settings: 30, 60, 90, 180 days
Optional participant anonymization: after 30, 60, 90, 180 days
Default report retention: same as recording unless raw media deletion is enabled
```

Test-level override:

```txt
Use workspace default
Delete recordings after 30 days
Delete recordings after 60 days
Delete recordings after 90 days
Delete recordings after 180 days
```

Recommended UI copy:

```txt
Retention controls how long recordings are kept before deletion. Shorter retention reduces privacy risk and storage usage.
```

Raw media deletion option:

```txt
Delete raw recordings while keeping the AI report.
```

Warning copy:

```txt
Deleting raw recordings removes video/audio playback and clips for affected sessions. Reports may still contain quotes and research findings unless you delete the full session.
```

## 6. Participant Data Deletion Request Flow

Participant-facing flow:

1. Participant contacts the researcher using the contact method shown in the test or completion page.
2. Participant provides enough information to locate the session, such as date/time, test link, display name, or email if provided.
3. Researcher opens the session or participant record.
4. Researcher chooses:
   - Anonymize participant identifiers.
   - Delete raw recordings.
   - Delete full session data.
5. App shows confirmation of what will be removed.
6. App writes an audit log.
7. App queues storage deletion for recordings, clips, thumbnails, and transcript artifacts as needed.

Researcher confirmation copy:

```txt
This action removes participant data for this session. Deleted recordings and clips cannot be restored after storage deletion completes.
```

Participant response copy:

```txt
Your deletion request has been received by the researcher. If the session can be located, the researcher can delete or anonymize the associated participant data.
```

## 7. Workspace Data Export Flow

Workspace export should be owner/admin-only.

Export options:

- Projects.
- Tests.
- Session metadata.
- Consent records.
- AI reports.
- Transcripts.
- Audit logs.
- Media inventory.

Raw recordings:

- Do not include raw recordings in a default workspace export.
- Provide a separate owner/admin-only export flow for recordings.
- Use short-lived signed URLs or generated archive files with strict expiration.

Export warning copy:

```txt
Exports may contain participant research data, quotes, transcripts, and consent records. Store exports securely and delete them when no longer needed.
```

## 8. Recording Disclosure Copy

Short disclosure:

```txt
Recording active: screen, camera, microphone, clicks, scrolls, pauses, and written responses may be saved for research review.
```

Before permissions:

```txt
Choose only the screen or window you want to share. Close private tabs, documents, messages, and notifications before continuing.
```

During recording:

```txt
Recording is active. You can pause or stop at any time.
```

Paused:

```txt
Recording is paused. Resume when you are ready, or stop and submit the session.
```

Upload:

```txt
Your recording is uploading securely. Keep this tab open until upload completes.
```

Recovery:

```txt
A recording from this session is saved on this device but has not finished uploading. You can retry upload or discard the local recording.
```

## 9. AI Analysis Disclosure Copy

Short copy:

```txt
AI may summarize this session into research findings, quotes, recommendations, and suggested clips.
```

Full copy:

```txt
AI Reaction Lab may use AI to help summarize the session. The AI may review transcripts, written feedback, task timestamps, click events, scroll events, pause events, manually marked reactions, and recording metadata.

AI findings are meant to support research review. They may be incomplete or wrong and should be reviewed by the researcher.

AI Reaction Lab does not use camera footage for face recognition, biometric identification, protected trait inference, or emotion scoring.
```

Report footer:

```txt
This report uses consented session data and cautious research language. It does not infer identity, protected traits, biometric attributes, or hidden emotions.
```

## 10. Prohibited Use Policy

```txt
AI Reaction Lab may not be used for:

- Hidden recording or passive surveillance.
- Recording people without clear notice and explicit consent.
- Monitoring employees, students, customers, or users without an opt-in research context.
- Biometric identification, face recognition, speaker identification, or identity verification.
- Emotion scoring as fact.
- Inferring age, gender, race, ethnicity, disability, health, personality, or other protected traits.
- Recording children or minors without appropriate legal/compliance review and required consent.
- Collecting passwords, financial information, health information, government IDs, or other sensitive personal information.
- Making high-impact decisions about employment, education, housing, credit, insurance, healthcare, legal status, or access to essential services.
- Publishing participant recordings through permanent public links.
- Scraping, redistributing, or selling participant recordings or transcripts.
- Using recordings to harass, shame, manipulate, or profile participants.
```

Enforcement options:

- Revoke participant links.
- Close tests.
- Suspend workspace uploads.
- Suspend AI analysis.
- Delete prohibited content.
- Require additional review before reactivation.
