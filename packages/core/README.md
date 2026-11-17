# @wakeup/core

Logic nghiệp vụ dùng chung của Wakeup, viết một lần bằng TypeScript cho app desktop, web và server ([ADR-0010](../../docs/adr/0010-tauri-react-va-backend-typescript.md)): ngày làm việc QC-01, lệnh đồng bộ, mã lỗi.

Package không build riêng: các app import thẳng mã nguồn `src/index.ts` qua pnpm workspace.

```
pnpm --filter @wakeup/core test
```

`test/workday.test.ts` chứa các ca chuẩn QC-01, dùng chung cho app, server và bộ đánh giá AI của G10.
