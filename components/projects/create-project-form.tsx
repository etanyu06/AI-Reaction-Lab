"use client";

import { useActionState } from "react";
import { createProjectAction, type ActionState } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = { ok: false, message: "" };

export function CreateProjectForm({ workspaceId }: { workspaceId?: string }) {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="workspaceId" value={workspaceId ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" placeholder="Landing page validation" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What are you trying to learn?"
            />
          </div>
          {state.message ? (
            <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"} role="status">
              {state.message}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
