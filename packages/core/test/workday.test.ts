// Ca chuẩn QC-01 (docs/01-quy-tac-dung-chung.md): dùng chung cho app, server và
// bộ đánh giá AI của G10. Mốc 04:00, timezone Asia/Ho_Chi_Minh.
import { describe, expect, test } from "vitest";
import {
  CalendarDate,
  WorkdayCalendar,
  validateWorkdaySettings,
  type WorkdaySettings,
} from "../src/index";

/** Giờ Việt Nam (UTC+7, không có giờ mùa hè) đổi sang UTC. */
const vn = (month: number, day: number, hour: number, minute = 0) =>
  new Date(Date.UTC(2026, month - 1, day, hour - 7, minute));

const vnDefault: WorkdaySettings = { timezone: "Asia/Ho_Chi_Minh", dayStartMinutes: 240 };

const iso = (date: CalendarDate) => date.toIso();

describe("QC-01 ca chuẩn", () => {
  test("03/11 23:30 → hôm nay 03/11, ngày mai 04/11", () => {
    const calendar = new WorkdayCalendar(vnDefault);
    const t = vn(11, 3, 23, 30);
    expect(iso(calendar.today(t))).toBe("2026-11-03");
    expect(iso(calendar.today(t).next())).toBe("2026-11-04");
  });

  test("04/11 02:10 → vẫn là ngày làm việc 03/11", () => {
    expect(iso(new WorkdayCalendar(vnDefault).today(vn(11, 4, 2, 10)))).toBe("2026-11-03");
  });

  test("04/11 04:00 → sang ngày làm việc 04/11", () => {
    expect(iso(new WorkdayCalendar(vnDefault).today(vn(11, 4, 4)))).toBe("2026-11-04");
  });

  test("04/11 03:59 → còn ngày làm việc 03/11", () => {
    expect(iso(new WorkdayCalendar(vnDefault).today(vn(11, 4, 3, 59)))).toBe("2026-11-03");
  });

  test("bay sang Paris lúc 04/11 20:00 giờ VN → hôm nay vẫn 04/11", () => {
    const calendar = new WorkdayCalendar(vnDefault);
    const t = vn(11, 4, 20);
    calendar.scheduleChange(t, { timezone: "Europe/Paris", dayStartMinutes: 240 });
    expect(iso(calendar.today(t))).toBe("2026-11-04");
    // Cài đặt Paris áp từ 05/11 04:00 giờ VN (= 04/11 22:00 giờ Paris).
    // Ngày làm việc không lùi về 04/11.
    expect(iso(calendar.today(vn(11, 5, 4)))).toBe("2026-11-05");
    expect(calendar.settingsAt(vn(11, 5, 4)).timezone).toBe("Europe/Paris");
  });
});

describe("QC-01 mục 3: đổi cài đặt có hiệu lực từ ngày làm việc kế tiếp", () => {
  test("04/11 02:00 đổi mốc sang 00:00 → hôm nay vẫn 03/11", () => {
    const calendar = new WorkdayCalendar(vnDefault);
    const now = vn(11, 4, 2);
    const effectiveAt = calendar.scheduleChange(now, {
      timezone: "Asia/Ho_Chi_Minh",
      dayStartMinutes: 0,
    });

    expect(iso(calendar.today(now))).toBe("2026-11-03");
    // Ngày hiện tại kết thúc theo cài đặt cũ (04:00), mốc mới áp từ đó.
    expect(effectiveAt.getTime()).toBe(vn(11, 4, 4).getTime());
    expect(iso(calendar.today(vn(11, 4, 4)))).toBe("2026-11-04");
    expect(iso(calendar.today(vn(11, 4, 23, 59)))).toBe("2026-11-04");
    // Từ 05/11, ngày làm việc bắt đầu lúc 00:00.
    expect(iso(calendar.today(vn(11, 5, 0, 30)))).toBe("2026-11-05");
  });
});

describe("WorkdaySettings", () => {
  test("mốc đầu ngày ngoài khoảng 00:00–06:00 bị từ chối (G01 BR-14)", () => {
    expect(() =>
      validateWorkdaySettings({ timezone: "Asia/Ho_Chi_Minh", dayStartMinutes: 7 * 60 }),
    ).toThrow(RangeError);
  });

  test("timezone không tồn tại bị từ chối", () => {
    expect(() =>
      validateWorkdaySettings({ timezone: "Mars/Olympus", dayStartMinutes: 240 }),
    ).toThrow(RangeError);
  });
});

describe("CalendarDate", () => {
  test("định dạng ISO và so sánh", () => {
    expect(new CalendarDate(2026, 11, 5).toIso()).toBe("2026-11-05");
    expect(CalendarDate.parse("2026-11-05").equals(new CalendarDate(2026, 11, 5))).toBe(true);
    expect(iso(new CalendarDate(2026, 12, 31).next())).toBe("2027-01-01");
    expect(new CalendarDate(2026, 11, 4).compareTo(new CalendarDate(2026, 11, 5))).toBeLessThan(0);
    // 05/11/2026 là Thứ Năm.
    expect(new CalendarDate(2026, 11, 5).weekday).toBe(4);
  });

  test("từ chối ngày sai dạng hoặc không tồn tại", () => {
    expect(() => CalendarDate.parse("5/11/2026")).toThrow(RangeError);
    expect(() => CalendarDate.parse("2026-02-30")).toThrow(RangeError);
  });
});
