import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Clock = () => Date;

const systemClock: Clock = () => new Date();

const ClockContext = createContext<Clock>(systemClock);

/** Đồng hồ của app. Test bọc `ClockProvider` để cố định thời điểm. */
export function ClockProvider({ clock, children }: { clock: Clock; children: ReactNode }) {
  return <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>;
}

/** Thời điểm hiện tại, cập nhật mỗi `intervalMs` để màn hình tự sang ngày mới. */
export function useNow(intervalMs = 30_000): Date {
  const clock = useContext(ClockContext);
  const [now, setNow] = useState(clock);
  useEffect(() => {
    setNow(clock());
    const timer = setInterval(() => setNow(clock()), intervalMs);
    return () => clearInterval(timer);
  }, [clock, intervalMs]);
  return now;
}
