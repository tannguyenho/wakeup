/** Phiên bản app dạng `major.minor.patch` (bỏ qua phần `+build`). */
export class AppVersion {
  constructor(
    readonly major: number,
    readonly minor: number,
    readonly patch: number,
  ) {}

  /** Ném `RangeError` nếu không đúng dạng `x.y.z`. */
  static parse(value: string): AppVersion {
    const core = (value.split("+")[0] ?? "").trim();
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(core);
    if (!match) {
      throw new RangeError(`Phiên bản phải dạng x.y.z: ${value}`);
    }
    return new AppVersion(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  compareTo(other: AppVersion): number {
    return this.major - other.major || this.minor - other.minor || this.patch - other.patch;
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}

/** Cấu hình đọc từ biến môi trường (xem deploy/.env.example). */
export interface ServerConfig {
  readonly port: number;
  /** `postgres://user:pass@host:5432/db`. Bỏ trống thì chạy không có DB (dev). */
  readonly databaseUrl: string | undefined;
  /** App cũ hơn bản này nhận `CLIENT_TOO_OLD` (docs/tech/01 mục 6). */
  readonly minClientVersion: AppVersion;
  readonly latestClientVersion: AppVersion;
  /** Link bộ cài đã ký trên R2. */
  readonly latestClientUrl: string;
}

export function configFromEnvironment(
  env: Record<string, string | undefined> = process.env,
): ServerConfig {
  const port = Number(env.PORT ?? "8080");
  if (!Number.isInteger(port) || port <= 0) {
    throw new RangeError(`PORT không hợp lệ: ${env.PORT}`);
  }
  return {
    port,
    databaseUrl: env.DATABASE_URL || undefined,
    minClientVersion: AppVersion.parse(env.MIN_CLIENT_VERSION ?? "0.0.0"),
    latestClientVersion: AppVersion.parse(env.LATEST_CLIENT_VERSION ?? "0.1.0"),
    latestClientUrl: env.LATEST_CLIENT_URL ?? "",
  };
}
