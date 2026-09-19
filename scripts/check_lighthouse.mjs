import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const executablePath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate) => candidate && existsSync(candidate));
assert.ok(executablePath, "Install Chrome or set CHROME_PATH; this check never downloads a browser.");

const reservation = createServer();
await new Promise((resolve, reject) => {
  reservation.once("error", reject);
  reservation.listen(0, "127.0.0.1", resolve);
});
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));

// Playwright owns the temporary profile and graceful shutdown. Reusing its
// browser avoids chrome-launcher's Windows profile-deletion race after a run.
const browser = await chromium.launch({
  executablePath,
  headless: true,
  chromiumSandbox: true,
  args: [`--remote-debugging-port=${port}`, "--remote-debugging-address=127.0.0.1", "--mute-audio"],
});
try {
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(root, "node_modules/@lhci/cli/src/cli.js"),
        "autorun",
        "--config=lighthouserc.cjs",
        `--collect.settings.port=${port}`,
      ],
      { cwd: root, stdio: "inherit", windowsHide: true },
    );
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  await browser.close();
}
