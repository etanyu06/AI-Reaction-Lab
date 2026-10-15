-- Demo seed data for local development.
-- This assumes the matching auth.users row already exists in Supabase Auth.

insert into users (id, email, full_name)
values (
  '00000000-0000-0000-0000-000000000001',
  'founder@example.com',
  'Demo Founder'
)
on conflict (id) do nothing;

insert into workspaces (id, name, slug, created_by)
values (
  '10000000-0000-0000-0000-000000000001',
  'Demo Workspace',
  'demo-workspace',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

update users
set default_workspace_id = '10000000-0000-0000-0000-000000000001'
where id = '00000000-0000-0000-0000-000000000001';

insert into workspace_members (workspace_id, user_id, role)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'owner'
)
on conflict (workspace_id, user_id) do nothing;

insert into usage_limits (workspace_id)
values ('10000000-0000-0000-0000-000000000001')
on conflict (workspace_id) do nothing;

insert into projects (id, workspace_id, name, description, created_by)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Landing Page Validation',
  'Test whether visitors understand the product and trust the signup flow.',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

insert into tests (
  id,
  workspace_id,
  project_id,
  name,
  landing_page_url,
  participant_intro,
  status,
  created_by,
  published_at
)
values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Homepage First Impression Test',
  'https://example.com',
  'Please review this landing page and speak your thoughts out loud.',
  'active',
  '00000000-0000-0000-0000-000000000001',
  now()
)
on conflict (id) do nothing;

insert into test_tasks (workspace_id, test_id, position, type, prompt)
values
(
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  1,
  'question',
  'What do you think this product does?'
),
(
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  2,
  'instruction',
  'Find the primary call to action and describe what you expect to happen.'
),
(
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  3,
  'question',
  'What, if anything, makes you hesitate or reduces trust?'
)
on conflict (test_id, position) do nothing;

insert into participant_links (
  workspace_id,
  test_id,
  token,
  status,
  created_by
)
values (
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'demo_test_link_token_123',
  'active',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (token) do nothing;
