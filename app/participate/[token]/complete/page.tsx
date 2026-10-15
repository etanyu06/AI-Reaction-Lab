import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompletePage() {
  return (
    <Card>
      <CardHeader><CardTitle>Session submitted</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>Thanks for taking part. You can close this tab.</p>
        <p>Contact the researcher with questions about your session or data.</p>
      </CardContent>
    </Card>
  );
}
