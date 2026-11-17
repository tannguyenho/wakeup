/**
 * Ngày lịch không kèm giờ: ngày dự định của task, ngày làm việc (QC-01).
 *
 * Lưu trong Postgres kiểu `date`, truyền qua API dạng `YYYY-MM-DD`.
 */
export class CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;

  /** Ngày tràn tháng được chuẩn hoá: `new CalendarDate(2026, 12, 32)` là 01/01/2027. */
  constructor(year: number, month: number, day: number) {
    const utc = new Date(Date.UTC(year, month - 1, day));
    this.year = utc.getUTCFullYear();
    this.month = utc.getUTCMonth() + 1;
    this.day = utc.getUTCDate();
  }

  /** Đọc chuỗi `YYYY-MM-DD`. Ném `RangeError` nếu sai dạng hoặc ngày không tồn tại. */
  static parse(iso: string): CalendarDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) {
      throw new RangeError(`Ngày không đúng dạng YYYY-MM-DD: ${iso}`);
    }
    const date = new CalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
    if (date.toIso() !== iso) {
      throw new RangeError(`Ngày không tồn tại: ${iso}`);
    }
    return date;
  }

  private get utcMs(): number {
    return Date.UTC(this.year, this.month - 1, this.day);
  }

  addDays(days: number): CalendarDate {
    return new CalendarDate(this.year, this.month, this.day + days);
  }

  next(): CalendarDate {
    return this.addDays(1);
  }

  previous(): CalendarDate {
    return this.addDays(-1);
  }

  /** 1 = Thứ Hai … 7 = Chủ Nhật. */
  get weekday(): number {
    return new Date(this.utcMs).getUTCDay() || 7;
  }

  toIso(): string {
    const pad = (n: number, width: number) => String(n).padStart(width, "0");
    return `${pad(this.year, 4)}-${pad(this.month, 2)}-${pad(this.day, 2)}`;
  }

  compareTo(other: CalendarDate): number {
    return this.utcMs - other.utcMs;
  }

  equals(other: CalendarDate): boolean {
    return this.compareTo(other) === 0;
  }

  isBefore(other: CalendarDate): boolean {
    return this.compareTo(other) < 0;
  }

  isAfter(other: CalendarDate): boolean {
    return this.compareTo(other) > 0;
  }

  toString(): string {
    return this.toIso();
  }

  toJSON(): string {
    return this.toIso();
  }
}
