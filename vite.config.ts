import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
        odyssey: path.resolve(__dirname, "odyssey.html"),
        commandDeck: path.resolve(__dirname, "command-deck.html"),
      },
    },
  },
});
