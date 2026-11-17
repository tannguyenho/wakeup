/**
 * Mã lỗi chung của API (docs/tech/01 mục 6). Client ánh xạ mã sang MSG của
 * SRS tương ứng; `message` chỉ để debug.
 */
export const ErrorCode = {
  // Đồng bộ (QC-08)
  versionConflict: "VERSION_CONFLICT",
  taskDeleted: "TASK_DELETED",
  alreadyRepeating: "ALREADY_REPEATING",

  // Nghiệp vụ
  pastDate: "PAST_DATE",
  validationFailed: "VALIDATION_FAILED",
  notFound: "NOT_FOUND",

  // AI (G10)
  aiOffline: "AI_OFFLINE",

  // Phiên, phiên bản, giới hạn
  unauthenticated: "UNAUTHENTICATED",
  sessionRevoked: "SESSION_REVOKED",
  clientTooOld: "CLIENT_TOO_OLD",
  rateLimited: "RATE_LIMITED",

  // Hệ thống
  notImplemented: "NOT_IMPLEMENTED",
  internal: "INTERNAL",

  /** Mã server trả về mà bản app này chưa biết. */
  unknown: "UNKNOWN",
} as const;

/** Chuỗi truyền qua API. */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const knownCodes = new Set<string>(Object.values(ErrorCode));

export function errorCodeFromWire(value: string): ErrorCode {
  return knownCodes.has(value) ? (value as ErrorCode) : ErrorCode.unknown;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: Record<string, unknown> };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Thân lỗi chuẩn: `{"error": {"code", "message", "details"}}`. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: ErrorCode, message = "", details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }

  static fromJSON(json: unknown): ApiError {
    const error = isRecord(json) ? json.error : undefined;
    if (!isRecord(error)) {
      throw new TypeError('Thiếu trường "error"');
    }
    return new ApiError(
      errorCodeFromWire(typeof error.code === "string" ? error.code : ""),
      typeof error.message === "string" ? error.message : "",
      isRecord(error.details) ? error.details : {},
    );
  }

  toJSON(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(Object.keys(this.details).length > 0 ? { details: this.details } : {}),
      },
    };
  }
}
