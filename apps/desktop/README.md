# @wakeup/desktop

App desktop của Wakeup: Tauri 2 + React + TypeScript + Vite + Tailwind v4, UI component từ Subframe ([`docs/tech/01`](../../docs/tech/01-quyet-dinh-tech-stack-va-api.md) mục 3, [ADR-0010](../../docs/adr/0010-tauri-react-va-backend-typescript.md)). Bản 1.0 phát hành cho Windows; cùng mã nguồn build được cho macOS và chạy được trên web (1.1).

## Bố cục

```
apps/desktop/
├── src/
│   ├── app/          # khung app: router, đồng hồ, ngày làm việc
│   ├── features/     # mỗi nhóm tính năng một thư mục (board, task…)
│   └── ui/           # DO SUBFRAME QUẢN LÝ: theme.css, components/, layouts/
└── src-tauri/        # vỏ native (Rust): cửa sổ, sau này SQLite, khay, cập nhật, MCP
```

Giao diện và logic nghiệp vụ nằm ở phía React và `@wakeup/core`. Phía Rust chỉ làm việc cần quyền hệ điều hành.

## Cần cài

- Node 22 và pnpm (`corepack enable`).
- Rust (stable) để chạy và build vỏ Tauri: <https://tauri.app/start/prerequisites/>. Chỉ làm giao diện trên trình duyệt thì chưa cần Rust.

## Lệnh

Chạy `pnpm install` ở thư mục gốc repo trước.

| Việc | Lệnh (trong `apps/desktop`) |
|---|---|
| Chạy giao diện trên trình duyệt (không cần Rust) | `pnpm dev` |
| Chạy app Tauri | `pnpm tauri dev` |
| Test | `pnpm test` |
| Build bộ cài | `pnpm tauri build` |
| Sinh icon từ `app-icon.svg` (làm một lần, bắt buộc trước khi build) | `pnpm tauri icon app-icon.svg` |

`src-tauri/icons/` chưa có trong repo: chạy lệnh sinh icon rồi commit thư mục đó.

## Subframe

Subframe là nguồn sự thật của design system: theme và component thiết kế trong Subframe rồi đồng bộ **một chiều** vào `src/ui/`. Không sửa tay file trong `src/ui/`; lần đồng bộ sau sẽ ghi đè.

Kết nối lần đầu (cần tài khoản Subframe, làm một lần):

```
pnpm exec subframe init --dir ./src/ui --alias "@/ui/*" --css-type tailwind-v4 --css-path ./src/index.css
```

Lệnh này tạo `.subframe/sync.json` (commit file này) và thay `src/ui/theme.css` tạm bằng theme thật. Sau đó mỗi lần design đổi:

```
pnpm ui:sync
```

Quy ước dùng component:

- Import từ `@/ui/components/<Tên>`. Component của Subframe chỉ lo hiển thị.
- Logic nghiệp vụ (gọi lệnh, state) viết ở `src/features/`, bọc quanh component Subframe.
- Cần thêm hành vi vào chính component thì sửa file `index.tsx` của component đó và ghi `// @subframe/sync-disable` ở đầu file, theo [tài liệu Subframe](https://docs.subframe.com/develop/concepts/syncing-components).
- Trong CI hoặc agent, đặt biến `SUBFRAME_AUTH_TOKEN` thay cho đăng nhập tương tác.
