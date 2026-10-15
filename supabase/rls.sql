-- AI Reaction Lab Row Level Security policies.
-- Apply after supabase/schema.sql.
--
create schema if not exists app_private;

-- Must run outside the transaction that creates functions using the new value.
alter type audit_action add value if not exists 'session_created';
alter type audit_action add value if not exists 'recording_upload_url_created';
alter type audit_action add value if not exists 'recording_uploaded';
alter type audit_action add value if not exists 'session_event_ingested';
alter type audit_action add value if not exists 'ai_analysis_requested';
alter type audit_action add value if not exists 'report_viewed';

begin;

create or replace function app_private.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function app_private.workspace_role_for(workspace uuid)
returns workspace_role
language sql
stable
security definer
set search_path = public, app_private
as $$
  select wm.role
  from workspace_members wm
  where wm.workspace_id = workspace
    and wm.user_id = auth.uid()
    and wm.deleted_at is null
  limit 1
$$;

create or replace function app_private.is_workspace_member(workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = workspace
      and wm.user_id = auth.uid()
      and wm.deleted_at is null
  )
$$;

create or replace function app_private.has_workspace_role(
  workspace uuid,
  allowed_roles workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select app_private.workspace_role_for(workspace) = any(allowed_roles)
$$;

create or replace function app_private.can_manage_workspace(workspace uuid)
returns boolean
language sql
stable
as $$
  select app_private.has_workspace_role(workspace, array['owner', 'admin']::workspace_role[])
$$;

create or replace function app_private.can_research(workspace uuid)
returns boolean
language sql
stable
as $$
  select app_private.has_workspace_role(workspace, array['owner', 'admin', 'researcher']::workspace_role[])
$$;

create or replace function app_private.can_view(workspace uuid)
returns boolean
language sql
stable
as $$
  select app_private.has_workspace_role(workspace, array['owner', 'admin', 'researcher', 'viewer']::workspace_role[])
$$;

create or replace function app_private.is_valid_participant_link(link_token text)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from participant_links pl
    join tests t on t.id = pl.test_id
    where pl.token = link_token
      and pl.status = 'active'
      and pl.deleted_at is null
      and pl.revoked_at is null
      and (pl.expires_at is null or pl.expires_at > now())
      and (pl.max_sessions is null or pl.session_count < pl.max_sessions)
      and t.status = 'active'
      and t.deleted_at is null
  )
$$;

create or replace function app_private.valid_participant_link_id(link_token text)
returns uuid
language sql
stable
security definer
set search_path = public, app_private
as $$
  select pl.id
  from participant_links pl
  join tests t on t.id = pl.test_id
  where pl.token = link_token
    and pl.status = 'active'
    and pl.deleted_at is null
    and pl.revoked_at is null
    and (pl.expires_at is null or pl.expires_at > now())
    and (pl.max_sessions is null or pl.session_count < pl.max_sessions)
    and t.status = 'active'
    and t.deleted_at is null
  limit 1
$$;

create or replace function app_private.session_belongs_to_token(
  session uuid,
  link_token text
)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from sessions s
    join participant_links pl on pl.id = s.participant_link_id
    where s.id = session
      and pl.token = link_token
      and app_private.is_valid_participant_link(link_token)
      and s.deleted_at is null
  )
$$;

-- Participant RPCs. Prefer calling these from Next.js server routes so rate
-- limits, bot checks, IP hashing, and usage limits can be enforced before DB writes.

create or replace function public.get_public_test_by_token(link_token text)
returns table (
  test_id uuid,
  workspace_id uuid,
  project_id uuid,
  test_name text,
  landing_page_url text,
  participant_intro text,
  require_screen boolean,
  require_camera boolean,
  require_microphone boolean,
  capture_clicks boolean,
  capture_scrolls boolean,
  max_duration_seconds integer
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    t.id,
    t.workspace_id,
    t.project_id,
    t.name,
    t.landing_page_url,
    t.participant_intro,
    t.require_screen,
    t.require_camera,
    t.require_microphone,
    t.capture_clicks,
    t.capture_scrolls,
    t.max_duration_seconds
  from participant_links pl
  join tests t on t.id = pl.test_id
  where pl.token = link_token
    and app_private.is_valid_participant_link(link_token)
  limit 1
$$;

create or replace function public.get_public_test_tasks_by_token(link_token text)
returns table (
  task_id uuid,
  task_position integer,
  task_type task_type,
  prompt text,
  is_required boolean,
  metadata jsonb
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    tt.id,
    tt.position,
    tt.type,
    tt.prompt,
    tt.is_required,
    tt.metadata
  from participant_links pl
  join test_tasks tt on tt.test_id = pl.test_id
  where pl.token = link_token
    and app_private.is_valid_participant_link(link_token)
    and tt.deleted_at is null
  order by tt.position
$$;

create or replace function public.create_participant_session(
  link_token text,
  participant_display_name text default null,
  participant_email citext default null,
  participant_user_agent text default null,
  participant_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  link_row participant_links%rowtype;
  test_row tests%rowtype;
  project_id_value uuid;
  participant_id_value uuid;
  session_id_value uuid;
  session_count_value integer;
  max_sessions_value integer;
begin
  select *
  into link_row
  from participant_links
  where token = link_token
    and status = 'active'
    and deleted_at is null
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if not found then
    raise exception 'participant link is invalid or unavailable';
  end if;

  select *
  into test_row
  from tests
  where id = link_row.test_id
    and status = 'active'
    and deleted_at is null;

  if not found then
    raise exception 'test is not active';
  end if;

  select count(*)
  into session_count_value
  from sessions
  where test_id = test_row.id
    and deleted_at is null;

  select ul.max_sessions_per_test
  into max_sessions_value
  from usage_limits ul
  where ul.workspace_id = test_row.workspace_id;

  if max_sessions_value is not null and session_count_value >= max_sessions_value then
    raise exception 'session limit reached';
  end if;

  if link_row.max_sessions is not null and link_row.session_count >= link_row.max_sessions then
    raise exception 'participant link session limit reached';
  end if;

  project_id_value := test_row.project_id;

  insert into participants (
    workspace_id,
    test_id,
    display_name,
    email
  )
  values (
    test_row.workspace_id,
    test_row.id,
    nullif(participant_display_name, ''),
    nullif(participant_email, '')
  )
  returning id into participant_id_value;

  insert into sessions (
    workspace_id,
    project_id,
    test_id,
    participant_link_id,
    participant_id,
    status,
    consent_status,
    user_agent,
    ip_hash,
    delete_after_at,
    anonymize_after_at
  )
  values (
    test_row.workspace_id,
    project_id_value,
    test_row.id,
    link_row.id,
    participant_id_value,
    'created',
    'not_requested',
    participant_user_agent,
    participant_ip_hash,
    case
      when coalesce(test_row.retention_days, (select retention_days from workspaces where id = test_row.workspace_id)) is null
      then null
      else now() + make_interval(days => coalesce(test_row.retention_days, (select retention_days from workspaces where id = test_row.workspace_id)))
    end,
    case
      when (select anonymize_participants_after_days from workspaces where id = test_row.workspace_id) is null
      then null
      else now() + make_interval(days => (select anonymize_participants_after_days from workspaces where id = test_row.workspace_id))
    end
  )
  returning id into session_id_value;

  update participant_links
  set session_count = session_count + 1
  where id = link_row.id;

  insert into audit_logs (
    workspace_id,
    action,
    resource_type,
    resource_id,
    session_id,
    participant_id,
    ip_hash,
    user_agent,
    metadata
  )
  values (
    test_row.workspace_id,
    'session_created',
    'session',
    session_id_value,
    session_id_value,
    participant_id_value,
    participant_ip_hash,
    participant_user_agent,
    jsonb_build_object('participant_link_id', link_row.id)
  );

  return session_id_value;
end;
$$;

create or replace function public.accept_participant_consent(
  link_token text,
  session_id_value uuid,
  consent_text_value text,
  screen_value boolean,
  camera_value boolean,
  microphone_value boolean,
  clicks_value boolean,
  scrolls_value boolean,
  written_responses_value boolean,
  participant_user_agent text default null,
  participant_ip_hash text default null
)
returns void
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  session_row sessions%rowtype;
begin
  if not app_private.session_belongs_to_token(session_id_value, link_token) then
    raise exception 'session is not available for this participant token';
  end if;

  select *
  into session_row
  from sessions
  where id = session_id_value
  for update;

  insert into consent_records (
    workspace_id,
    test_id,
    session_id,
    participant_id,
    consent_text,
    accepted,
    accepted_at,
    screen_consented,
    camera_consented,
    microphone_consented,
    clicks_consented,
    scrolls_consented,
    written_responses_consented,
    ip_hash,
    user_agent
  )
  values (
    session_row.workspace_id,
    session_row.test_id,
    session_row.id,
    session_row.participant_id,
    consent_text_value,
    true,
    now(),
    screen_value,
    camera_value,
    microphone_value,
    clicks_value,
    scrolls_value,
    written_responses_value,
    participant_ip_hash,
    participant_user_agent
  );

  update sessions
  set
    status = 'consented',
    consent_status = 'accepted',
    updated_at = now()
  where id = session_id_value;

  insert into audit_logs (
    workspace_id,
    action,
    resource_type,
    resource_id,
    session_id,
    participant_id,
    ip_hash,
    user_agent
  )
  values (
    session_row.workspace_id,
    'consent_accepted',
    'consent_record',
    session_id_value,
    session_id_value,
    session_row.participant_id,
    participant_ip_hash,
    participant_user_agent
  );
end;
$$;

create or replace function public.append_participant_events(
  link_token text,
  session_id_value uuid,
  events jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  session_row sessions%rowtype;
  inserted_count integer;
begin
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a json array';
  end if;

  if jsonb_array_length(events) > 100 then
    raise exception 'too many events in one batch';
  end if;

  if not app_private.session_belongs_to_token(session_id_value, link_token) then
    raise exception 'session is not available for this participant token';
  end if;

  select *
  into session_row
  from sessions
  where id = session_id_value;

  insert into session_events (
    workspace_id,
    test_id,
    session_id,
    task_id,
    type,
    timestamp_ms,
    payload
  )
  select
    session_row.workspace_id,
    session_row.test_id,
    session_row.id,
    nullif(event_item->>'task_id', '')::uuid,
    (event_item->>'type')::event_type,
    (event_item->>'timestamp_ms')::integer,
    coalesce(event_item->'payload', '{}'::jsonb)
  from jsonb_array_elements(events) as event_item;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

-- The anon role can execute only these narrow participant functions.
revoke all on all tables in schema public from anon;
grant execute on function public.get_public_test_by_token(text) to anon;
grant execute on function public.get_public_test_tasks_by_token(text) to anon;
grant execute on function public.create_participant_session(text, text, citext, text, text) to anon;
grant execute on function public.accept_participant_consent(text, uuid, text, boolean, boolean, boolean, boolean, boolean, boolean, text, text) to anon;
grant execute on function public.append_participant_events(text, uuid, jsonb) to anon;

-- RLS enablement.

alter table users enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table usage_limits enable row level security;
alter table projects enable row level security;
alter table tests enable row level security;
alter table test_tasks enable row level security;
alter table participant_links enable row level security;
alter table participants enable row level security;
alter table sessions enable row level security;
alter table consent_records enable row level security;
alter table session_events enable row level security;
alter table recordings enable row level security;
alter table transcripts enable row level security;
alter table ai_reports enable row level security;
alter table ai_report_sections enable row level security;
alter table clips enable row level security;
alter table audit_logs enable row level security;

alter table users force row level security;
alter table workspaces force row level security;
alter table workspace_members force row level security;
alter table usage_limits force row level security;
alter table projects force row level security;
alter table tests force row level security;
alter table test_tasks force row level security;
alter table participant_links force row level security;
alter table participants force row level security;
alter table sessions force row level security;
alter table consent_records force row level security;
alter table session_events force row level security;
alter table recordings force row level security;
alter table transcripts force row level security;
alter table ai_reports force row level security;
alter table ai_report_sections force row level security;
alter table clips force row level security;
alter table audit_logs force row level security;

-- users

create policy "users can read own profile"
on users for select
to authenticated
using (id = auth.uid() and deleted_at is null);

create policy "users can read profiles in shared workspaces"
on users for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from workspace_members mine
    join workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid()
      and mine.deleted_at is null
      and theirs.user_id = users.id
      and theirs.deleted_at is null
  )
);

create policy "users can insert own profile"
on users for insert
to authenticated
with check (id = auth.uid());

create policy "users can update own profile"
on users for update
to authenticated
using (id = auth.uid() and deleted_at is null)
with check (id = auth.uid());

-- workspaces

create policy "members can read workspaces"
on workspaces for select
to authenticated
using (deleted_at is null and app_private.can_view(id));

create policy "authenticated users can create workspaces"
on workspaces for insert
to authenticated
with check (created_by = auth.uid());

create policy "owners and admins can update workspace settings"
on workspaces for update
to authenticated
using (deleted_at is null and app_private.can_manage_workspace(id))
with check (app_private.can_manage_workspace(id));

create policy "owners can delete workspaces"
on workspaces for delete
to authenticated
using (app_private.has_workspace_role(id, array['owner']::workspace_role[]));

-- workspace_members

create policy "members can read workspace membership"
on workspace_members for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "owners and admins can add workspace members"
on workspace_members for insert
to authenticated
with check (app_private.can_manage_workspace(workspace_id));

create policy "owners and admins can update workspace members"
on workspace_members for update
to authenticated
using (deleted_at is null and app_private.can_manage_workspace(workspace_id))
with check (app_private.can_manage_workspace(workspace_id));

create policy "owners and admins can remove workspace members"
on workspace_members for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- usage_limits

create policy "members can read workspace usage limits"
on usage_limits for select
to authenticated
using (app_private.can_view(workspace_id));

-- No authenticated insert/update/delete policy for usage_limits.
-- Enforce updates in trusted server code or service-role background jobs.

-- projects

create policy "members can read projects"
on projects for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can create projects"
on projects for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and created_by = auth.uid()
);

create policy "researchers can update projects"
on projects for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete projects"
on projects for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- tests

create policy "members can read tests"
on tests for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can create tests"
on tests for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and created_by = auth.uid()
  and exists (
    select 1
    from projects p
    where p.id = project_id
      and p.workspace_id = tests.workspace_id
      and p.deleted_at is null
  )
);

create policy "researchers can update tests"
on tests for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from projects p
    where p.id = project_id
      and p.workspace_id = tests.workspace_id
      and p.deleted_at is null
  )
);

create policy "owners and admins can delete tests"
on tests for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- test_tasks

create policy "members can read test tasks"
on test_tasks for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can create test tasks"
on test_tasks for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from tests t
    where t.id = test_id
      and t.workspace_id = test_tasks.workspace_id
      and t.deleted_at is null
  )
);

create policy "researchers can update test tasks"
on test_tasks for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from tests t
    where t.id = test_id
      and t.workspace_id = test_tasks.workspace_id
      and t.deleted_at is null
  )
);

create policy "researchers can delete test tasks"
on test_tasks for delete
to authenticated
using (app_private.can_research(workspace_id));

-- participant_links

create policy "members can read participant links"
on participant_links for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can create participant links"
on participant_links for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and created_by = auth.uid()
  and exists (
    select 1
    from tests t
    where t.id = test_id
      and t.workspace_id = participant_links.workspace_id
      and t.deleted_at is null
  )
);

create policy "researchers can update participant links"
on participant_links for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete participant links"
on participant_links for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- participants

create policy "researchers can read participants"
on participants for select
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id));

create policy "researchers can update participants for anonymization"
on participants for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete participants"
on participants for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- Participant inserts are done through create_participant_session().

-- sessions

create policy "members can read sessions"
on sessions for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can update sessions"
on sessions for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete sessions"
on sessions for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- Session inserts for participants are done through create_participant_session().

-- consent_records

create policy "researchers can read consent records"
on consent_records for select
to authenticated
using (app_private.can_research(workspace_id));

create policy "researchers can update consent withdrawal"
on consent_records for update
to authenticated
using (app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

-- Consent inserts for participants are done through accept_participant_consent().

-- session_events

create policy "members can read session events"
on session_events for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can insert session events"
on session_events for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from sessions s
    where s.id = session_id
      and s.workspace_id = session_events.workspace_id
      and s.deleted_at is null
  )
);

create policy "researchers can update session events"
on session_events for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete session events"
on session_events for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- Participant event inserts are done through append_participant_events().

-- recordings

create policy "researchers can read recording metadata"
on recordings for select
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id));

create policy "researchers can insert recording metadata"
on recordings for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from sessions s
    where s.id = session_id
      and s.workspace_id = recordings.workspace_id
      and s.deleted_at is null
  )
);

create policy "researchers can update recording metadata"
on recordings for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete recording metadata"
on recordings for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- Object storage files must remain private. Use short-lived signed URLs after
-- checking one of the policies above in server code.

-- transcripts

create policy "members can read transcripts"
on transcripts for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can insert transcripts"
on transcripts for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from sessions s
    where s.id = session_id
      and s.workspace_id = transcripts.workspace_id
      and s.deleted_at is null
  )
);

create policy "researchers can update transcripts"
on transcripts for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete transcripts"
on transcripts for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- ai_reports

create policy "members can read ai reports"
on ai_reports for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can insert ai reports"
on ai_reports for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from sessions s
    where s.id = session_id
      and s.workspace_id = ai_reports.workspace_id
      and s.deleted_at is null
  )
);

create policy "researchers can update ai reports"
on ai_reports for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete ai reports"
on ai_reports for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- ai_report_sections

create policy "members can read ai report sections"
on ai_report_sections for select
to authenticated
using (deleted_at is null and app_private.can_view(workspace_id));

create policy "researchers can insert ai report sections"
on ai_report_sections for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from ai_reports ar
    where ar.id = ai_report_id
      and ar.workspace_id = ai_report_sections.workspace_id
      and ar.deleted_at is null
  )
);

create policy "researchers can update ai report sections"
on ai_report_sections for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete ai report sections"
on ai_report_sections for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- clips

create policy "researchers can read clips"
on clips for select
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id));

create policy "researchers can insert clips"
on clips for insert
to authenticated
with check (
  app_private.can_research(workspace_id)
  and exists (
    select 1
    from sessions s
    where s.id = session_id
      and s.workspace_id = clips.workspace_id
      and s.deleted_at is null
  )
);

create policy "researchers can update clips"
on clips for update
to authenticated
using (deleted_at is null and app_private.can_research(workspace_id))
with check (app_private.can_research(workspace_id));

create policy "owners and admins can delete clips"
on clips for delete
to authenticated
using (app_private.can_manage_workspace(workspace_id));

-- audit_logs

create policy "owners and admins can read audit logs"
on audit_logs for select
to authenticated
using (
  workspace_id is not null
  and app_private.can_manage_workspace(workspace_id)
);

-- No authenticated insert/update/delete policy for audit_logs.
-- Insert audit logs only from server-side functions or service-role jobs.

commit;
