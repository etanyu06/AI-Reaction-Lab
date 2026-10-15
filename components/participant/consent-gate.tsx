"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { consentCheckboxCopy } from "@/lib/privacy/consent-copy";

type ApiResponse<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: { code: string; message: string; requestId: string } };

const CONSENT_TEXT =
  "I understand that this opt-in research session may record my screen, camera, microphone, clicks, scrolls, pauses, written feedback, and self-reported reactions only during this test session.";

function storageKey(token: string) {
  return `arl:participant-session:${token}`;
}

function idempotencyKey(token: string) {
  const key = `arl:idempotency:${token}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  window.sessionStorage.setItem(key, generated);
  return generated;
}

export function ConsentGate({ token }: { token: string }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function continueToDeviceCheck() {
    if (!accepted || pending) return;

    setPending(true);
    setError("");

    try {
      const existingSession = window.sessionStorage.getItem(storageKey(token));
      let sessionId = existingSession;
      const key = idempotencyKey(token);

      if (!sessionId) {
        const sessionResponse = await fetch(`/api/public/participant-links/${token}/sessions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey: key })
        });
        const sessionJson = (await sessionResponse.json()) as ApiResponse<{
          sessionId: string;
          maxDurationSeconds: number;
        }>;

        if (!sessionJson.ok) {
          throw new Error(sessionJson.error.message);
        }

        sessionId = sessionJson.data.sessionId;
        window.sessionStorage.setItem(storageKey(token), sessionId);
        window.sessionStorage.setItem(`arl:max-duration:${token}`, String(sessionJson.data.maxDurationSeconds));
      }

      const consentResponse = await fetch(`/api/public/sessions/${sessionId}/consent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          consentText: CONSENT_TEXT,
          screenConsented: true,
          cameraConsented: true,
          microphoneConsented: true,
          clicksConsented: true,
          scrollsConsented: true,
          writtenResponsesConsented: true,
          idempotencyKey: key
        })
      });
      const consentJson = (await consentResponse.json()) as ApiResponse<{ accepted: boolean }>;

      if (!consentJson.ok) {
        throw new Error(consentJson.error.message);
      }

      router.push(`/participate/${token}/device-check`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save consent. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-md border p-4 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          aria-describedby="consent-copy"
        />
        <span id="consent-copy">{consentCheckboxCopy}</span>
      </label>
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="button" disabled={!accepted || pending} onClick={continueToDeviceCheck}>
          {pending ? "Saving consent..." : "I consent and continue"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/")}>
          Decline
        </Button>
      </div>
    </div>
  );
}
