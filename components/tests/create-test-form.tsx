"use client";

import { useActionState } from "react";
import { createTestAction, type TestActionState } from "@/lib/actions/tests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: TestActionState = { ok: false, message: "" };

export function CreateTestForm({
  projectId,
  workspaceId
}: {
  projectId: string;
  workspaceId?: string;
}) {
  const [state, formAction, pending] = useActionState(createTestAction, initialState);

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="workspaceId" value={workspaceId ?? ""} />
      <Card>
        <CardHeader>
          <CardTitle>Landing page test</CardTitle>
          <CardDescription>
            Add 3 to 5 tasks for participants.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Test name</Label>
            <Input id="name" name="name" placeholder="Homepage first impression" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="landingPageUrl">Landing page URL</Label>
            <Input id="landingPageUrl" name="landingPageUrl" type="url" placeholder="https://example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="participantIntro">Participant intro</Label>
            <Textarea
              id="participantIntro"
              name="participantIntro"
              placeholder="Please review the page and speak your thoughts out loud."
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks and questions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="grid gap-2">
              <Label htmlFor={`task-${index}`}>Task {index + 1}{index > 2 ? " (optional)" : ""}</Label>
              <Input
                id={`task-${index}`}
                name={`tasks.${index}.prompt`}
                placeholder={
                  index === 0
                    ? "What do you think this product does?"
                    : "Describe anything confusing or trust-reducing."
                }
                required={index < 3}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recording settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            ["requireScreen", "Screen recording"],
            ["requireCamera", "Camera recording"],
            ["requireMicrophone", "Microphone recording"],
            ["captureClicks", "Click events"],
            ["captureScrolls", "Scroll events"]
          ].map(([name, label]) => (
            <label key={name} className="flex items-center gap-3 rounded-md border p-3 text-sm">
              <input name={name} type="checkbox" defaultChecked className="h-4 w-4" />
              {label}
            </label>
          ))}
          <div className="grid gap-2">
            <Label htmlFor="maxDurationSeconds">Max duration</Label>
            <select
              id="maxDurationSeconds"
              name="maxDurationSeconds"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              defaultValue="900"
            >
              <option value="300">5 minutes</option>
              <option value="900">15 minutes</option>
              <option value="1200">20 minutes</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"} role="status">
          {state.message}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save test draft"}
        </Button>
      </div>
    </form>
  );
}
