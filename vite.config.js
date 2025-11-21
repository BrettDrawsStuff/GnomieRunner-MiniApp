import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use relative base so the app works under GitHub Pages without extra config.
export default defineConfig({
  base: "./",
  plugins: [react()]
});
