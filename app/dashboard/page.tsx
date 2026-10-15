import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockProjects, mockSessions, mockTests } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        action={<Button asChild><Link href="/dashboard/projects">View projects</Link></Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Projects" value={mockProjects.length} />
        <StatCard label="Active tests" value={mockTests.filter((test) => test.status === "active").length} />
        <StatCard label="Recent sessions" value={mockSessions.length} />
      </div>
      <Card>
        <CardHeader><CardTitle>Recent sessions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {mockSessions.map((session) => (
            <Link
              key={session.id}
              href={`/dashboard/sessions/${session.id}/report`}
              className="block rounded-md border p-4 hover:bg-secondary/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Session {session.id.slice(0, 8)}</span>
                <span className="text-sm text-muted-foreground">{session.report_status}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  );
}
