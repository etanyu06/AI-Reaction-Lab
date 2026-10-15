import { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED"
  | "LIMIT_EXCEEDED"
  | "UPLOAD_FAILED"
  | "PROCESSING_FAILED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: ApiErrorCode;
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    code: ApiErrorCode,
    message: string,
    status = statusForCode(code),
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function statusForCode(code: ApiErrorCode) {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
    case "TOKEN_EXPIRED":
    case "TOKEN_REVOKED":
      return 404;
    case "VALIDATION_ERROR":
      return 400;
    case "RATE_LIMITED":
      return 429;
    case "CONFLICT":
      return 409;
    case "LIMIT_EXCEEDED":
      return 403;
    case "UPLOAD_FAILED":
    case "PROCESSING_FAILED":
      return 422;
    default:
      return 500;
  }
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(
      Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] =>
        Array.isArray(entry[1])
      )
    );

    return new AppError(
      "VALIDATION_ERROR",
      "Check the submitted fields.",
      400,
      fieldErrors
    );
  }

  return new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}
