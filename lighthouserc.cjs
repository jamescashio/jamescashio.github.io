module.exports = {
  ci: {
    collect: {
      startServerCommand: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4190 --strictPort",
      startServerReadyPattern: "Local:",
      url: ["http://127.0.0.1:4190/", "http://127.0.0.1:4190/?runtime=quality", "http://127.0.0.1:4190/cashio.html"],
      numberOfRuns: 3,
      settings: {
        // Keep the configured Linux sandbox: chrome-launcher defaults disable its helper.
        chromeIgnoreDefaultFlags: true,
        chromeFlags: [
          "--headless=new",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-sync",
          "--mute-audio",
        ].join(" "),
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85, aggregationMethod: "median-run" }],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
        "categories:best-practices": ["error", { minScore: 0.9, aggregationMethod: "median-run" }],
        "categories:seo": ["warn", { minScore: 0.9, aggregationMethod: "median-run" }],
      },
    },
    upload: { target: "filesystem", outputDir: "artifacts/quality/lighthouse" },
  },
};
