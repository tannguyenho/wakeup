import { expect, test } from "vitest";
import {
  ApiError,
  COMMAND_SCHEMA_VERSION,
  ErrorCode,
  createCommand,
  parseCommand,
} from "../src/index";

test("lệnh tự sinh commandId UUIDv7 và giữ nguyên qua JSON", () => {
  const command = createCommand({ type: "task.create", payload: { title: "Viết SRS" } });
  expect(command.commandId).toMatch(/^[0-9a-f-]{36}$/);
  expect(command.commandId[14], "UUID phiên bản 7").toBe("7");

  const back = parseCommand(JSON.parse(JSON.stringify(command)));
  expect(back).toEqual(command);
  expect(back.schemaVersion).toBe(COMMAND_SCHEMA_VERSION);
});

test("lệnh của AI bắt buộc có aiTurnId", () => {
  expect(() => createCommand({ type: "task.move", payload: {}, actor: "ai" })).toThrow(TypeError);
});

test("parseCommand từ chối lệnh sai hình dạng", () => {
  expect(() => parseCommand({ type: "task.create" })).toThrow(TypeError);
  expect(() => parseCommand({ commandId: "x", type: "t", actor: "robot" })).toThrow(TypeError);
});

test("ApiError đọc mã lạ thành unknown", () => {
  const error = ApiError.fromJSON({ error: { code: "SOMETHING_NEW", message: "x" } });
  expect(error.code).toBe(ErrorCode.unknown);
  expect(new ApiError(ErrorCode.versionConflict).toJSON()).toEqual({
    error: { code: "VERSION_CONFLICT", message: "" },
  });
});
