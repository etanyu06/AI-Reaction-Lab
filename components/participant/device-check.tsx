"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, Mic, Monitor, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PermissionStatus = "idle" | "checking" | "granted" | "denied";

type DeviceStatus = {
  cameraMic: PermissionStatus;
  screen: PermissionStatus;
};

const defaultStatus: DeviceStatus = {
  cameraMic: "idle",
  screen: "idle"
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function DeviceCheck({ token }: { token: string }) {
  const router = useRouter();
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  const screenPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<DeviceStatus>(defaultStatus);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      stopStream(cameraStreamRef.current);
      stopStream(screenStreamRef.current);
    };
  }, []);

  async function checkCameraAndMic() {
    setError("");
    setStatus((current) => ({ ...current, cameraMic: "checking" }));

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera and microphone recording.");
      }

      stopStream(cameraStreamRef.current);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      cameraStreamRef.current = stream;
      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.srcObject = stream;
      }
      setStatus((current) => ({ ...current, cameraMic: "granted" }));
    } catch (caught) {
      setStatus((current) => ({ ...current, cameraMic: "denied" }));
      setError(caught instanceof Error ? caught.message : "Camera or microphone permission was denied.");
    }
  }

  async function checkScreen() {
    setError("");
    setStatus((current) => ({ ...current, screen: "checking" }));

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("This browser does not support screen sharing.");
      }

      stopStream(screenStreamRef.current);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      screenStreamRef.current = stream;
      if (screenPreviewRef.current) {
        screenPreviewRef.current.srcObject = stream;
      }
      setStatus((current) => ({ ...current, screen: "granted" }));
    } catch (caught) {
      setStatus((current) => ({ ...current, screen: "denied" }));
      setError(caught instanceof Error ? caught.message : "Screen sharing permission was denied.");
    }
  }

  function continueToRecording() {
    stopStream(cameraStreamRef.current);
    stopStream(screenStreamRef.current);
    router.push(`/participate/${token}/record`);
  }

  const ready = status.cameraMic === "granted" && status.screen === "granted";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Device check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Check your camera, microphone, and screen sharing. You’ll choose what to share again when recording starts.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-3 rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <StatusLabel icon={<Camera />} label="Camera and microphone" status={status.cameraMic} />
                <Button type="button" variant="outline" onClick={checkCameraAndMic} disabled={status.cameraMic === "checking"}>
                  {status.cameraMic === "checking" ? "Checking..." : "Check"}
                </Button>
              </div>
              <video
                ref={cameraPreviewRef}
                className="aspect-video w-full rounded-md bg-secondary object-cover"
                autoPlay
                muted
                playsInline
              />
            </div>

            <div className="space-y-3 rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <StatusLabel icon={<Monitor />} label="Screen sharing" status={status.screen} />
                <Button type="button" variant="outline" onClick={checkScreen} disabled={status.screen === "checking"}>
                  {status.screen === "checking" ? "Checking..." : "Check"}
                </Button>
              </div>
              <video
                ref={screenPreviewRef}
                className="aspect-video w-full rounded-md bg-secondary object-contain"
                autoPlay
                muted
                playsInline
              />
            </div>
          </div>

          <div className="rounded-md border bg-secondary/40 p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mic className="h-4 w-4" aria-hidden="true" />
              Speak briefly during camera/mic check. If your browser shows a mic indicator, permission worked.
            </p>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="button" onClick={continueToRecording} disabled={!ready}>
            Continue to recording
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusLabel({ icon, label, status }: { icon: React.ReactNode; label: string; status: PermissionStatus }) {
  const granted = status === "granted";
  const denied = status === "denied";

  return (
    <p className="flex items-center gap-2 text-sm font-medium">
      <span className="text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      {label}
      {granted ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="granted" /> : null}
      {denied ? <XCircle className="h-4 w-4 text-destructive" aria-label="denied" /> : null}
    </p>
  );
}
