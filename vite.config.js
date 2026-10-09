import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/task-manager/",
  build: { sourcemap: false },
  plugins: [react()],
});

