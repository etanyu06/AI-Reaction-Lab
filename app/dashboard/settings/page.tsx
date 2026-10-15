import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { mockWorkspace } from "@/lib/mock-data";

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspace settings"
      />
      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input id="workspace-name" defaultValue={mockWorkspace.name} />
          </div>
          <Button type="button">Save settings</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Retention defaults</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Default retention is 90 days. Media remains private and can be deleted by authorized workspace members.
        </CardContent>
      </Card>
    </div>
  );
}
