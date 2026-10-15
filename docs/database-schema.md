# AI Reaction Lab Supabase Database Design

This schema supports the landing-page reaction testing MVP as a free multi-tenant Supabase application.

## Multi-Tenant Model

Workspace is the tenant boundary. Users can belong to multiple workspaces through `workspace_members`.

Workspace roles:

- `owner`
- `admin`
- `researcher`
- `viewer`

Every project belongs to a workspace. Every test belongs to a project. Sessions, recordings, transcripts, AI reports, clips, consent records, audit logs, and usage limits all include workspace ownership for RLS-friendly access checks.

## Core Tables

### users

Application profile row for Supabase Auth users. Auth credentials remain in `auth.users`.

### workspaces

Top-level tenant. Stores workspace name, slug, creator, and retention defaults.

### workspace_members

Maps users to workspaces and roles. This enables multi-workspace membership and future collaboration.

### usage_limits

Stores free-service cost controls:

- Max projects per workspace.
- Max active tests per workspace.
- Max sessions per test.
- Max recording duration.
- Max storage per workspace.
- Max AI reports per day.

### projects

Groups related landing page tests.

### tests

Represents one landing page reaction test. Stores landing page URL, participant intro, recording requirements, status, and duration limit.

### test_tasks

Stores the 3 to 5 participant tasks/questions for a test.

### participant_links

Stores unique public tokens for test participation. Links can be paused, expired, or revoked.

### participants

Stores optional participant identity. Designed to support anonymization.

### sessions

Represents one participant test attempt. Tracks consent state, recording state, device metadata, duration, retention fields, and errors.

### consent_records

Stores exact accepted consent text, timestamp, recording scopes, and consent lifecycle. This is a critical privacy table.

### session_events

Stores click, scroll, navigation, task progress, manual reaction, permission, and error events.

### recordings

Stores recording metadata and object storage paths. Raw video/audio is not stored in Postgres.

### transcripts

Stores transcribed text and timestamped segments.

### ai_reports

Stores structured AI report output for a session and test.

### ai_report_sections

Normalizes report sections for UI rendering and querying: summary, confusion moments, trust drop-offs, engagement moments, quotes, recommendations, task findings, and clip suggestions.

### clips

Stores suggested or generated clip metadata. MVP can use timestamp ranges before rendered video clips exist.

### audit_logs

Tracks sensitive actions such as consent acceptance, recording views, deletes, anonymization, report generation, and exports.

## Soft Delete Strategy

Use `deleted_at` for user-facing deletion. Privacy-sensitive deletion should also enqueue deletion of related object storage files.

Recommended behavior:

- `projects.deleted_at`: hides project and child tests from normal UI.
- `tests.deleted_at`: hides test and prevents new sessions.
- `sessions.deleted_at`: hides session and should trigger deletion of recordings, transcripts, reports, events, and clips.
- `participants.anonymized_at`: removes direct participant identifiers while preserving research structure.
- `recordings.deleted_at`: marks object storage file for deletion or indicates deletion is complete.
- `transcripts.deleted_at`, `ai_reports.deleted_at`, `clips.deleted_at`: hide derived data.

## Data Retention

Retention fields:

- `workspaces.retention_days`
- `workspaces.anonymize_participants_after_days`
- `tests.retention_days`
- `sessions.delete_after_at`
- `sessions.anonymize_after_at`
- `recordings.delete_after_at`
- `transcripts.delete_after_at`
- `ai_reports.delete_after_at`

Suggested calculation:

```txt
effective_retention_days = tests.retention_days if set, else workspaces.retention_days
session.delete_after_at = session.completed_at + effective_retention_days
recording.delete_after_at = session.delete_after_at
```

## Usage Limit Strategy

All limits must be enforced server-side.

Before creating a project:

```sql
select count(*)
from projects
where workspace_id = :workspace_id
  and deleted_at is null
  and status <> 'deleted';
```

Before activating a test:

```sql
select count(*)
from tests
where workspace_id = :workspace_id
  and status = 'active'
  and deleted_at is null;
```

Before creating a session:

```sql
select count(*)
from sessions
where test_id = :test_id
  and deleted_at is null;
```

Before accepting/uploading a recording:

```sql
select coalesce(sum(size_bytes), 0)
from recordings
where workspace_id = :workspace_id
  and deleted_at is null
  and status in ('uploaded', 'processing', 'ready');
```

Before creating an AI report, lock the usage row in a transaction:

```sql
select *
from usage_limits
where workspace_id = :workspace_id
for update;
```

Reset `ai_reports_used_today` when `ai_reports_usage_date <> current_date`, then increment if under `max_ai_reports_per_day`.

## RLS Direction

Enable RLS on every table.

Basic authenticated rule:

```sql
exists (
  select 1
  from workspace_members
  where workspace_members.workspace_id = table.workspace_id
    and workspace_members.user_id = auth.uid()
    and workspace_members.deleted_at is null
)
```

Public participant flows should use narrow server endpoints rather than broad anonymous table policies.
