import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { mockProjects, mockTests } from "@/lib/mock-data";

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = mockProjects.find((item) => item.id === projectId);
  if (!project) notFound();
  const tests = mockTests.filter((test) => test.project_id === project.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={project.description ?? "Landing page research project."}
        action={<Button asChild><Link href={`/dashboard/projects/${project.id}/tests/new`}>Create test</Link></Button>}
      />
      {tests.length === 0 ? (
        <EmptyState
          title="No tests yet"
          description="Create a landing page test with 3 to 5 tasks."
          action={{ label: "Create test", href: `/dashboard/projects/${project.id}/tests/new` }}
        />
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <Link href={`/dashboard/tests/${test.id}`} className="font-medium hover:underline">
                    {test.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{test.landing_page_url}</p>
                </div>
                <Badge variant="secondary">{test.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
