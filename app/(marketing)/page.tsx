import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Landing page testing</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            See where people get stuck on your landing page.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Give participants a few tasks and hear what they think. Review recordings
            and AI summaries to decide what to change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/auth">
                Create a test <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/security">Privacy details</Link>
            </Button>
          </div>
        </div>
        <Card className="bg-secondary/50">
          <CardHeader>
            <CardTitle>Example findings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              ["00:52", "The participant couldn’t tell what would happen after clicking the main button."],
              ["01:38", "They wanted to know what would be recorded before continuing."]
            ].map(([timestamp, finding]) => (
              <div key={timestamp} className="flex gap-3 rounded-md border bg-background p-3">
                <span className="font-mono text-muted-foreground">{timestamp}</span>
                <span>{finding}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="border-t bg-secondary/30">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
          {[
            ["Set the tasks", "Add your page URL and 3 to 5 questions you want answered."],
            ["Invite participants", "Share a test link. Participants review consent before recording."],
            ["Review sessions", "Watch recordings and compare feedback with timestamped findings."]
          ].map(([title, description], index) => (
            <div key={title} className="px-2 py-4">
              <p className="text-sm text-muted-foreground">0{index + 1}</p>
              <h2 className="mt-2 font-medium">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
