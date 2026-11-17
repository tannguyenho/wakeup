import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ClockProvider } from "@/app/clock";
import { TodayScreen } from "./TodayScreen";

test("trước 04:00 vẫn hiện ngày làm việc hôm trước (QC-01)", () => {
  // 04/11/2026 02:10 giờ Việt Nam.
  const now = new Date(Date.UTC(2026, 10, 3, 19, 10));
  render(
    <ClockProvider clock={() => now}>
      <TodayScreen />
    </ClockProvider>,
  );

  expect(screen.getByTestId("today-label")).toHaveTextContent("Hôm nay 2026-11-03");
});
