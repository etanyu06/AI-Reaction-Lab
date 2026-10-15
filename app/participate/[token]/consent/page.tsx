import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentGate } from "@/components/participant/consent-gate";
import {
  aiDisclosureCopy,
  participantConsentSummary,
  prohibitedSensitiveInfoCopy,
  recordingScopeItems
} from "@/lib/privacy/consent-copy";

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent to participate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Recording will not begin until you consent, grant browser permissions, and press Start recording.
        </p>
        <div className="space-y-3 text-sm text-muted-foreground">
          {participantConsentSummary.slice(0, 3).map((copy) => (
            <p key={copy}>{copy}</p>
          ))}
        </div>
        <section aria-labelledby="recording-scope-title" className="rounded-md border p-4">
          <h2 id="recording-scope-title" className="text-sm font-medium">
            What may be recorded
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {recordingScopeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <div className="space-y-3 rounded-md border bg-secondary/40 p-4 text-sm text-muted-foreground">
          <p>{prohibitedSensitiveInfoCopy}</p>
          <p>{aiDisclosureCopy}</p>
        </div>
        <ConsentGate token={token} />
      </CardContent>
    </Card>
  );
}
