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
      output: {
        manualChunks(id) {
          if (id.replaceAll("\\", "/").includes("/node_modules/gsap/")) return "gsap";
        },
        // Keep third-party code and its intact license in the existing vendor boundary.
        chunkFileNames(chunk) {
          return chunk.name === "gsap" ? "v38/vendor/[name]-[hash].js" : "assets/[name]-[hash].js";
        },
      },
      input: {
        helios: path.resolve(__dirname, "index.html"),
        heliosAlias: path.resolve(__dirname, "v38/index.html"),
        odyssey: path.resolve(__dirname, "odyssey.html"),
        commandDeck: path.resolve(__dirname, "command-deck.html"),
      },
    },
  },
});
