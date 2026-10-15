import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { CreateTestForm } from "@/components/tests/create-test-form";
import { mockProjects } from "@/lib/mock-data";

export default async function CreateTestPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = mockProjects.find((item) => item.id === projectId);
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create landing page test"
      />
      <CreateTestForm projectId={project.id} workspaceId={project.workspace_id} />
    </div>
  );
}
