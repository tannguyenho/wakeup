import { v7 as uuidv7 } from "uuid";

/**
 * Phiên bản schema của lệnh trong hàng đợi offline (docs/tech/01 mục 6).
 * Tăng khi đổi cấu trúc payload theo cách không tương thích ngược.
 */
export const COMMAND_SCHEMA_VERSION = 1;

/** Ai phát lệnh. Lệnh của AI hiện chip AI và Hoàn tác theo lượt (QC-12). */
export type Actor = "user" | "ai" | "system";

const actors: readonly string[] = ["user", "ai", "system"];

/**
 * Một lệnh nghiệp vụ trong hàng đợi đồng bộ (QC-08, ADR-0006).
 *
 * `commandId` (UUIDv7) là khoá idempotency: gửi lại cùng lệnh nhận lại đúng
 * kết quả cũ. Đối tượng này cũng chính là dạng JSON truyền qua API.
 */
export interface Command {
  readonly commandId: string;
  /** Tên lệnh, ví dụ `task.create`, `task.move`. */
  readonly type: string;
  readonly payload: Record<string, unknown>;
  /**
   * Phiên bản của đối tượng mà client đã thấy khi tạo lệnh. Bỏ trống với lệnh
   * tạo mới.
   */
  readonly baseVersion?: number;
  readonly actor: Actor;
  readonly aiTurnId?: string;
  readonly schemaVersion: number;
}

export interface NewCommand {
  commandId?: string;
  type: string;
  payload: Record<string, unknown>;
  baseVersion?: number;
  actor?: Actor;
  aiTurnId?: string;
  schemaVersion?: number;
}

/**
 * Tạo lệnh, tự sinh `commandId` nếu chưa có. Ném `TypeError` nếu lệnh của AI
 * thiếu `aiTurnId`.
 */
export function createCommand(input: NewCommand): Command {
  const actor = input.actor ?? "user";
  if (actor === "ai" && input.aiTurnId === undefined) {
    throw new TypeError("Lệnh của AI phải có aiTurnId");
  }
  return {
    commandId: input.commandId ?? uuidv7(),
    type: input.type,
    payload: input.payload,
    ...(input.baseVersion !== undefined ? { baseVersion: input.baseVersion } : {}),
    actor,
    ...(input.aiTurnId !== undefined ? { aiTurnId: input.aiTurnId } : {}),
    schemaVersion: input.schemaVersion ?? COMMAND_SCHEMA_VERSION,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Đọc lệnh từ JSON chưa tin cậy (body request, hàng đợi trên máy). Ném
 * `TypeError` nếu sai hình dạng.
 */
export function parseCommand(json: unknown): Command {
  if (!isRecord(json)) throw new TypeError("Lệnh phải là object");
  const { commandId, type, payload, baseVersion, actor, aiTurnId, schemaVersion } = json;
  if (typeof commandId !== "string" || typeof type !== "string") {
    throw new TypeError("Lệnh thiếu commandId hoặc type");
  }
  if (payload !== undefined && !isRecord(payload)) {
    throw new TypeError("payload phải là object");
  }
  if (baseVersion !== undefined && !Number.isInteger(baseVersion)) {
    throw new TypeError("baseVersion phải là số nguyên");
  }
  if (actor !== undefined && (typeof actor !== "string" || !actors.includes(actor))) {
    throw new TypeError("actor không hợp lệ");
  }
  if (aiTurnId !== undefined && typeof aiTurnId !== "string") {
    throw new TypeError("aiTurnId phải là chuỗi");
  }
  if (schemaVersion !== undefined && !Number.isInteger(schemaVersion)) {
    throw new TypeError("schemaVersion phải là số nguyên");
  }
  return createCommand({
    commandId,
    type,
    payload: payload ?? {},
    baseVersion: baseVersion as number | undefined,
    actor: actor as Actor | undefined,
    aiTurnId,
    schemaVersion: schemaVersion as number | undefined,
  });
}
