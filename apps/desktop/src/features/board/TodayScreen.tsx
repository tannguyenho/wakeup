import { useToday } from "@/app/workday";

/** Khung tạm của board ngày (G04). Chỉ hiện ngày làm việc hiện tại. */
export function TodayScreen() {
  const today = useToday();
  return (
    <main className="flex h-full items-center justify-center">
      <h1 data-testid="today-label" className="text-heading-2 font-heading-2">
        Hôm nay {today.toIso()}
      </h1>
    </main>
  );
}
