#!/usr/bin/env node
/**
 * ZEUSAPOLLO Visual Regression Tester
 * Uses Kernel SDK to screenshot cashio.us and compare with baseline
 *
 * Usage: node scripts/check_regression.js [--update-baseline]
 * Requires: KERNEL_API_KEY env var
 */

const { Kernel } = require('/root/.hermes/scripts/node_modules/@onkernel/sdk');
const fs = require('fs');
const path = require('path');

const KERNEL_KEY = process.env.KERNEL_API_KEY;
const URLS = [
  { path: '/', name: 'index' },
  { path: '/command.html', name: 'command-center' },
];
const BASELINE_DIR = path.join(__dirname, '..', '.regression-baseline');
const DIFF_DIR = path.join(__dirname, '..', '.regression-diffs');

async function main() {
  const updateBaseline = process.argv.includes('--update-baseline');
  const kernel = new Kernel({ apiKey: KERNEL_KEY });
  const passed = [];
  const failed = [];

  // Ensure directories
  [BASELINE_DIR, DIFF_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

  console.log('🚀 ZEUSAPOLLO Visual Regression Checker\n');

  for (const { path: urlPath, name } of URLS) {
    const url = `https://cashio.us${urlPath}`;
    console.log(`  📸 Snapshotting ${url}...`);

    try {
      // Create browser
      const browser = await kernel.browsers.create({ headless: true });
      const id = browser.session_id;

      // Navigate with wait
      await kernel.browsers.playwright.execute(id, {
        code: `
          await page.goto('${url}', { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(2000);
          await page.evaluate(() => document.fonts.ready);
        `
      });

      // Capture
      const resp = await kernel.browsers.computer.captureScreenshot(id);
      const buf = Buffer.from(await resp.arrayBuffer());

      // Cleanup
      await kernel.browsers.deleteByID(id);

      const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
      const snapshotPath = path.join(DIFF_DIR, `${name}.${Date.now()}.png`);

      if (!fs.existsSync(baselinePath) || updateBaseline) {
        // Save as new baseline
        fs.writeFileSync(baselinePath, buf);
        console.log(`  ✅ ${name}: Baseline saved (${(buf.length / 1024).toFixed(1)}KB)`);
        passed.push(name);
      } else {
        // Compare with baseline (simple size check — for real pixel diff, use pixelmatch)
        const baseline = fs.readFileSync(baselinePath);
        fs.writeFileSync(snapshotPath, buf);

        const sizeDiff = Math.abs(buf.length - baseline.length);
        const threshold = baseline.length * 0.05; // 5% tolerance

        if (sizeDiff < threshold) {
          console.log(`  ✅ ${name}: PASS (size diff: ${(sizeDiff / 1024).toFixed(1)}KB / ${(threshold / 1024).toFixed(1)}KB threshold)`);
          passed.push(name);
          fs.unlinkSync(snapshotPath); // clean up pass
        } else {
          console.log(`  ❌ ${name}: FAIL (size diff: ${(sizeDiff / 1024).toFixed(1)}KB > ${(threshold / 1024).toFixed(1)}KB threshold)`);
          console.log(`     Snapshot saved: ${snapshotPath}`);
          failed.push(name);
        }
      }
    } catch (err) {
      console.log(`  ❌ ${name}: ERROR — ${err.message}`);
      failed.push(name);
    }
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed.length} passed, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.join(', ')}`);
    process.exit(1);
  } else {
    console.log('✅ All visual checks passed!');
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
