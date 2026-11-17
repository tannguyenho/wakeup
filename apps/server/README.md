# @wakeup/server

Backend Wakeup: TypeScript trên Node 22, [Hono](https://hono.dev), PostgreSQL, SQL tay, migration bằng dbmate ([`docs/tech/01`](../../docs/tech/01-quyet-dinh-tech-stack-va-api.md) mục 5–7, [ADR-0006](../../docs/adr/0006-backend-dart-va-dong-bo-theo-lenh.md), [ADR-0010](../../docs/adr/0010-tauri-react-va-backend-typescript.md)). Chạy trên Linux bằng Docker; dùng chung logic nghiệp vụ với app qua package `@wakeup/core`.

Chạy trên máy (từ thư mục gốc repo, sau `pnpm install`):

```
docker compose -f deploy/compose.dev.yaml up -d
dbmate --url "postgres://wakeup:wakeup@localhost:5432/wakeup?sslmode=disable" -d apps/server/db/migrations up
DATABASE_URL="postgres://wakeup:wakeup@localhost:5432/wakeup?sslmode=disable" pnpm --filter @wakeup/server dev
```

| Việc | Lệnh |
|---|---|
| Test | `pnpm --filter @wakeup/server test` |
| Build bundle `dist/main.js` | `pnpm --filter @wakeup/server build` |
| Build image | `docker build -f apps/server/Dockerfile -t wakeup-server .` (ở thư mục gốc) |

Endpoint hiện có:

| Endpoint | Trạng thái |
|---|---|
| `GET /healthz` | Báo trạng thái server và DB |
| `GET /v1/app/latest` | Phiên bản app mới nhất, cho tự cập nhật |
| `POST /v1/commands` | Mới kiểm tra hình dạng lô lệnh, trả `NOT_IMPLEMENTED` |
| `GET /v1/changes` | Trả `NOT_IMPLEMENTED` |

Mọi request `/v1` có header `X-App-Version` cũ hơn `MIN_CLIENT_VERSION` nhận `CLIENT_TOO_OLD`.
