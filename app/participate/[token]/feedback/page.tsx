import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <Card>
      <CardHeader><CardTitle>Post-session feedback</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">Written feedback is optional and saved with your session.</p>
        <div className="space-y-2">
          <Label htmlFor="feedback">Anything else you want to share?</Label>
          <Textarea id="feedback" placeholder="Add optional feedback..." />
        </div>
        <Button asChild><Link href={`/participate/${token}/complete`}>Submit feedback</Link></Button>
      </CardContent>
    </Card>
  );
}
