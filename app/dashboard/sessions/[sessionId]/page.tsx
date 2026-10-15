import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspaceRole } from "@/lib/auth/authorization";
import { requireApiUser } from "@/lib/auth/server";
import { mockSessions } from "@/lib/mock-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionOrThrow } from "@/lib/tests/loaders";
import { formatDate } from "@/lib/utils";

export default async function SessionReplayPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const realData = await loadRealSessionReplay(sessionId);
  const session = realData?.session ?? mockSessions.find((item) => item.id === sessionId);

  if (!session) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Session replay"
        action={<Button asChild><Link href={`/dashboard/sessions/${session.id}/report`}>View AI report</Link></Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Recording</CardTitle></CardHeader>
          <CardContent>
            {realData?.playbackUrl ? (
              <video
                className="aspect-video w-full rounded-lg border bg-secondary"
                src={realData.playbackUrl}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border bg-secondary p-6 text-center text-sm text-muted-foreground">
                No uploaded recording is available for this session yet.
              </div>
            )}
            {realData?.recording ? (
              <div className="mt-3 text-sm text-muted-foreground">
                <p>Format: {realData.recording.mime_type}</p>
                <p>Status: {realData.recording.status}</p>
                <p>Uploaded: {formatDate(realData.recording.uploaded_at)}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Consent</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {session.consent_status}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>00:00 Recording started</p>
              <p>00:52 CTA hesitation</p>
              <p>01:38 Recording scope question</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function loadRealSessionReplay(sessionId: string) {
  try {
    const { user } = await requireApiUser();
    const session = await getSessionOrThrow(sessionId);
    await requireWorkspaceRole(user.id, session.workspace_id, ["owner", "admin", "researcher", "viewer"]);

    const supabase = createSupabaseAdminClient();
    const { data: recording, error } = await supabase
      .from("recordings")
      .select("id, storage_bucket, storage_path, mime_type, status, uploaded_at")
      .eq("session_id", session.id)
      .eq("type", "combined")
      .in("status", ["uploaded", "ready"])
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!recording) return { session, recording: null, playbackUrl: "" };

    const { data: signed, error: signedError } = await supabase.storage
      .from(recording.storage_bucket)
      .createSignedUrl(recording.storage_path, 5 * 60);

    if (signedError || !signed) {
      return { session, recording, playbackUrl: "" };
    }

    return {
      session,
      recording,
      playbackUrl: signed.signedUrl
    };
  } catch {
    return null;
  }
}
