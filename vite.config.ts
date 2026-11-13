import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { heliosAssetDelivery } from "./scripts/helios-assets.mjs";
import { v44Status } from "./scripts/v44-status.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const assetDelivery = heliosAssetDelivery();

// The front door's passage script goes last in its head, after the stylesheet the build adds there, so the
// browser has the styles that opt the page into the passage before it starts the body. See public/passage.js.
const passageLast: Plugin = {
  name: "passage-last",
  transformIndexHtml: {
    order: "post",
    handler(html, ctx) {
      if (path.resolve(ctx.filename) !== path.join(__dirname, "index.html")) return html;
      return [{ tag: "script", attrs: { src: "/passage.js" }, injectTo: "head" }];
    },
  },
};

export default defineConfig({
  plugins: [v44Status(__dirname), react(), tailwindcss(), assetDelivery.plugin, passageLast],
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
          // Shared by the Helios edition and the V43 islands. Importing an entry chunk would run that page, so keep them apart.
          const shared = /\/src\/helios\/(adopted-styles|zenith-films)\.[jt]sx?$/.exec(normalized);
          if (shared) return shared[1];
        },
        onlyExplicitManualChunks: true,
        // Keep third-party code and its intact license in the existing vendor boundary.
        chunkFileNames(chunk) {
          return chunk.name === "gsap" ? "v38/vendor/[name]-[hash].js" : "assets/[name]-[hash].js";
        },
      },
      input: {
        helios: path.resolve(__dirname, "v39/index.html"),
        drummer: path.resolve(__dirname, "index.html"),
        mostlyHarmless: path.resolve(__dirname, "v43/index.html"),
        heliosAlias: path.resolve(__dirname, "v38/index.html"),
        mostlyHarmlessAlias: path.resolve(__dirname, "v40/index.html"),
        v40Rooms: path.resolve(__dirname, "src/v40/room-main.ts"),
        odyssey: path.resolve(__dirname, "odyssey.html"),
        commandDeck: path.resolve(__dirname, "command-deck.html"),
      },
    },
  },
});
