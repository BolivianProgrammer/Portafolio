import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxy = { "/api": process.env.API_URL || "http://localhost:3000" };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
});
