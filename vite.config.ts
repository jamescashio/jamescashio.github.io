import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { heliosAssetDelivery } from "./scripts/helios-assets.mjs";

const assetDelivery = heliosAssetDelivery();
const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss(), assetDelivery.plugin],
  experimental: { renderBuiltUrl: assetDelivery.renderBuiltUrl },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replaceAll("\\", "/");
          if (normalized.includes("/node_modules/gsap/")) return "gsap";
          // The signature is shared by multiple page entries. Keep it out of Odyssey's startup bundle.
          if (/\/src\/odyssey\/(?:brand-mark|celestial-circuit)\.tsx$/.test(normalized)) return "celestial-identity";
        },
        onlyExplicitManualChunks: true,
        // Keep third-party code and its intact license in the existing vendor boundary.
        chunkFileNames(chunk) {
          return chunk.name === "gsap" ? "v38/vendor/[name]-[hash].js" : "assets/[name]-[hash].js";
        },
      },
      input: {
        helios: path.resolve(__dirname, "v39/index.html"),
        mostlyHarmless: path.resolve(__dirname, "index.html"),
        heliosAlias: path.resolve(__dirname, "v38/index.html"),
        mostlyHarmlessAlias: path.resolve(__dirname, "v40/index.html"),
        odyssey: path.resolve(__dirname, "odyssey.html"),
        commandDeck: path.resolve(__dirname, "command-deck.html"),
      },
    },
  },
});
