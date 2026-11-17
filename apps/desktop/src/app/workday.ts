import { DEFAULT_DAY_START_MINUTES, WorkdayCalendar, type CalendarDate } from "@wakeup/core";
import { useNow } from "./clock";

/** Cài đặt ngày làm việc của người dùng. Tạm dùng mặc định cho tới khi có G01. */
const workdayCalendar = new WorkdayCalendar({
  timezone: "Asia/Ho_Chi_Minh",
  dayStartMinutes: DEFAULT_DAY_START_MINUTES,
});

/** "Hôm nay" theo ngày làm việc (QC-01), không theo ngày lịch. */
export function useToday(): CalendarDate {
  return workdayCalendar.today(useNow());
}
