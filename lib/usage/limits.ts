import { AppError } from "@/lib/api/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getUsageLimits(workspaceId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("usage_limits")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw new AppError("INTERNAL_ERROR", "Could not load usage limits.");

  if (!data) {
    return {
      max_projects_per_workspace: 5,
      max_active_tests_per_workspace: 5,
      max_sessions_per_test: 25,
      max_recording_duration_seconds: 900,
      max_storage_bytes_per_workspace: 10737418240,
      max_ai_reports_per_day: 25,
      storage_bytes_used: 0,
      ai_reports_used_today: 0,
      ai_reports_usage_date: new Date().toISOString().slice(0, 10)
    };
  }

  return data;
}

export async function assertCanCreateProject(workspaceId: string) {
  const supabase = createSupabaseAdminClient();
  const limits = await getUsageLimits(workspaceId);
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  if (error) throw new AppError("INTERNAL_ERROR", "Could not check project usage.");
  if ((count ?? 0) >= limits.max_projects_per_workspace) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      "You have reached the project limit for this workspace."
    );
  }
}

export async function assertCanActivateTest(workspaceId: string) {
  const supabase = createSupabaseAdminClient();
  const limits = await getUsageLimits(workspaceId);
  const { count, error } = await supabase
    .from("tests")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) throw new AppError("INTERNAL_ERROR", "Could not check active test usage.");
  if ((count ?? 0) >= limits.max_active_tests_per_workspace) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      "This workspace has reached the active test limit."
    );
  }
}

export async function assertCanCreateSession(testId: string, workspaceId: string) {
  const supabase = createSupabaseAdminClient();
  const limits = await getUsageLimits(workspaceId);
  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId)
    .is("deleted_at", null);

  if (error) throw new AppError("INTERNAL_ERROR", "Could not check session usage.");
  if ((count ?? 0) >= limits.max_sessions_per_test) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      "This test has reached its session limit and is no longer accepting new participants."
    );
  }
}

export async function assertCanUploadRecording(input: {
  workspaceId: string;
  sizeBytes: number;
  durationSeconds: number;
}) {
  const limits = await getUsageLimits(input.workspaceId);

  if (input.durationSeconds > limits.max_recording_duration_seconds) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      "This recording is longer than the allowed session duration."
    );
  }

  if (Number(limits.storage_bytes_used ?? 0) + input.sizeBytes > Number(limits.max_storage_bytes_per_workspace)) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      "This workspace has reached its storage limit."
    );
  }
}

export async function assertCanRequestAiReport(workspaceId: string) {
  const supabase = createSupabaseAdminClient();
  const limits = await getUsageLimits(workspaceId);
  const today = new Date().toISOString().slice(0, 10);
  const usedToday =
    limits.ai_reports_usage_date === today ? Number(limits.ai_reports_used_today ?? 0) : 0;

  if (usedToday >= Number(limits.max_ai_reports_per_day)) {
    throw new AppError(
      "LIMIT_EXCEEDED",
      "This workspace has reached today's AI report limit."
    );
  }

  await supabase
    .from("usage_limits")
    .update({
      ai_reports_used_today: usedToday + 1,
      ai_reports_usage_date: today,
      updated_at: new Date().toISOString()
    })
    .eq("workspace_id", workspaceId);
}
