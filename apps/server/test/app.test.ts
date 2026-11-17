import { ApiError, ErrorCode, createCommand } from "@wakeup/core";
import { expect, test } from "vitest";
import { buildApp } from "../src/app";
import { AppVersion, configFromEnvironment } from "../src/config";

const config = configFromEnvironment({
  MIN_CLIENT_VERSION: "0.2.0",
  LATEST_CLIENT_VERSION: "0.3.0",
});
const app = buildApp(config);

const errorOf = async (response: Response) => ApiError.fromJSON(await response.json());

test("/healthz trả ok khi không cấu hình DB", async () => {
  const r = await app.request("/healthz");
  expect(r.status).toBe(200);
  expect(await r.json()).toMatchObject({ status: "ok" });
});

test("/healthz trả 503 khi DB không phản hồi", async () => {
  const r = await buildApp(config, { isDatabaseUp: async () => false }).request("/healthz");
  expect(r.status).toBe(503);
});

test("app cũ hơn minClientVersion nhận CLIENT_TOO_OLD", async () => {
  const r = await app.request("/v1/app/latest", { headers: { "x-app-version": "0.1.9+5" } });
  expect(r.status).toBe(426);
  expect((await errorOf(r)).code).toBe(ErrorCode.clientTooOld);
});

test("X-App-Version sai dạng nhận VALIDATION_FAILED", async () => {
  const r = await app.request("/v1/app/latest", { headers: { "x-app-version": "abc" } });
  expect(r.status).toBe(400);
  expect((await errorOf(r)).code).toBe(ErrorCode.validationFailed);
});

test("/v1/app/latest trả phiên bản mới nhất", async () => {
  const r = await app.request("/v1/app/latest", { headers: { "x-app-version": "0.2.0" } });
  expect(r.status).toBe(200);
  expect(await r.json()).toMatchObject({ version: "0.3.0" });
});

test("POST /v1/commands kiểm tra hình dạng lô lệnh", async () => {
  const bad = await app.request("/v1/commands", { method: "POST", body: '{"x": 1}' });
  expect(bad.status).toBe(400);
  expect((await errorOf(bad)).code).toBe(ErrorCode.validationFailed);

  const ok = await app.request("/v1/commands", {
    method: "POST",
    body: JSON.stringify({
      commands: [createCommand({ type: "task.create", payload: { title: "A" } })],
    }),
  });
  expect(ok.status).toBe(501);
  expect((await errorOf(ok)).code).toBe(ErrorCode.notImplemented);
});

test("đường dẫn lạ trả NOT_FOUND theo dạng lỗi chuẩn", async () => {
  const r = await app.request("/khong-co");
  expect(r.status).toBe(404);
  expect((await errorOf(r)).code).toBe(ErrorCode.notFound);
});

test("AppVersion bỏ qua phần +build khi so sánh", () => {
  expect(AppVersion.parse("1.2.3+45").compareTo(AppVersion.parse("1.2.3"))).toBe(0);
  expect(AppVersion.parse("1.10.0").compareTo(AppVersion.parse("1.9.9"))).toBeGreaterThan(0);
});
