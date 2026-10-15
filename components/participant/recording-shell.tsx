"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Mic, Monitor, Pause, Play, Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecordingState = "idle" | "requesting" | "recording" | "paused" | "uploading" | "complete" | "failed";

type ApiResponse<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: { code: string; message: string; requestId: string } };

type SessionEvent = {
  type:
    | "click"
    | "scroll"
    | "manual_reaction"
    | "recording_start"
    | "recording_stop"
    | "permission_granted"
    | "permission_denied"
    | "error";
  timestampMs: number;
  payload: Record<string, unknown>;
};

const DEFAULT_MAX_DURATION_SECONDS = 15 * 60;

function sessionStorageKey(token: string) {
  return `arl:participant-session:${token}`;
}

function maxDurationStorageKey(token: string) {
  return `arl:max-duration:${token}`;
}

function idempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function pickMimeType() {
  const candidates = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm"
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function normalizeMimeType(mimeType: string) {
  return mimeType.split(";")[0] || "video/webm";
}

function extensionForMimeType(mimeType: string) {
  return mimeType === "video/mp4" ? "mp4" : "webm";
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function sha256(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function RecordingShell({ token }: { token: string }) {
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const eventsRef = useRef<SessionEvent[]>([]);
  const startedAtRef = useRef<number>(0);
  const composedStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraMicStreamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadExtension, setDownloadExtension] = useState("webm");
  const [durationMs, setDurationMs] = useState(0);
  const [uploadProgress, setUploadProgress] = useState("");

  const maxDurationSeconds = useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_MAX_DURATION_SECONDS;
    const stored = Number(window.sessionStorage.getItem(maxDurationStorageKey(token)));
    return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_MAX_DURATION_SECONDS;
  }, [token]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (state === "recording" || state === "paused" || state === "uploading") {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [state]);

  useEffect(() => {
    if (state !== "recording" && state !== "paused") return;

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      setDurationMs(elapsed);

      if (elapsed >= maxDurationSeconds * 1000) {
        void stopRecording();
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [maxDurationSeconds, state]);

  useEffect(() => {
    if (state !== "recording" && state !== "paused") return;

    const handleClick = (event: MouseEvent) => {
      addEvent("click", {
        x: event.clientX,
        y: event.clientY,
        target: describeTarget(event.target)
      });
    };
    const handleScroll = () => {
      addEvent("scroll", {
        scrollX: window.scrollX,
        scrollY: window.scrollY
      });
    };

    window.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("scroll", handleScroll);
    };
  }, [state]);

  useEffect(() => {
    return () => {
      cleanupStreams();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function addEvent(type: SessionEvent["type"], payload: Record<string, unknown> = {}) {
    const timestampMs = startedAtRef.current > 0 ? Math.max(0, Math.round(performance.now() - startedAtRef.current)) : 0;
    eventsRef.current.push({ type, timestampMs, payload });
  }

  function cleanupStreams() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    stopStream(screenStreamRef.current);
    stopStream(cameraMicStreamRef.current);
    stopStream(composedStreamRef.current);
    screenStreamRef.current = null;
    cameraMicStreamRef.current = null;
    composedStreamRef.current = null;
  }

  async function startRecording() {
    setState("requesting");
    setError("");
    setStatusMessage("Choose the tab, window, or screen you want to share.");
    setDownloadUrl("");
    setDownloadExtension("webm");
    setUploadProgress("");
    chunksRef.current = [];
    eventsRef.current = [];

    try {
      if (!navigator.mediaDevices?.getDisplayMedia || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support screen, camera, and microphone recording.");
      }
      if (typeof MediaRecorder === "undefined") {
        throw new Error("This browser does not support MediaRecorder.");
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      const cameraMicStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      screenStreamRef.current = screenStream;
      cameraMicStreamRef.current = cameraMicStream;

      const composedStream = await createComposedStream(screenStream, cameraMicStream);
      composedStreamRef.current = composedStream;

      if (previewRef.current) {
        previewRef.current.srcObject = composedStream;
      }

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(composedStream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        void finalizeRecording();
      };

      screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        addEvent("recording_stop", { reason: "screen_share_stopped" });
        void stopRecording();
      });

      startedAtRef.current = performance.now();
      addEvent("permission_granted", { scope: "screen_camera_microphone" });
      addEvent("recording_start");
      recorder.start(5000);
      setState("recording");
      setStatusMessage("Recording is active. Keep speaking your thoughts out loud.");
    } catch (caught) {
      cleanupStreams();
      addEvent("permission_denied", {
        message: caught instanceof Error ? caught.message : "Permission request failed."
      });
      setState("failed");
      setError(caught instanceof Error ? caught.message : "Could not start recording.");
    }
  }

  async function createComposedStream(screenStream: MediaStream, cameraMicStream: MediaStream) {
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = 1280;
    canvas.height = 720;

    const screenVideo = document.createElement("video");
    const cameraVideo = document.createElement("video");
    screenVideo.muted = true;
    cameraVideo.muted = true;
    screenVideo.playsInline = true;
    cameraVideo.playsInline = true;
    screenVideo.srcObject = screenStream;
    cameraVideo.srcObject = cameraMicStream;
    screenVideoRef.current = screenVideo;
    cameraVideoRef.current = cameraVideo;

    await Promise.all([screenVideo.play(), cameraVideo.play()]);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create recording canvas.");

    const draw = () => {
      context.fillStyle = "#111827";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      const cameraWidth = Math.round(canvas.width * 0.22);
      const cameraHeight = Math.round(cameraWidth * 0.5625);
      const margin = 24;
      const x = canvas.width - cameraWidth - margin;
      const y = canvas.height - cameraHeight - margin;

      context.fillStyle = "rgba(0, 0, 0, 0.55)";
      context.fillRect(x - 6, y - 6, cameraWidth + 12, cameraHeight + 12);
      context.drawImage(cameraVideo, x, y, cameraWidth, cameraHeight);
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    const canvasStream = canvas.captureStream(30);
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    if (cameraMicStream.getAudioTracks().length > 0) {
      audioContext.createMediaStreamSource(cameraMicStream).connect(destination);
    }

    if (screenStream.getAudioTracks().length > 0) {
      audioContext.createMediaStreamSource(screenStream).connect(destination);
    }

    return new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ]);
  }

  function pauseRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    addEvent("manual_reaction", { action: "pause" });
    setState("paused");
  }

  function resumeRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    addEvent("manual_reaction", { action: "resume" });
    setState("recording");
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    addEvent("recording_stop");
    setState("uploading");
    setStatusMessage("Preparing recording. Keep this tab open.");
    recorder.stop();
  }

  async function finalizeRecording() {
    cleanupStreams();
    const mimeType = normalizeMimeType(recorderRef.current?.mimeType || "video/webm");
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const localUrl = URL.createObjectURL(blob);
    objectUrlRef.current = localUrl;
    setDownloadUrl(localUrl);
    setDownloadExtension(extensionForMimeType(mimeType));

    const durationSeconds = Math.max(1, Math.ceil(durationMs / 1000));
    setUploadProgress("Saving events and uploading recording...");

    try {
      await uploadRecording(blob, mimeType, durationSeconds);
      await uploadEvents();
      setState("complete");
      setStatusMessage("Recording uploaded successfully.");
    } catch (caught) {
      setState("failed");
      setError(
        caught instanceof Error
          ? `${caught.message} Your recording is available to download below.`
          : "Upload failed. Your recording is available to download below."
      );
    }
  }

  async function uploadRecording(blob: Blob, mimeType: string, durationSeconds: number) {
    const sessionId = window.sessionStorage.getItem(sessionStorageKey(token));
    if (!sessionId) {
      throw new Error("No consented participant session was found. Go back to the consent page and try again.");
    }

    const checksumSha256 = await sha256(blob);
    const uploadResponse = await fetch(`/api/public/sessions/${sessionId}/upload-url`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        recordingType: "combined",
        mimeType,
        sizeBytes: blob.size,
        durationSeconds,
        checksumSha256,
        idempotencyKey: idempotencyKey("upload")
      })
    });
    const uploadJson = (await uploadResponse.json()) as ApiResponse<{
      recordingId: string;
      uploadUrl: string;
      uploadMethod: "PUT";
      expiresInSeconds: number;
    }>;

    if (!uploadJson.ok) {
      throw new Error(uploadJson.error.message);
    }

    setUploadProgress("Uploading video...");
    const putResponse = await fetch(uploadJson.data.uploadUrl, {
      method: uploadJson.data.uploadMethod,
      headers: { "content-type": mimeType },
      body: blob
    });

    if (!putResponse.ok) {
      throw new Error("The signed upload failed.");
    }

    setUploadProgress("Verifying upload...");
    const completeResponse = await fetch(
      `/api/public/sessions/${sessionId}/recordings/${uploadJson.data.recordingId}/complete`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          sizeBytes: blob.size,
          durationSeconds,
          checksumSha256,
          idempotencyKey: idempotencyKey("complete")
        })
      }
    );
    const completeJson = (await completeResponse.json()) as ApiResponse<{
      recordingId: string;
      status: string;
    }>;

    if (!completeJson.ok) {
      throw new Error(completeJson.error.message);
    }
  }

  async function uploadEvents() {
    const sessionId = window.sessionStorage.getItem(sessionStorageKey(token));
    if (!sessionId || eventsRef.current.length === 0) return;

    const batches: SessionEvent[][] = [];
    for (let index = 0; index < eventsRef.current.length; index += 100) {
      batches.push(eventsRef.current.slice(index, index + 100));
    }

    for (const batch of batches) {
      const response = await fetch(`/api/public/sessions/${sessionId}/events`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          batchId: idempotencyKey("events"),
          events: batch.map((event) => ({
            type: event.type,
            timestampMs: event.timestampMs,
            payload: event.payload
          }))
        })
      });
      const json = (await response.json()) as ApiResponse<{ insertedCount: number }>;
      if (!json.ok) throw new Error(json.error.message);
    }
  }

  const elapsedSeconds = Math.floor(durationMs / 1000);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Recording session</CardTitle>
        </CardHeader>
        <CardContent>
          <video
            ref={previewRef}
            className="aspect-video w-full rounded-lg border bg-secondary object-contain"
            autoPlay
            muted
            playsInline
          />
          {state === "idle" ? (
            <div className="mt-4 rounded-md border bg-accent p-3 text-sm">
              Click Start recording, then choose the page, tab, or screen you want to share. Recording begins only
              after you approve screen, camera, and microphone permissions.
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3" aria-label="Recording controls">
            {state === "idle" || state === "failed" ? (
              <Button type="button" onClick={startRecording}>
                <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                Start recording
              </Button>
            ) : null}
            {state === "requesting" ? <Button disabled>Requesting permissions...</Button> : null}
            {state === "recording" ? (
              <>
                <Button type="button" variant="outline" onClick={pauseRecording}>
                  <Pause className="mr-2 h-4 w-4" aria-hidden="true" />
                  Pause
                </Button>
                <Button type="button" variant="destructive" onClick={stopRecording}>
                  <Square className="mr-2 h-4 w-4" aria-hidden="true" />
                  Stop and submit
                </Button>
              </>
            ) : null}
            {state === "paused" ? (
              <>
                <Button type="button" onClick={resumeRecording}>
                  Resume
                </Button>
                <Button type="button" variant="destructive" onClick={stopRecording}>
                  Stop and submit
                </Button>
              </>
            ) : null}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <p className="text-muted-foreground">
              Status: <span className="font-medium text-foreground">{statusMessage || state}</span>
            </p>
            {(state === "recording" || state === "paused" || state === "uploading") ? (
              <p className="text-muted-foreground">Elapsed: {elapsedSeconds}s / {maxDurationSeconds}s</p>
            ) : null}
            {uploadProgress ? <p role="status">{uploadProgress}</p> : null}
            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {downloadUrl ? (
              <Button asChild variant="outline">
                <a href={downloadUrl} download={`ai-reaction-lab-session-${Date.now()}.${downloadExtension}`}>
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Download local recording
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recording scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Screen</p>
            <p className="flex items-center gap-2"><Video className="h-4 w-4" /> Camera overlay</p>
            <p className="flex items-center gap-2"><Mic className="h-4 w-4" /> Microphone audio</p>
            <p>Clicks, scrolls, pauses, recording start, and recording stop are timestamped with the video.</p>
            <p>Recording is limited to this testing session and can be stopped anytime.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function describeTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return "unknown";

  return {
    tag: target.tagName.toLowerCase(),
    id: target.id || undefined,
    label: target.getAttribute("aria-label") || target.innerText?.slice(0, 80) || undefined
  };
}
