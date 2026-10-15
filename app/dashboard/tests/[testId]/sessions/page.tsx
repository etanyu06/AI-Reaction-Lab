import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { requireApiUser } from "@/lib/auth/server";
import { mockSessions, mockTests } from "@/lib/mock-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getTestOrThrow } from "@/lib/tests/loaders";
import { formatDate } from "@/lib/utils";

export default async function SessionListPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const realData = await loadRealSessions(testId);
  const test = realData?.test ?? mockTests.find((item) => item.id === testId);

  if (!test) notFound();

  const sessions = realData?.sessions ?? mockSessions.filter((session) => session.test_id === test.id);

  return (
    <div className="space-y-8">
      <PageHeader title="Sessions" description={`Participant sessions for ${test.name}.`} />
      {sessions.length === 0 ? (
        <EmptyState title="No sessions yet" description="Share the participant link to collect landing page reactions." />
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Link key={session.id} href={`/dashboard/sessions/${session.id}`}>
              <Card className="hover:bg-secondary/50">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">Session {session.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(session.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{session.status}</Badge>
                    <Badge variant="outline">{session.report_status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

async function loadRealSessions(testId: string) {
  try {
    const { user } = await requireApiUser();
    const test = await getTestOrThrow(testId);
    await requireWorkspaceRole(user.id, test.workspace_id, ["owner", "admin", "researcher", "viewer"]);

    const supabase = createSupabaseAdminClient();
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("id, test_id, status, consent_status, duration_seconds, created_at")
      .eq("test_id", test.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const sessionIds = (sessions ?? []).map((session) => session.id);
    const { data: reports } = sessionIds.length > 0
      ? await supabase
          .from("ai_reports")
          .select("session_id, status")
          .in("session_id", sessionIds)
          .is("deleted_at", null)
      : { data: [] };

    const reportStatusBySession = new Map((reports ?? []).map((report) => [report.session_id, report.status]));

    return {
      test,
      sessions: (sessions ?? []).map((session) => ({
        ...session,
        report_status: reportStatusBySession.get(session.id) ?? "pending"
      }))
    };
  } catch {
    return null;
  }
}
