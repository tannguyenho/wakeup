# CLAUDE.md

Wakeup: app lập kế hoạch ngày, bản 1.0 là Flutter Windows. Tài liệu và trao đổi bằng tiếng Việt. Thuật ngữ ở `GLOSSARY.md`, tổng quan ở `README.md`.

## Changelog

Mọi thay đổi đáng kể đều có một dòng trong `CHANGELOG.md`, ghi trên cùng nhánh và đẩy lên **trước khi merge** vào `main`:

1. Thêm dòng dưới `## [Chưa phát hành]`, ở mục ngày hôm nay (`### dd/mm/yyyy`; chưa có thì tạo, ngày mới nhất trên cùng), đúng nhóm **Thêm / Đổi / Sửa / Bỏ**.
2. Dòng ghi: phạm vi (G0x, `ds`, `server`, `tools`…), thay đổi bằng lời người đọc hiểu được (mã mới, quyết định PO), rồi link PR và issue liên quan. Tạo PR trước rồi điền số PR vào dòng.
3. Một PR có nhiều commit thì gộp thành một đến ba dòng theo ý chính, không chép từng commit.

Xong khi: diff của PR có `CHANGELOG.md`, và mỗi dòng mới trỏ tới PR đó.

## Agent skills

### Issue tracker

Issue nằm trên GitHub Issues của `tannguyenho/wakeup`, thao tác qua `gh`. Xem `docs/agents/issue-tracker.md`.

### Triage labels

Dùng năm label chuẩn: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Xem `docs/agents/triage-labels.md`.

### Domain docs

Single-context: một `GLOSSARY.md` và `docs/adr/` ở gốc repo. Xem `docs/agents/domain.md`.
