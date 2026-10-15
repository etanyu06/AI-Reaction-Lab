# AI Reaction Lab Participant Recording System

The participant recorder must behave like an explicit, consent-first research tool. It should never capture media or interaction events before consent, and it should stop all capture when the testing session ends.

## 1. Browser API Approach

Use standard modern desktop browser APIs:

- Screen: `navigator.mediaDevices.getDisplayMedia`.
- Camera and microphone: `navigator.mediaDevices.getUserMedia`.
- Recording: `MediaRecorder`.
- Video/audio stream composition: `HTMLCanvasElement.captureStream`, `AudioContext`, and `MediaStreamDestination`.
- Local temporary storage: IndexedDB.
- Network status: `navigator.onLine`, `online` / `offline` events.
- Page exit warnings: `beforeunload` only while recording or uploading.
- Visibility detection: `visibilitychange` for warnings and event markers.

Supported MVP browsers:

- Chrome desktop.
- Edge desktop.
- Firefox desktop where supported.

Safari desktop can be allowed only after testing. Mobile browsers should show an unsupported state for MVP.

Never call `getDisplayMedia`, `getUserMedia`, or start event capture until consent has been accepted and stored.

## 2. MediaRecorder Strategy

Recommended MVP format:

- Prefer `video/webm;codecs=vp9,opus`.
- Fallback to `video/webm;codecs=vp8,opus`.
- Fallback to `video/webm`.

Use feature detection:

```ts
const supportedMimeTypes = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

const mimeType = supportedMimeTypes.find((type) =>
  MediaRecorder.isTypeSupported(type),
);
```

Use chunked recording:

- `mediaRecorder.start(5000)` for 5-second chunks.
- Persist each chunk to IndexedDB immediately.
- Upload chunks as they become available when the network is healthy.
- Keep a manifest of chunks, statuses, retry counts, and timestamps.

Recorder states:

- `idle`
- `checking_support`
- `awaiting_permissions`
- `previewing`
- `recording`
- `paused`
- `stopping`
- `uploading`
- `complete`
- `failed_recoverable`
- `failed_final`

Pause behavior:

- Use `MediaRecorder.pause()` and `MediaRecorder.resume()` when supported.
- Insert `pause` and `resume` events with aligned timestamps.
- Keep camera/screen permission active during pause so resume is fast.
- Show an obvious "Paused" state.

Stop behavior:

- Stop `MediaRecorder`.
- Stop all tracks on screen, camera, and microphone streams.
- Stop canvas render loop.
- Flush all pending events.
- Upload any remaining chunks.
- Mark session complete only after server acknowledges recording completion and event/feedback upload.

## 3. Screen / Camera / Mic Composition Strategy

MVP recommendation: create one combined recording in the browser.

Composition:

- Screen video is the main canvas layer.
- Camera is drawn as a small picture-in-picture overlay in the lower right.
- Microphone and system/screen audio, if available, are mixed into one audio track.
- Canvas stream plus mixed audio stream becomes the recording stream.

Why one combined recording:

- Easier playback.
- Easier report timestamp alignment.
- Fewer upload objects.
- Less synchronization work during MVP.

Canvas approach:

1. Create hidden `<video>` for screen stream.
2. Create hidden `<video>` for camera stream.
3. Create `<canvas>` at a stable output resolution, for example 1280x720 or 1920x1080 depending on source.
4. Draw screen to canvas with contain-fit.
5. Draw camera overlay with fixed dimensions and margin.
6. Use `canvas.captureStream(30)`.
7. Mix audio with `AudioContext`.
8. Combine canvas video track and mixed audio track into `recordingStream`.

Audio mixing:

- Microphone audio is required if the test requires mic.
- Some browsers can include system audio from screen capture; use it only if present.
- Use `AudioContext.createMediaStreamSource`.
- Connect sources to `MediaStreamDestination`.
- Add destination audio track to final stream.

Do not attempt face analysis, emotion scoring, identity checks, or biometric processing.

## 4. Chunked Upload Strategy

Use chunked uploads for reliability.

Flow:

1. Participant consents.
2. Create participant session.
3. Device check succeeds.
4. Start recorder.
5. On each `dataavailable`, store chunk in IndexedDB.
6. Background uploader requests upload URL or upload session from the server.
7. Upload chunk.
8. Mark chunk uploaded.
9. On stop, finalize manifest.
10. Server assembles chunks or records the complete object set.
11. Mark recording uploaded.

Storage options:

- For Supabase Storage MVP, simplest route is uploading the final Blob after local chunk persistence.
- For stronger reliability, upload individual chunks to storage paths and have a server/worker compose or treat chunk list as the raw recording source.
- For R2, multipart upload is preferable for larger sessions.

Recommended MVP compromise:

- Record in chunks.
- Store chunks locally.
- During recording, attempt chunk upload.
- If chunk upload is not implemented server-side yet, assemble final Blob after stop and upload once.
- Keep local chunks until server finalization succeeds.

Server endpoints:

- `POST /api/public/sessions/:sessionId/upload-url`
- `PUT signedUploadUrl`
- `POST /api/public/sessions/:sessionId/recordings/:recordingId/complete`

For true chunk uploads, add:

- `POST /api/public/sessions/:sessionId/recordings/init`
- `POST /api/public/sessions/:sessionId/recordings/:recordingId/chunks/:chunkIndex/upload-url`
- `POST /api/public/sessions/:sessionId/recordings/:recordingId/complete-chunks`

## 5. Event Capture Strategy

Capture only during the active testing session:

- Click events.
- Scroll events.
- Task start.
- Task complete.
- URL opened.
- Landing page focus/return markers.
- Pause/resume.
- Recording start/stop.
- Permission granted/denied.
- Manual self-reported reactions.
- Errors.

Click capture:

- Since the landing page opens in another tab/window for MVP, the app cannot capture clicks inside that external page without an extension or embedded proxy.
- MVP can capture clicks inside the AI Reaction Lab participant UI.
- For landing-page interaction evidence, rely on screen recording and spoken thoughts.
- If the tested page is embedded in an iframe and same-origin limitations allow only container-level events, capture focus and iframe boundary interactions, not internal DOM.

Scroll capture:

- Capture scrolls inside the participant app.
- If landing page opens externally, internal landing page scrolls are visible in screen recording but not available as structured DOM events.

Manual reactions:

- Buttons such as `Confusing`, `Interesting`, `Trust concern`, `Good moment`.
- Each creates a timestamped `manual_reaction` event.

Event batching:

- Queue events in memory.
- Persist event batches to IndexedDB.
- Send batches every 5 seconds or at 50 events, whichever comes first.
- Retry failed batches.
- Include a `batchId` for idempotency.

Payload minimization:

- Do not capture keystrokes.
- Do not capture full page text.
- Do not capture form field values.
- Do not capture passwords or payment fields.
- Store only event type, timestamp, task ID, and minimal coordinates/scroll metadata.

## 6. Timestamp Synchronization

Use one monotonic session clock:

```ts
const recordingStartedAtPerf = performance.now();

function nowMs() {
  return Math.round(performance.now() - recordingStartedAtPerf);
}
```

All event timestamps use `nowMs()`.

Media chunks store:

- `chunkIndex`
- `startedAtMs`
- `endedAtMs`
- `createdAtWallClock`
- `sizeBytes`
- `uploaded`

Session records store:

- `started_at` wall-clock time.
- `stopped_at` wall-clock time.
- `duration_seconds`.

Why `performance.now()`:

- Monotonic.
- Not affected by system clock changes.
- Better alignment with video timeline than `Date.now()`.

Pause handling:

- If using real `MediaRecorder.pause()`, the output video timeline may exclude paused duration depending on browser behavior.
- Store both:
  - `sessionElapsedMs`: wall/performance elapsed since start.
  - `recordingElapsedMs`: accumulated active recording time.
- Use `recordingElapsedMs` for video timestamp links.
- Use `sessionElapsedMs` for operational timeline.

For MVP, prefer showing video-aligned timestamps:

```ts
recordingElapsedMs =
  performance.now() - recordingStartedAtPerf - totalPausedDurationMs;
```

## 7. Retry / Resume Behavior

Network failure:

- Continue recording locally.
- Show "Offline. Recording is still saved locally."
- Persist chunks and events to IndexedDB.
- Retry upload when `online` fires.

Upload failure:

- Keep chunks in IndexedDB.
- Retry with exponential backoff.
- Refresh signed URLs when expired.
- Do not clear local data until server finalization succeeds.

Tab close during recording:

- Show native `beforeunload` warning.
- Keep chunks already written to IndexedDB.
- On return to the same browser, show recovery screen if unfinished session data exists.

Screen share stops:

- Record `error` or `recording_stop` event.
- Stop the recorder.
- Move to upload/recovery flow.
- Tell participant the screen share ended and the captured portion can still be submitted.

Camera/mic disconnect:

- Record error event.
- Continue screen recording if possible.
- Show warning.
- Let participant continue or stop.

Resume after crash:

- On load, check IndexedDB for incomplete session manifests.
- If found, show "Recover recording" screen.
- Allow retry upload or discard local recording.
- Never silently upload without a visible participant action after a crash.

## 8. Local Temporary Storage Strategy

Use IndexedDB, not `localStorage`.

Store:

- Session manifest.
- Recording chunk blobs.
- Event batches.
- Upload state.
- Feedback draft.

Suggested object stores:

- `sessions`
- `chunks`
- `eventBatches`
- `feedbackDrafts`

Session manifest:

```ts
type LocalRecordingSession = {
  sessionId: string;
  token: string;
  recordingId?: string;
  status: "recording" | "paused" | "stopped" | "uploading" | "complete";
  mimeType: string;
  startedAtWallClock: string;
  stoppedAtWallClock?: string;
  startedAtPerfOrigin: number;
  totalPausedDurationMs: number;
  nextChunkIndex: number;
  finalizedOnServer: boolean;
};
```

Chunk record:

```ts
type LocalRecordingChunk = {
  sessionId: string;
  chunkIndex: number;
  blob: Blob;
  startedAtMs: number;
  endedAtMs: number;
  sizeBytes: number;
  uploaded: boolean;
  uploadAttempts: number;
};
```

Retention:

- Delete local chunks after server finalization.
- Keep failed local recordings for a limited period, for example 24 hours.
- Give participant a visible discard option.

## 9. User Warnings And Permission Copy

Consent screen:

- "Recording does not start until you consent and grant browser permissions."
- "This test may record your screen, camera, microphone, clicks, scrolls, and written responses."
- "You can stop at any time."
- "Do not enter passwords, payment information, or sensitive personal information during this test."
- "AI Reaction Lab does not use face recognition, biometric identity verification, or emotion scoring."

Device check:

- "Choose only the screen or window you want to share."
- "Close private tabs or windows before recording."
- "You will preview your camera and microphone before starting."
- "Recording starts only when you press Start recording."

Recording screen:

- Persistent visible label: "Recording active."
- Pause button: "Pause recording."
- Stop button: "Stop and submit."
- Offline warning: "Connection lost. Recording is still being saved on this device."
- Upload warning: "Do not close this tab until upload completes."

Recovery:

- "A recording from this session is saved on this device but has not finished uploading."
- "You can retry upload or discard the local recording."

## 10. Failure Modes And Recovery

Permission denied:

- Show which permission failed.
- Explain how to retry.
- If required permission is denied, block recording.
- If optional camera is denied, allow screen/mic recording only if test allows.

Browser incompatible:

- Detect missing `MediaRecorder`, `getDisplayMedia`, or unsupported MIME types.
- Show unsupported browser page with recommended browsers.

Screen share cancelled:

- Return to device check.
- Do not create recording chunks.

MediaRecorder error:

- Stop streams.
- Persist chunks already captured.
- Offer upload of partial recording if usable.

Network offline:

- Continue local recording.
- Queue uploads/events.
- Retry when online.

Storage quota exceeded:

- Stop recording safely.
- Explain local storage limit.
- Attempt upload of chunks already captured.
- If upload impossible, show recovery instructions.

Signed URL expired:

- Request a fresh signed URL.
- Retry upload.

Server rejects upload:

- Show recoverable error if limit or temporary failure.
- Keep local chunks.
- Do not mark session complete.

Participant closes tab:

- Browser warning while recording/uploading.
- On next visit, detect unfinished local session.

## TypeScript / React Pseudocode

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RecorderState =
  | "idle"
  | "checking_support"
  | "awaiting_permissions"
  | "previewing"
  | "recording"
  | "paused"
  | "stopping"
  | "uploading"
  | "complete"
  | "failed_recoverable"
  | "failed_final";

type ReactionType =
  | "confusing"
  | "interesting"
  | "trust_concern"
  | "good_moment";

type SessionEvent = {
  type:
    | "click"
    | "scroll"
    | "task_start"
    | "task_complete"
    | "manual_reaction"
    | "recording_start"
    | "recording_stop"
    | "pause"
    | "resume"
    | "error";
  timestampMs: number;
  taskId?: string;
  payload?: Record<string, unknown>;
};

type ParticipantRecorderProps = {
  token: string;
  sessionId: string;
  tasks: Array<{ id: string; position: number; prompt: string }>;
  maxDurationSeconds: number;
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireScreen: boolean;
};

export function ParticipantRecorder(props: ParticipantRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraMicStreamRef = useRef<MediaStream | null>(null);
  const composedStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const recordingStartedAtRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef<number>(0);
  const chunkIndexRef = useRef(0);
  const eventQueueRef = useRef<SessionEvent[]>([]);

  const currentTask = props.tasks[currentTaskIndex];

  const mimeType = useMemo(() => {
    if (typeof MediaRecorder === "undefined") return null;

    return [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ].find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
  }, []);

  function videoTimestampMs() {
    if (!recordingStartedAtRef.current) return 0;

    const now = performance.now();
    const currentPauseMs =
      pauseStartedAtRef.current === null ? 0 : now - pauseStartedAtRef.current;

    return Math.max(
      0,
      Math.round(
        now -
          recordingStartedAtRef.current -
          totalPausedMsRef.current -
          currentPauseMs,
      ),
    );
  }

  function queueEvent(event: Omit<SessionEvent, "timestampMs">) {
    if (state !== "recording" && state !== "paused") return;

    const timestampedEvent: SessionEvent = {
      ...event,
      timestampMs: videoTimestampMs(),
    };

    eventQueueRef.current.push(timestampedEvent);
    persistEventLocally(props.sessionId, timestampedEvent);

    if (eventQueueRef.current.length >= 50) {
      void flushEvents();
    }
  }

  async function checkSupport() {
    setState("checking_support");

    const supported =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getDisplayMedia &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined" &&
      !!mimeType;

    if (!supported) {
      setState("failed_final");
      setErrorMessage(
        "This browser does not support screen recording. Please use a modern desktop browser.",
      );
      return false;
    }

    setState("awaiting_permissions");
    return true;
  }

  async function requestPermissions() {
    const supported = await checkSupport();
    if (!supported) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const cameraMicStream = await navigator.mediaDevices.getUserMedia({
        video: props.requireCamera,
        audio: props.requireMicrophone,
      });

      screenStreamRef.current = screenStream;
      cameraMicStreamRef.current = cameraMicStream;

      attachPreviewStreams(screenStream, cameraMicStream);
      setState("previewing");
    } catch (error) {
      setState("failed_recoverable");
      setErrorMessage(permissionErrorMessage(error));
      queuePermissionDeniedEvent(error);
    }
  }

  function attachPreviewStreams(
    screenStream: MediaStream,
    cameraMicStream: MediaStream,
  ) {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      void screenVideoRef.current.play();
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraMicStream;
      cameraVideoRef.current.muted = true;
      void cameraVideoRef.current.play();
    }
  }

  async function composeRecordingStream() {
    const screenStream = screenStreamRef.current;
    const cameraMicStream = cameraMicStreamRef.current;
    const canvas = canvasRef.current;

    if (!screenStream || !cameraMicStream || !canvas) {
      throw new Error("Missing media streams");
    }

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context unavailable");

    canvas.width = 1280;
    canvas.height = 720;

    const drawFrame = () => {
      const screenVideo = screenVideoRef.current;
      const cameraVideo = cameraVideoRef.current;

      context.fillStyle = "#111827";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (screenVideo) {
        drawContain(context, screenVideo, 0, 0, canvas.width, canvas.height);
      }

      if (cameraVideo && props.requireCamera) {
        const pipWidth = 220;
        const pipHeight = 124;
        const margin = 24;
        const x = canvas.width - pipWidth - margin;
        const y = canvas.height - pipHeight - margin;

        context.fillStyle = "#000";
        context.fillRect(x - 2, y - 2, pipWidth + 4, pipHeight + 4);
        context.drawImage(cameraVideo, x, y, pipWidth, pipHeight);
      }

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    const canvasStream = canvas.captureStream(30);
    const mixedAudioStream = await createMixedAudioStream(
      screenStream,
      cameraMicStream,
    );

    const composed = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...mixedAudioStream.getAudioTracks(),
    ]);

    composedStreamRef.current = composed;
    return composed;
  }

  async function startRecording() {
    try {
      if (!mimeType) throw new Error("No supported recording format");

      await createOrUpdateLocalManifest(props.sessionId, {
        token: props.token,
        status: "recording",
        mimeType,
      });

      const stream = await composeRecordingStream();
      const recorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = performance.now();

      recorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0) return;

        const chunkIndex = chunkIndexRef.current++;
        const endedAtMs = videoTimestampMs();

        await saveChunkToIndexedDb({
          sessionId: props.sessionId,
          chunkIndex,
          blob: event.data,
          endedAtMs,
          sizeBytes: event.data.size,
        });

        void uploadPendingChunks();
      };

      recorder.onerror = (event) => {
        queueEvent({
          type: "error",
          payload: { source: "media_recorder", message: String(event) },
        });
        setState("failed_recoverable");
        setErrorMessage("Recording failed, but captured data may still be recoverable.");
      };

      recorder.onstop = () => {
        queueEvent({ type: "recording_stop" });
        void finalizeRecording();
      };

      recorder.start(5000);
      setState("recording");
      queueEvent({ type: "recording_start", taskId: currentTask?.id });
    } catch (error) {
      setState("failed_recoverable");
      setErrorMessage(recordingErrorMessage(error));
      stopAllTracks();
    }
  }

  function pauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    recorder.pause();
    pauseStartedAtRef.current = performance.now();
    setState("paused");
    queueEvent({ type: "pause" });
  }

  function resumeRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;

    if (pauseStartedAtRef.current !== null) {
      totalPausedMsRef.current += performance.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }

    recorder.resume();
    setState("recording");
    queueEvent({ type: "resume" });
  }

  function stopRecording() {
    setState("stopping");
    mediaRecorderRef.current?.requestData();
    mediaRecorderRef.current?.stop();
    stopAllTracks();
  }

  async function finalizeRecording() {
    try {
      setState("uploading");
      await flushEvents();
      await uploadPendingChunks({ waitUntilComplete: true, setUploadProgress });
      await completeRecordingUpload({
        token: props.token,
        sessionId: props.sessionId,
      });
      await clearLocalRecording(props.sessionId);
      setState("complete");
    } catch (error) {
      setState("failed_recoverable");
      setErrorMessage(
        "Upload did not finish. The recording is saved on this device and can be retried.",
      );
    }
  }

  async function flushEvents() {
    const events = eventQueueRef.current.splice(0);
    if (events.length === 0) return;

    try {
      await fetch(`/api/public/sessions/${props.sessionId}/events`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: props.token,
          batchId: crypto.randomUUID(),
          events,
        }),
      });
      await markEventsUploaded(props.sessionId, events);
    } catch {
      eventQueueRef.current.unshift(...events);
    }
  }

  function markReaction(type: ReactionType) {
    queueEvent({
      type: "manual_reaction",
      taskId: currentTask?.id,
      payload: { reactionType: type },
    });
  }

  function completeCurrentTask() {
    queueEvent({ type: "task_complete", taskId: currentTask?.id });
    setCurrentTaskIndex((index) => Math.min(index + 1, props.tasks.length - 1));
  }

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => {
      setOffline(false);
      void uploadPendingChunks();
      void flushEvents();
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state === "recording" || state === "paused" || state === "uploading") {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  useEffect(() => {
    return () => {
      stopAllTracks();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <main aria-labelledby="recording-title">
      <h1 id="recording-title">Landing page reaction test</h1>

      {offline ? (
        <div role="status">
          Connection lost. Recording is still being saved on this device.
        </div>
      ) : null}

      {errorMessage ? <div role="alert">{errorMessage}</div> : null}

      <canvas ref={canvasRef} hidden />
      <video ref={screenVideoRef} muted playsInline hidden />

      <section aria-label="Camera preview">
        <video ref={cameraVideoRef} muted playsInline />
      </section>

      <section aria-label="Current task">
        <p>
          Task {currentTaskIndex + 1} of {props.tasks.length}
        </p>
        <h2>{currentTask?.prompt}</h2>
      </section>

      <section aria-label="Recording controls">
        {state === "idle" || state === "failed_recoverable" ? (
          <button type="button" onClick={requestPermissions}>
            Check devices
          </button>
        ) : null}

        {state === "previewing" ? (
          <button type="button" onClick={startRecording}>
            Start recording
          </button>
        ) : null}

        {state === "recording" ? (
          <>
            <button type="button" onClick={pauseRecording}>
              Pause
            </button>
            <button type="button" onClick={stopRecording}>
              Stop and submit
            </button>
          </>
        ) : null}

        {state === "paused" ? (
          <>
            <button type="button" onClick={resumeRecording}>
              Resume
            </button>
            <button type="button" onClick={stopRecording}>
              Stop and submit
            </button>
          </>
        ) : null}
      </section>

      <section aria-label="Manual reactions">
        <button type="button" onClick={() => markReaction("confusing")}>
          Confusing
        </button>
        <button type="button" onClick={() => markReaction("interesting")}>
          Interesting
        </button>
        <button type="button" onClick={() => markReaction("trust_concern")}>
          Trust concern
        </button>
        <button type="button" onClick={() => markReaction("good_moment")}>
          Good moment
        </button>
      </section>

      <button type="button" onClick={completeCurrentTask}>
        Next task
      </button>

      {state === "uploading" ? (
        <div aria-live="polite">
          Uploading recording. {uploadProgress}% complete. Do not close this tab.
        </div>
      ) : null}
    </main>
  );
}

function drawContain(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const videoWidth = video.videoWidth || width;
  const videoHeight = video.videoHeight || height;
  const scale = Math.min(width / videoWidth, height / videoHeight);
  const drawWidth = videoWidth * scale;
  const drawHeight = videoHeight * scale;
  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) / 2;

  context.drawImage(video, dx, dy, drawWidth, drawHeight);
}

async function createMixedAudioStream(
  screenStream: MediaStream,
  cameraMicStream: MediaStream,
) {
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  for (const stream of [screenStream, cameraMicStream]) {
    if (stream.getAudioTracks().length === 0) continue;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(destination);
  }

  return destination.stream;
}

function stopAllTracks() {
  for (const stream of [
    screenStreamRef.current,
    cameraMicStreamRef.current,
    composedStreamRef.current,
  ]) {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

// Placeholder helpers implemented in lib/recording.
async function persistEventLocally(sessionId: string, event: SessionEvent) {}
async function saveChunkToIndexedDb(chunk: unknown) {}
async function createOrUpdateLocalManifest(sessionId: string, data: unknown) {}
async function uploadPendingChunks(options?: unknown) {}
async function completeRecordingUpload(input: unknown) {}
async function clearLocalRecording(sessionId: string) {}
async function markEventsUploaded(sessionId: string, events: SessionEvent[]) {}
function permissionErrorMessage(error: unknown) {
  return "Permission was not granted. Please allow screen, camera, and microphone access to continue.";
}
function recordingErrorMessage(error: unknown) {
  return "Recording could not start. Please check your browser permissions and try again.";
}
function queuePermissionDeniedEvent(error: unknown) {}
```

Implementation note: the `stopAllTracks` helper in real code should receive stream refs or live inside the component/hook closure. It is written as a placeholder above to keep the pseudocode compact.
