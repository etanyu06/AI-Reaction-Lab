import { DeviceCheck } from "@/components/participant/device-check";

export default async function DeviceCheckPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <DeviceCheck token={token} />;
}
