import { ApiError, ErrorCode, parseCommand } from "@wakeup/core";
import { Hono, type Context } from "hono";
import { logger } from "hono/logger";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppVersion, type ServerConfig } from "./config";

/** Header client gửi kèm mọi request tới `/v1` (docs/tech/01 mục 6). */
export const APP_VERSION_HEADER = "x-app-version";

export interface AppOptions {
  /** Để `/healthz` báo trạng thái DB. Bỏ trống khi chạy không có DB. */
  isDatabaseUp?: () => Promise<boolean>;
  /** Ghi log mỗi request ra stdout. */
  logRequests?: boolean;
}

/** Trả lỗi theo dạng chuẩn `{error: {code, message, details}}`. */
function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  code: ErrorCode,
  message = "",
  details: Record<string, unknown> = {},
) {
  return c.json(new ApiError(code, message, details).toJSON(), status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Dựng app HTTP. Test gọi thẳng `app.request(...)`, không cần mở cổng. */
export function buildApp(config: ServerConfig, options: AppOptions = {}): Hono {
  const app = new Hono();
  if (options.logRequests) app.use(logger());

  // Bắt lỗi chưa xử lý, trả `INTERNAL` thay vì lộ stack trace.
  app.onError((error, c) => {
    // TODO(observability): gửi Sentry (docs/tech/01 mục 9).
    console.error("Lỗi chưa xử lý:", error);
    return errorResponse(c, 500, ErrorCode.internal);
  });

  app.notFound((c) => errorResponse(c, 404, ErrorCode.notFound));

  app.get("/healthz", async (c) => {
    const dbUp = options.isDatabaseUp ? await options.isDatabaseUp() : null;
    return c.json(
      { status: dbUp === false ? "degraded" : "ok", database: dbUp },
      dbUp === false ? 503 : 200,
    );
  });

  const v1 = new Hono();

  // Chặn app cũ hơn `minClientVersion` bằng `CLIENT_TOO_OLD`. Request không
  // kèm header (trình duyệt, webhook lịch) đi qua bình thường.
  v1.use(async (c, next) => {
    const raw = c.req.header(APP_VERSION_HEADER);
    if (raw === undefined) return next();
    let version: AppVersion;
    try {
      version = AppVersion.parse(raw);
    } catch {
      return errorResponse(c, 400, ErrorCode.validationFailed, "X-App-Version không hợp lệ");
    }
    if (version.compareTo(config.minClientVersion) < 0) {
      return errorResponse(c, 426, ErrorCode.clientTooOld, "Cần cập nhật app", {
        minClientVersion: config.minClientVersion.toString(),
      });
    }
    return next();
  });

  v1.get("/app/latest", (c) =>
    c.json({
      version: config.latestClientVersion.toString(),
      minVersion: config.minClientVersion.toString(),
      url: config.latestClientUrl,
    }),
  );

  // Đồng bộ theo hàng đợi lệnh (ADR-0006). Chưa hiện thực: chỉ kiểm tra hình
  // dạng lô lệnh.
  v1.post("/commands", async (c) => {
    let body: unknown;
    try {
      body = JSON.parse(await c.req.text());
    } catch {
      return errorResponse(c, 400, ErrorCode.validationFailed, "Body không phải JSON");
    }
    if (!isRecord(body) || !Array.isArray(body.commands)) {
      return errorResponse(c, 400, ErrorCode.validationFailed, 'Cần {"commands": [...]}');
    }
    try {
      body.commands.forEach(parseCommand);
    } catch {
      return errorResponse(c, 400, ErrorCode.validationFailed, "Lệnh không hợp lệ");
    }
    return errorResponse(c, 501, ErrorCode.notImplemented, "Chưa hiện thực xử lý lệnh");
  });

  v1.get("/changes", (c) =>
    errorResponse(c, 501, ErrorCode.notImplemented, "Chưa hiện thực nguồn thay đổi"),
  );

  app.route("/v1", v1);
  return app;
}
