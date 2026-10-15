# AI Reaction Lab RLS Security Notes

The RLS policies live in `supabase/rls.sql` and should be applied after `supabase/schema.sql`.

## Security Model

Authenticated researchers use Supabase Auth. Authorization is based on workspace membership:

- `owner`: can manage workspace settings, members, and sensitive deletion.
- `admin`: can manage workspace settings, members, and sensitive deletion.
- `researcher`: can create projects/tests, manage test content, and view sessions/reports.
- `viewer`: can read sessions, transcripts, AI reports, and report sections only.

Participants do not need accounts. They should use token-scoped server routes or the narrow SECURITY DEFINER RPCs in `supabase/rls.sql`.

## Participant Link Rules

Participant links are valid only when:

- Token matches.
- Link status is `active`.
- Link is not revoked.
- Link is not deleted.
- Link has not expired.
- Link has not exceeded its `max_sessions`.
- The linked test is `active`.
- The linked test is not deleted.

Participants should never receive broad table access. They can:

- Fetch the public test by token.
- Fetch tasks by token.
- Create a session for that token.
- Accept consent for their own token-created session.
- Append bounded event batches to their own token-created session.

Participants cannot:

- Query sessions directly.
- Read other participants.
- Read recordings.
- Read transcripts.
- Read AI reports.
- Read audit logs.
- Read usage limits.

## Recording Access

The database stores recording metadata and private object storage paths only.

Raw media access should use server-generated short-lived signed URLs:

1. Authenticated user requests playback.
2. Server verifies workspace membership and role.
3. Server reads recording metadata.
4. Server creates a short-lived signed URL from Supabase Storage or R2.
5. Server writes an audit log entry for sensitive recording access.

Do not expose storage paths to participants or anonymous clients.

## Usage Limits

Usage limits must be enforced in trusted server code, not only client UI.

Enforce before:

- Creating a project.
- Activating a test.
- Creating a participant session.
- Accepting a recording upload.
- Starting AI processing.
- Generating an AI report.

For `max_ai_reports_per_day`, lock the `usage_limits` row in a transaction:

```sql
select *
from usage_limits
where workspace_id = :workspace_id
for update;
```

Then reset the daily counter if needed and increment atomically.

## Common RLS Mistakes

- Letting anonymous users query tables directly with a token filter. RLS cannot safely see arbitrary query parameters unless you route through a controlled function.
- Making participant links guessable. Use high-entropy random tokens.
- Returning storage paths to clients that should only receive signed URLs.
- Trusting client-provided `workspace_id`, `project_id`, or `test_id`.
- Forgetting `with check` policies on inserts and updates.
- Using permissive `or true` style policies while debugging and forgetting to remove them.
- Allowing viewers to read recording metadata when viewers should only read sessions/reports.
- Letting researchers update `usage_limits` or insert `audit_logs` directly.
- Not checking soft-deleted rows in RLS policies.
- Using SECURITY DEFINER functions without setting `search_path`.
- Exposing service role keys to the browser.
- Relying on RLS alone for abuse protection. Public endpoints still need rate limits, file size limits, duration limits, and bot protection.

## Test Cases

Use at least four users:

- User A: owner of Workspace A.
- User B: researcher in Workspace A.
- User C: viewer in Workspace A.
- User D: owner of Workspace B.

Use at least one anonymous client for participant tests.

### Workspace Isolation

- User A can read Workspace A.
- User B can read Workspace A.
- User C can read Workspace A.
- User D cannot read Workspace A.
- User A cannot read Workspace B unless explicitly added.

### Role Permissions

- Owner can update workspace settings.
- Admin can update workspace settings.
- Researcher cannot update workspace settings.
- Viewer cannot update workspace settings.
- Researcher can create projects and tests.
- Viewer cannot create projects or tests.
- Viewer can read sessions and AI reports.
- Viewer cannot read recording metadata.
- Viewer cannot insert audit logs.

### Participant Token Access

- Anonymous user can fetch an active test by valid token.
- Anonymous user cannot fetch a test by expired token.
- Anonymous user cannot fetch a test by revoked token.
- Anonymous user cannot fetch a draft or closed test.
- Anonymous user can create a session through a valid token.
- Anonymous user cannot directly select from `sessions`.
- Anonymous user cannot directly select from `recordings`.
- Anonymous user cannot directly select from `ai_reports`.

### Sensitive Data

- Researcher can read recording metadata for their workspace.
- Workspace B user cannot read Workspace A recordings.
- Viewer cannot read recording metadata.
- Only owner/admin can read audit logs.
- No authenticated user can directly insert audit logs.
- No authenticated user can directly update usage limits.

## Example Queries That Should Pass

As a researcher in a workspace:

```sql
select *
from projects
where workspace_id = 'workspace-a-id';
```

```sql
insert into tests (
  workspace_id,
  project_id,
  name,
  landing_page_url,
  participant_intro,
  created_by
)
values (
  'workspace-a-id',
  'project-a-id',
  'Homepage test',
  'https://example.com',
  'Please review this landing page out loud.',
  auth.uid()
);
```

As a viewer in a workspace:

```sql
select *
from sessions
where workspace_id = 'workspace-a-id';
```

```sql
select *
from ai_reports
where workspace_id = 'workspace-a-id';
```

As an owner/admin:

```sql
update workspaces
set retention_days = 60
where id = 'workspace-a-id';
```

As an anonymous participant:

```sql
select *
from public.get_public_test_by_token('valid-token');
```

```sql
select public.create_participant_session(
  'valid-token',
  'Participant 1',
  null,
  'Mozilla/5.0',
  'hashed-ip'
);
```

## Example Queries That Should Fail

As a user outside the workspace:

```sql
select *
from sessions
where workspace_id = 'workspace-a-id';
```

As a viewer:

```sql
insert into projects (workspace_id, name, created_by)
values ('workspace-a-id', 'Viewer should fail', auth.uid());
```

```sql
select *
from recordings
where workspace_id = 'workspace-a-id';
```

As a researcher:

```sql
update workspaces
set retention_days = 7
where id = 'workspace-a-id';
```

```sql
insert into audit_logs (workspace_id, action, resource_type)
values ('workspace-a-id', 'recording_viewed', 'recording');
```

As an anonymous participant:

```sql
select *
from sessions;
```

```sql
select *
from ai_reports;
```

```sql
select *
from recordings;
```

```sql
select *
from public.get_public_test_by_token('revoked-or-expired-token');
```
