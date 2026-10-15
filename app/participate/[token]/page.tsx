import Link from "next/link";
import { Clock, LockKeyhole, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockTasks, mockTests } from "@/lib/mock-data";

export default async function ParticipantLandingPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const test = mockTests[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{test.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground">{test.participant_intro}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Info icon={<Clock />} title="About 15 minutes" />
            <Info icon={<Monitor />} title="Screen, camera, mic" />
            <Info icon={<LockKeyhole />} title="Consent required first" />
          </div>
          <div>
            <h2 className="font-medium">Tasks</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {mockTasks.map((task) => (
                <li key={task.id}>{task.position}. {task.prompt}</li>
              ))}
            </ol>
          </div>
          <p className="rounded-md border bg-accent p-3 text-sm">
            Recording does not start on this page. You will review consent and grant browser permissions first.
          </p>
          <Button asChild>
            <Link href={`/participate/${token}/consent`}>Continue to consent</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
      <span className="text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      {title}
    </div>
  );
}
