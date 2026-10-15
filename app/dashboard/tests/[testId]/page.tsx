import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockTasks, mockTests } from "@/lib/mock-data";

export default async function TestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const test = mockTests.find((item) => item.id === testId);
  if (!test) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={test.name}
        description={test.participant_intro}
        action={<Button asChild><Link href={`/dashboard/tests/${test.id}/sessions`}>View sessions</Link></Button>}
      />
      <Card>
        <CardHeader><CardTitle>Participant link</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-md border bg-secondary/40 p-4 md:flex-row md:items-center md:justify-between">
            <code className="break-all text-sm">{test.public_url}</code>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm"><Copy className="mr-2 h-4 w-4" /> Copy</Button>
              <Button asChild variant="outline" size="sm"><Link href={test.public_url}><ExternalLink className="mr-2 h-4 w-4" />Open</Link></Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {mockTasks.map((task) => (
            <div key={task.id} className="rounded-md border p-4">
              <Badge variant="outline">Task {task.position}</Badge>
              <p className="mt-2">{task.prompt}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
