import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockReport, mockSessions } from "@/lib/mock-data";

export default async function SessionReportPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = mockSessions.find((item) => item.id === sessionId);
  if (!session) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI report"
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Executive summary</CardTitle>
            <Badge variant="secondary">Confidence: {mockReport.confidence}</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{mockReport.summary}</CardContent>
      </Card>
      <div className="grid gap-4">
        {mockReport.sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>{section.title}</CardTitle>
                <Badge variant={section.severity === "high" ? "default" : "secondary"}>
                  {section.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Timestamp:</span> {section.timestamp}</p>
              <p className="text-muted-foreground">{section.evidence}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
