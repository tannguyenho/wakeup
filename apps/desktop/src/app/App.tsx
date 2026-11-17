import { createHashRouter, RouterProvider, type RouteObject } from "react-router";
import { TodayScreen } from "@/features/board/TodayScreen";

export const routes: RouteObject[] = [{ path: "/", element: <TodayScreen /> }];

// Hash router: app chạy từ file trong gói Tauri, không có server để xử lý
// đường dẫn sâu.
const router = createHashRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
