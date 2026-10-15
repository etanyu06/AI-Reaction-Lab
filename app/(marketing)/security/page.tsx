import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Security and privacy</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        AI Reaction Lab is built for opt-in research. Recording starts only after participant consent
        and browser permission approval.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          ["Private by default", "Media is stored in private buckets and accessed through short-lived signed URLs."],
          ["Consent required", "Participants see what will be recorded before any capture begins."],
          ["No biometric scoring", "The app does not identify people or score emotions from camera footage."],
          ["Deletion controls", "Sessions and participant data are designed for deletion and anonymization workflows."]
        ].map(([title, text]) => (
          <Card key={title}>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
