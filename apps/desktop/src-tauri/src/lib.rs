//! Vỏ native của Wakeup. Giao diện và logic nghiệp vụ nằm ở phía React
//! (`apps/desktop/src`, `packages/core`). Phía Rust chỉ giữ những việc cần
//! quyền hệ điều hành (docs/tech/01 mục 3–4): SQLite mã hoá, khay hệ thống,
//! tự cập nhật, MCP server local cho trợ lý AI. Các phần đó thêm dần theo
//! từng nhóm tính năng.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("không khởi động được Wakeup");
}
