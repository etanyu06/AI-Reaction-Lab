import { absoluteUrl } from "@/lib/utils";

export const mockWorkspace = {
  id: "10000000-0000-0000-0000-000000000001",
  name: "Demo Workspace",
  role: "owner"
};

export const mockProjects = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    workspace_id: mockWorkspace.id,
    name: "Landing Page Validation",
    description: "Understand first impressions and trust barriers.",
    status: "active",
    created_at: "2026-05-03T10:00:00Z",
    tests_count: 1,
    sessions_count: 3
  }
];

export const mockTests = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    workspace_id: mockWorkspace.id,
    project_id: mockProjects[0].id,
    name: "Homepage First Impression Test",
    landing_page_url: "https://example.com",
    participant_intro: "Review this landing page and speak your thoughts out loud.",
    status: "active",
    public_url: absoluteUrl("/participate/demo_test_link_token_123"),
    sessions_count: 3,
    created_at: "2026-05-03T11:00:00Z"
  }
];

export const mockTasks = [
  {
    id: "6a9fb4ea-4487-4565-b334-8f1ed3dfaa10",
    position: 1,
    prompt: "What do you think this product does?",
    type: "question"
  },
  {
    id: "84f4a8aa-3baf-47d3-9c2b-6d56d4ac0262",
    position: 2,
    prompt: "Find the primary call to action and describe what you expect to happen.",
    type: "instruction"
  },
  {
    id: "951f6dfa-58d9-4d86-a7d8-932a25c8d251",
    position: 3,
    prompt: "What, if anything, makes you hesitate or reduces trust?",
    type: "question"
  }
];

export const mockSessions = [
  {
    id: "a8e5ad6c-38a8-4b38-8ef6-51a66e9f2c41",
    test_id: mockTests[0].id,
    status: "complete",
    consent_status: "accepted",
    duration_seconds: 312,
    created_at: "2026-05-03T12:30:00Z",
    report_status: "complete"
  },
  {
    id: "7c2bb046-7bcb-4452-b7ad-197bd1aecc2f",
    test_id: mockTests[0].id,
    status: "processing",
    consent_status: "accepted",
    duration_seconds: 244,
    created_at: "2026-05-03T13:05:00Z",
    report_status: "processing"
  }
];

export const mockReport = {
  id: "7f4b1d63-2f42-41f9-a9df-7f68b0d2f111",
  session_id: mockSessions[0].id,
  summary:
    "The participant understood the broad purpose but hesitated around the primary CTA and wanted clearer recording-scope copy before continuing.",
  confidence: "high",
  sections: [
    {
      type: "confusion",
      title: "CTA outcome was unclear",
      timestamp: "00:52",
      evidence: "The participant said they were not sure what would happen after clicking.",
      severity: "high"
    },
    {
      type: "trust",
      title: "Recording scope needed earlier explanation",
      timestamp: "01:38",
      evidence: "The participant wanted to know whether the full screen or only the page would be recorded.",
      severity: "high"
    }
  ]
};
