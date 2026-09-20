import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";

let server;
try {
  let url = process.env.HELIOS_URL;
  if (!url) {
    const probe = net.createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    url = `http://127.0.0.1:${port}/`;
    server = spawn(process.execPath, ["scripts/serve-helios-preview.mjs", "dist", String(port)], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Helios review server did not start")), 10000);
      server.once("error", reject);
      server.once("exit", (code) => reject(new Error(`Helios review server exited (${code})`)));
      server.stdout.once("data", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
  const test = spawn(process.execPath, ["--test", "tests/helios-runtime.test.mjs"], {
    env: { ...process.env, HELIOS_URL: url },
    stdio: "inherit",
  });
  const [code] = await once(test, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (server && server.exitCode === null) server.kill();
}
