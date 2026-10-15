create extension if not exists pgcrypto;
create extension if not exists citext;

create type workspace_role as enum ('owner', 'admin', 'researcher', 'viewer');
create type project_status as enum ('active', 'archived', 'deleted');
create type test_status as enum ('draft', 'active', 'closed', 'archived', 'deleted');
create type task_type as enum ('instruction', 'question', 'rating', 'written_reaction');
create type participant_link_status as enum ('active', 'paused', 'expired', 'revoked');
create type participant_status as enum ('active', 'anonymized', 'deleted');
create type session_status as enum ('created', 'consented', 'permission_check', 'recording', 'uploading', 'uploaded', 'processing', 'complete', 'failed', 'deleted');
create type consent_status as enum ('not_requested', 'accepted', 'declined', 'withdrawn');
create type event_type as enum ('click', 'scroll', 'navigation', 'task_start', 'task_complete', 'manual_reaction', 'recording_start', 'recording_stop', 'permission_granted', 'permission_denied', 'error');
create type recording_type as enum ('screen', 'camera', 'microphone', 'combined', 'thumbnail');
create type recording_status as enum ('pending', 'uploading', 'uploaded', 'processing', 'ready', 'failed', 'deleted');
create type transcript_status as enum ('pending', 'processing', 'complete', 'failed', 'deleted');
create type ai_report_status as enum ('pending', 'processing', 'complete', 'failed', 'deleted');
create type ai_report_section_type as enum ('summary', 'confusion_moment', 'trust_dropoff', 'engagement_moment', 'quote', 'recommendation', 'task_finding', 'clip_suggestion');
create type clip_status as enum ('suggested', 'processing', 'ready', 'failed', 'deleted');
create type audit_action as enum ('workspace_created', 'workspace_updated', 'member_added', 'member_removed', 'project_created', 'project_deleted', 'test_created', 'test_published', 'test_closed', 'participant_link_created', 'session_created', 'session_viewed', 'session_deleted', 'participant_anonymized', 'recording_upload_url_created', 'recording_uploaded', 'recording_viewed', 'recording_deleted', 'session_event_ingested', 'ai_analysis_requested', 'report_viewed', 'ai_report_generated', 'share_export_created', 'consent_accepted', 'consent_withdrawn');

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  full_name text,
  avatar_url text,
  default_workspace_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext unique,
  created_by uuid references users(id) on delete set null,
  retention_days integer not null default 90,
  anonymize_participants_after_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table users
  add constraint users_default_workspace_fk
  foreign key (default_workspace_id)
  references workspaces(id)
  on delete set null;

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role workspace_role not null default 'researcher',
  invited_by uuid references users(id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, user_id)
);

create table usage_limits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  max_projects_per_workspace integer not null default 5,
  max_active_tests_per_workspace integer not null default 10,
  max_sessions_per_test integer not null default 25,
  max_recording_duration_seconds integer not null default 1200,
  max_storage_bytes_per_workspace bigint not null default 10737418240,
  max_ai_reports_per_day integer not null default 50,
  storage_bytes_used bigint not null default 0,
  ai_reports_used_today integer not null default 0,
  ai_reports_usage_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  status project_status not null default 'active',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table tests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  landing_page_url text not null,
  participant_intro text,
  status test_status not null default 'draft',
  require_screen boolean not null default true,
  require_camera boolean not null default true,
  require_microphone boolean not null default true,
  capture_clicks boolean not null default true,
  capture_scrolls boolean not null default true,
  max_duration_seconds integer not null default 1200,
  created_by uuid references users(id) on delete set null,
  published_at timestamptz,
  closed_at timestamptz,
  retention_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz,
  constraint tests_duration_positive check (max_duration_seconds > 0),
  constraint tests_landing_page_url_nonempty check (length(trim(landing_page_url)) > 0)
);

create table test_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  position integer not null,
  type task_type not null default 'question',
  prompt text not null,
  is_required boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (test_id, position),
  constraint test_tasks_position_positive check (position > 0)
);

create table participant_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  token text not null unique,
  status participant_link_status not null default 'active',
  max_sessions integer,
  session_count integer not null default 0,
  expires_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  deleted_at timestamptz
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  display_name text,
  email citext,
  external_ref text,
  status participant_status not null default 'active',
  anonymized_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  participant_link_id uuid references participant_links(id) on delete set null,
  participant_id uuid references participants(id) on delete set null,
  status session_status not null default 'created',
  consent_status consent_status not null default 'not_requested',
  started_at timestamptz,
  stopped_at timestamptz,
  uploaded_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  duration_seconds integer,
  user_agent text,
  browser_name text,
  os_name text,
  device_type text,
  ip_hash text,
  error_code text,
  error_message text,
  delete_after_at timestamptz,
  anonymize_after_at timestamptz,
  anonymized_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0)
);

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  session_id uuid not null unique references sessions(id) on delete cascade,
  participant_id uuid references participants(id) on delete set null,
  consent_version text not null default 'v1',
  consent_text text not null,
  accepted boolean not null default false,
  accepted_at timestamptz,
  withdrawn_at timestamptz,
  screen_consented boolean not null default false,
  camera_consented boolean not null default false,
  microphone_consented boolean not null default false,
  clicks_consented boolean not null default false,
  scrolls_consented boolean not null default false,
  written_responses_consented boolean not null default false,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table session_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  task_id uuid references test_tasks(id) on delete set null,
  type event_type not null,
  occurred_at timestamptz not null default now(),
  timestamp_ms integer not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint session_events_timestamp_nonnegative check (timestamp_ms >= 0)
);

create table recordings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  type recording_type not null,
  status recording_status not null default 'pending',
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  duration_seconds integer,
  checksum_sha256 text,
  uploaded_at timestamptz,
  processed_at timestamptz,
  delete_after_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path),
  constraint recordings_size_nonnegative check (size_bytes is null or size_bytes >= 0),
  constraint recordings_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0)
);

create table transcripts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  recording_id uuid references recordings(id) on delete set null,
  status transcript_status not null default 'pending',
  language text,
  text text,
  segments jsonb not null default '[]',
  model text,
  error_message text,
  delete_after_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ai_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  transcript_id uuid references transcripts(id) on delete set null,
  status ai_report_status not null default 'pending',
  model text,
  summary text,
  structured_output jsonb not null default '{}',
  generated_at timestamptz,
  error_message text,
  delete_after_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ai_report_sections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  ai_report_id uuid not null references ai_reports(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  type ai_report_section_type not null,
  title text,
  body text,
  quote text,
  recommendation text,
  severity text,
  confidence numeric(4,3),
  start_ms integer,
  end_ms integer,
  position integer not null default 0,
  evidence jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint ai_report_sections_confidence_range check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint ai_report_sections_time_valid check (start_ms is null or end_ms is null or end_ms >= start_ms)
);

create table clips (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  ai_report_id uuid references ai_reports(id) on delete set null,
  ai_report_section_id uuid references ai_report_sections(id) on delete set null,
  recording_id uuid references recordings(id) on delete set null,
  status clip_status not null default 'suggested',
  title text not null,
  description text,
  start_ms integer not null,
  end_ms integer not null,
  reason text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint clips_time_valid check (end_ms > start_ms),
  constraint clips_size_nonnegative check (size_bytes is null or size_bytes >= 0)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  actor_user_id uuid references users(id) on delete set null,
  action audit_action not null,
  resource_type text not null,
  resource_id uuid,
  session_id uuid references sessions(id) on delete set null,
  participant_id uuid references participants(id) on delete set null,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index users_email_idx on users(email) where deleted_at is null;
create index workspace_members_user_id_idx on workspace_members(user_id) where deleted_at is null;
create index workspace_members_workspace_id_idx on workspace_members(workspace_id) where deleted_at is null;
create index workspace_members_role_idx on workspace_members(workspace_id, role) where deleted_at is null;
create index projects_workspace_id_idx on projects(workspace_id) where deleted_at is null;
create index projects_status_idx on projects(workspace_id, status) where deleted_at is null;
create index tests_workspace_id_idx on tests(workspace_id) where deleted_at is null;
create index tests_project_id_idx on tests(project_id) where deleted_at is null;
create index tests_status_idx on tests(workspace_id, status) where deleted_at is null;
create index tests_active_count_idx on tests(workspace_id) where status = 'active' and deleted_at is null;
create index test_tasks_test_id_idx on test_tasks(test_id) where deleted_at is null;
create index test_tasks_order_idx on test_tasks(test_id, position) where deleted_at is null;
create index participant_links_test_id_idx on participant_links(test_id) where deleted_at is null;
create index participant_links_token_idx on participant_links(token) where deleted_at is null;
create index participant_links_status_idx on participant_links(test_id, status) where deleted_at is null;
create index participants_workspace_id_idx on participants(workspace_id) where deleted_at is null;
create index participants_test_id_idx on participants(test_id) where deleted_at is null;
create index participants_status_idx on participants(workspace_id, status);
create index sessions_workspace_id_idx on sessions(workspace_id) where deleted_at is null;
create index sessions_project_id_idx on sessions(project_id) where deleted_at is null;
create index sessions_test_id_idx on sessions(test_id) where deleted_at is null;
create index sessions_participant_id_idx on sessions(participant_id) where deleted_at is null;
create index sessions_status_idx on sessions(test_id, status) where deleted_at is null;
create index sessions_created_at_idx on sessions(workspace_id, created_at desc) where deleted_at is null;
create index sessions_retention_idx on sessions(delete_after_at) where deleted_at is null;
create index consent_records_session_id_idx on consent_records(session_id);
create index consent_records_test_id_idx on consent_records(test_id);
create index consent_records_accepted_at_idx on consent_records(workspace_id, accepted_at);
create index session_events_session_time_idx on session_events(session_id, timestamp_ms) where deleted_at is null;
create index session_events_type_idx on session_events(session_id, type) where deleted_at is null;
create index session_events_workspace_created_idx on session_events(workspace_id, created_at desc) where deleted_at is null;
create index recordings_session_id_idx on recordings(session_id) where deleted_at is null;
create index recordings_workspace_id_idx on recordings(workspace_id) where deleted_at is null;
create index recordings_status_idx on recordings(session_id, status) where deleted_at is null;
create index recordings_retention_idx on recordings(delete_after_at) where deleted_at is null;
create index transcripts_session_id_idx on transcripts(session_id) where deleted_at is null;
create index transcripts_status_idx on transcripts(workspace_id, status) where deleted_at is null;
create index ai_reports_session_id_idx on ai_reports(session_id) where deleted_at is null;
create index ai_reports_test_id_idx on ai_reports(test_id) where deleted_at is null;
create index ai_reports_status_idx on ai_reports(workspace_id, status) where deleted_at is null;
create index ai_reports_generated_at_idx on ai_reports(workspace_id, generated_at desc) where deleted_at is null;
create index ai_report_sections_report_id_idx on ai_report_sections(ai_report_id) where deleted_at is null;
create index ai_report_sections_type_idx on ai_report_sections(ai_report_id, type) where deleted_at is null;
create index ai_report_sections_order_idx on ai_report_sections(ai_report_id, position) where deleted_at is null;
create index clips_session_id_idx on clips(session_id) where deleted_at is null;
create index clips_report_id_idx on clips(ai_report_id) where deleted_at is null;
create index clips_status_idx on clips(workspace_id, status) where deleted_at is null;
create index audit_logs_workspace_created_idx on audit_logs(workspace_id, created_at desc);
create index audit_logs_actor_idx on audit_logs(actor_user_id, created_at desc);
create index audit_logs_resource_idx on audit_logs(resource_type, resource_id);
