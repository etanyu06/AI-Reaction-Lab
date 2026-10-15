import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { mockProjects, mockWorkspace } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
      />
      <CreateProjectForm workspaceId={mockWorkspace.id} />
      {mockProjects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to start testing a landing page."
        />
      ) : (
        <div className="grid gap-4">
          {mockProjects.map((project) => (
            <Card key={project.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                    {project.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{project.tests_count} test</p>
                  <p>{project.sessions_count} sessions</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
