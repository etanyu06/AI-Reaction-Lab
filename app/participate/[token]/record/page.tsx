import { RecordingShell } from "@/components/participant/recording-shell";

export default async function RecordingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return <RecordingShell token={token} />;
}
