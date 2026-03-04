import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // componentTagger는 HMR Fast Refresh boundary를 깨뜨려
    // HomePage를 4번 마운트시키는 원인 → 완전 제거
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
