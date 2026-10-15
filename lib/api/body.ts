import { AppError } from "@/lib/api/errors";

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.");
  }
}

export function getClientIpHash(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}
