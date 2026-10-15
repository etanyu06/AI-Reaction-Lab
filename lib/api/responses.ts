import { NextResponse } from "next/server";
import { normalizeError } from "@/lib/api/errors";

export function requestId() {
  return crypto.randomUUID();
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      data,
      requestId: requestId()
    },
    init
  );
}

export function fail(error: unknown) {
  const normalized = normalizeError(error);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        fieldErrors: normalized.fieldErrors,
        requestId: requestId()
      }
    },
    { status: normalized.status }
  );
}
