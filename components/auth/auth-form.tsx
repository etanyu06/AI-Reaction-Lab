"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters")
});

type AuthInput = z.infer<typeof authSchema>;

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const form = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" }
  });

  async function onSubmit(values: AuthInput) {
    setPending(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword(values)
          : await supabase.auth.signUp({
              ...values,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
              }
            });

      if (result.error) {
        setMessage(result.error.message);
        setPending(false);
        return;
      }

      if (mode === "signup") {
        setMessage("Check your email to verify your account before publishing tests.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication is not configured correctly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </CardContent>
    </Card>
  );
}
