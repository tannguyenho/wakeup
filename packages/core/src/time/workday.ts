import { CalendarDate } from "./calendar-date";

const MINUTE_MS = 60_000;

/** Mặc định: mốc 04:00 (QC-01 mục 1). */
export const DEFAULT_DAY_START_MINUTES = 4 * 60;

const MAX_DAY_START_MINUTES = 6 * 60;

/** Cài đặt quyết định ngày làm việc của một người dùng (QC-01, G01 BR-14). */
export interface WorkdaySettings {
  /** Tên múi giờ IANA, ví dụ `Asia/Ho_Chi_Minh`. */
  readonly timezone: string;
  /** Mốc đầu ngày tính bằng phút từ nửa đêm, trong khoảng 00:00–06:00 (0–360). */
  readonly dayStartMinutes: number;
}

/** Ném `RangeError` nếu cài đặt không hợp lệ. */
export function validateWorkdaySettings(settings: WorkdaySettings): void {
  const { dayStartMinutes } = settings;
  if (
    !Number.isInteger(dayStartMinutes) ||
    dayStartMinutes < 0 ||
    dayStartMinutes > MAX_DAY_START_MINUTES
  ) {
    throw new RangeError("Mốc đầu ngày phải nằm trong 00:00–06:00");
  }
  // Intl ném RangeError với tên múi giờ không tồn tại.
  formatterFor(settings.timezone);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timezone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timezone, formatter);
  }
  return formatter;
}

/**
 * Giờ tường (wall clock) của `instant` tại `timezone`, biểu diễn bằng số mili
 * giây như thể giờ tường đó là UTC. Nhờ vậy cộng trừ trên giờ tường không bị
 * lệch khi đổi giờ mùa hè.
 */
function wallClockMs(instant: Date, timezone: string): number {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timezone).formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return (
    Date.UTC(
      parts.year ?? 0,
      (parts.month ?? 1) - 1,
      parts.day ?? 1,
      parts.hour ?? 0,
      parts.minute ?? 0,
      parts.second ?? 0,
    ) + instant.getUTCMilliseconds()
  );
}

/**
 * `workday(t)` của QC-01 mục 2: ngày lịch của (t − mốc đầu ngày) theo
 * timezone của người dùng.
 */
export function workdayOf(instant: Date, settings: WorkdaySettings): CalendarDate {
  const wall = new Date(
    wallClockMs(instant, settings.timezone) - settings.dayStartMinutes * MINUTE_MS,
  );
  return new CalendarDate(wall.getUTCFullYear(), wall.getUTCMonth() + 1, wall.getUTCDate());
}

/**
 * Thời điểm bắt đầu của ngày làm việc `date` theo `settings`.
 *
 * Nếu mốc đầu ngày rơi vào khoảng giờ bị bỏ qua khi đổi giờ mùa hè, kết quả
 * dời về sau đúng bằng khoảng bị bỏ qua.
 */
export function startOfWorkday(date: CalendarDate, settings: WorkdaySettings): Date {
  const targetWall = Date.UTC(date.year, date.month - 1, date.day, 0, settings.dayStartMinutes);
  const offsetAt = (ms: number) => wallClockMs(new Date(ms), settings.timezone) - ms;
  // Đoán bằng offset tại chính mốc đó, rồi chỉnh lại một lần bằng offset thật
  // tại điểm vừa đoán.
  const guess = targetWall - offsetAt(targetWall);
  return new Date(targetWall - offsetAt(guess));
}

interface Entry {
  /** `null` với cài đặt ban đầu. */
  readonly effectiveAt: Date | null;
  /** Ngày làm việc đầu tiên dùng cài đặt này. */
  readonly effectiveDate: CalendarDate | null;
  readonly settings: WorkdaySettings;
}

/**
 * Lịch sử cài đặt ngày làm việc của một người dùng.
 *
 * Đổi mốc đầu ngày hoặc timezone có hiệu lực từ ngày làm việc kế tiếp; ngày
 * hiện tại kết thúc theo cài đặt cũ (QC-01 mục 3).
 */
export class WorkdayCalendar {
  private entries: Entry[];

  constructor(initial: WorkdaySettings) {
    validateWorkdaySettings(initial);
    this.entries = [{ effectiveAt: null, effectiveDate: null, settings: initial }];
  }

  /** Cài đặt đang áp dụng tại `instant`. */
  settingsAt(instant: Date): WorkdaySettings {
    return this.entryAt(instant).settings;
  }

  /** "Hôm nay" (ngày làm việc) tại `instant`. */
  today(instant: Date): CalendarDate {
    const entry = this.entryAt(instant);
    const computed = workdayOf(instant, entry.settings);
    // Đổi timezone về phía tây có thể làm ngày tính ra lùi lại; ngày làm việc
    // không bao giờ lùi về trước ngày mà cài đặt mới bắt đầu có hiệu lực.
    const floor = entry.effectiveDate;
    return floor && computed.isBefore(floor) ? floor : computed;
  }

  /**
   * Hẹn đổi cài đặt lúc `now`. Trả về thời điểm cài đặt mới có hiệu lực, là
   * lúc ngày làm việc hiện tại kết thúc theo cài đặt cũ. Lần hẹn sau thay cho
   * lần hẹn trước chưa có hiệu lực.
   */
  scheduleChange(now: Date, settings: WorkdaySettings): Date {
    validateWorkdaySettings(settings);
    const current = this.entryAt(now);
    const nextDay = this.today(now).next();
    const effectiveAt = startOfWorkday(nextDay, current.settings);
    this.entries = this.entries.filter(
      (e) => e.effectiveAt === null || e.effectiveAt.getTime() < effectiveAt.getTime(),
    );
    this.entries.push({ effectiveAt, effectiveDate: nextDay, settings });
    return effectiveAt;
  }

  private entryAt(instant: Date): Entry {
    const entry = this.entries.findLast(
      (e) => e.effectiveAt === null || instant.getTime() >= e.effectiveAt.getTime(),
    );
    // Phần tử đầu luôn có effectiveAt = null nên luôn tìm thấy.
    return entry!;
  }
}
