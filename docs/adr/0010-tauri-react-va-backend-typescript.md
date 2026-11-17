---
status: accepted, 17/11/2026
---

# Client Tauri + React + Tailwind + Subframe, backend TypeScript

Chủ dự án muốn làm web và macOS (1.1) dễ hơn, và muốn app Windows chạy local nhưng tích hợp được phần mềm online và server riêng trên Linux. Vì vậy bỏ Flutter và Dart, cả dự án dùng một ngôn ngữ là TypeScript:

- **Client:** Tauri 2 làm vỏ native; giao diện React + TypeScript + Vite + Tailwind CSS v4. Cùng mã nguồn build cho Windows (1.0), macOS và web (1.1).
- **Design system:** Subframe là nguồn sự thật của theme và component, đồng bộ một chiều vào `apps/desktop/src/ui/`.
- **Backend:** TypeScript trên Node 22 (Hono, `pg`, SQL tay), vẫn chạy trên VPS Linux bằng Docker.
- **Logic dùng chung:** package `@wakeup/core` (ngày làm việc QC-01, lệnh đồng bộ, mã lỗi) viết một lần, client và server cùng import.
- **Local-first:** giao diện đọc và ghi SQLite mã hoá trên máy, đồng bộ với server qua hàng đợi lệnh. OAuth và token của các tích hợp (lịch, sau này Gmail / Jira / Notion) nằm ở server; dữ liệu tích hợp xuống app qua cùng kênh đồng bộ.

Quyết định này thay:

- phần "viết bằng Flutter" của [ADR-0005](0005-nen-tang-windows-truoc.md) (thứ tự nền tảng Windows → web + macOS → di động và dữ liệu trên cloud giữ nguyên);
- phần "backend viết bằng Dart" của [ADR-0006](0006-backend-dart-va-dong-bo-theo-lenh.md) (mô hình đồng bộ theo hàng đợi lệnh giữ nguyên);
- toàn bộ [ADR-0008](0008-hop-dong-design-code-thay-code-connect.md) (lớp hợp đồng Figma ↔ Flutter).

ADR-0004, ADR-0007, ADR-0009 không đổi.

## Considered Options

- Giữ Flutter: một codebase cho cả di động, nhưng Flutter web không hợp với app nhiều chữ và bàn phím như Wakeup, và không dùng được Subframe hay hệ sinh thái React.
- Tauri + React nhưng giữ backend Dart: không phải viết lại server, nhưng logic QC-01, lệnh và mã lỗi tồn tại ở hai ngôn ngữ, mỗi quy tắc mới phải viết hai lần. Lý do chọn Dart ở ADR-0006 (dùng chung `wakeup_core` với app Flutter) không còn.
- Electron thay Tauri: toàn TypeScript, không cần Rust, nhưng bộ cài và RAM lớn hơn nhiều.

## Consequences

- Đổi vào lúc code còn ít (khoảng 900 dòng Dart), nên viết lại rẻ. `packages/ds_tokens`, `tools/figma-codegen`, `apps/widgetbook` bị gỡ; còn trong lịch sử git.
- Phần cần quyền hệ điều hành (SQLite + SQLCipher, khay, tự cập nhật, MCP server local của ADR-0004) viết bằng Rust trong `src-tauri/`. Máy dev cần cài Rust để chạy app Tauri; làm giao diện trên trình duyệt thì không cần.
- App phụ thuộc WebView của hệ điều hành (WebView2 trên Windows, WKWebView trên macOS): phải test giao diện trên cả hai.
- Di động (1.2): Tauri mobile chưa chín bằng Flutter. Đến lúc đó chọn giữa Tauri mobile và app riêng dùng lại `@wakeup/core`.
- Figma không còn là nguồn của token và component; chỉ dùng cho concept, user flow và handoff. Token và component đã vẽ trên Figma phải chuyển sang Subframe.
- Subframe là dịch vụ trả phí của bên thứ ba. Code đã đồng bộ nằm trong repo và chạy độc lập, nên nếu bỏ Subframe thì giữ nguyên code, chỉ mất công cụ thiết kế.
- Microsoft Graph và Google có SDK chính thức cho JavaScript, không phải gọi REST tay như ghi ở ADR-0006.
- `workday()` tính bằng `Intl` với dữ liệu tz của runtime, nên client và server có thể lệch phiên bản dữ liệu tz. Chấp nhận; xem [`docs/tech/01`](../tech/01-quyet-dinh-tech-stack-va-api.md) mục 5.
- Chi tiết ở [`docs/tech/01`](../tech/01-quyet-dinh-tech-stack-va-api.md) mục 2, 3, 5, 8.
