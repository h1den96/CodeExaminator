import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//import MonacoEditorPlugin from 'vite-plugin-monaco-editor';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000", // proxy backend API requests to Express server
    },
  },
});
