/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// Khi chạy trên thiết bị khác (di động sau này), Tauri đặt biến này.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Subframe sinh import dạng "@/ui/...".
    alias: { "@": resolve(import.meta.dirname, "./src") },
  },

  // Cấu hình theo khuyến nghị của Tauri: cổng cố định, không xoá màn hình để
  // thấy lỗi Rust, bỏ qua thư mục src-tauri khi theo dõi file.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },

  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
