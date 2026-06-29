#!/usr/bin/env node
/**
 * ZEUSAPOLLO Visual Regression Tester
 * Uses Kernel SDK to screenshot cashio.us and compare with baseline
 *
 * Usage: node scripts/check_regression.js [--update-baseline]
 * Requires: KERNEL_API_KEY env var and @onkernel/sdk on NODE_PATH or installed locally
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadKernel() {
  try {
    return require('@onkernel/sdk').Kernel;
  } catch (err) {
    if (process.env.KERNEL_SDK_PATH) {
      try {
        return require(process.env.KERNEL_SDK_PATH).Kernel;
      } catch (pathErr) {
        try {
          return require(path.join(process.env.KERNEL_SDK_PATH, '@onkernel/sdk')).Kernel;
        } catch (innerErr) {
          // Fallthrough
        }
      }
    }

    throw new Error('Unable to load @onkernel/sdk. Install it locally, set NODE_PATH, or set KERNEL_SDK_PATH to the SDK module.');
  }
}

const KERNEL_KEY = process.env.KERNEL_API_KEY;
const BASE_URL = (process.env.REGRESSION_BASE_URL || 'https://cashio.us').replace(/\/$/, '');
const VIEWPORT = { width: 1440, height: 1200 };
const URLS = [
  { path: '/', name: 'index' },
  { path: '/command.html', name: 'command-center' },
];
const BASELINE_DIR = path.join(__dirname, '..', '.regression-baseline');
const DIFF_DIR = path.join(__dirname, '..', '.regression-diffs');

function bufferFromScreenshot(resp) {
  if (Buffer.isBuffer(resp)) return resp;
  if (resp instanceof ArrayBuffer) return Buffer.from(resp);
  if (ArrayBuffer.isView(resp)) return Buffer.from(resp.buffer, resp.byteOffset, resp.byteLength);
  if (resp && typeof resp.arrayBuffer === 'function') {
    return resp.arrayBuffer().then(buf => Buffer.from(buf));
  }
  if (resp && typeof resp.data === 'string') {
    return Buffer.from(resp.data, 'base64');
  }
  throw new Error('Unsupported screenshot response from Kernel SDK');
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function main() {
  const updateBaseline = process.argv.includes('--update-baseline');
  if (!KERNEL_KEY) {
    throw new Error('KERNEL_API_KEY is required');
  }

  const Kernel = loadKernel();
  const kernel = new Kernel({ apiKey: KERNEL_KEY });
  const passed = [];
  const failed = [];

  // Ensure directories
  [BASELINE_DIR, DIFF_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

  console.log('🚀 ZEUSAPOLLO Visual Regression Checker\n');

  for (const { path: urlPath, name } of URLS) {
    const url = `${BASE_URL}${urlPath}`;
    console.log(`  📸 Snapshotting ${url}...`);
    let browserId;

    try {
      // Create browser
      const browser = await kernel.browsers.create({ headless: true });
      browserId = browser.session_id || browser.id;
      if (!browserId) throw new Error('Kernel browser session did not include an id');

      // Navigate with wait
      await kernel.browsers.playwright.execute(browserId, {
        code: `
          await page.setViewportSize(${JSON.stringify(VIEWPORT)});
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.goto(${JSON.stringify(url)}, { waitUntil: 'networkidle', timeout: 30000 });
          await page.evaluate(() => document.fonts && document.fonts.ready);
          await page.addStyleTag({ content: \`
            *, *::before, *::after {
              animation: none !important;
              caret-color: transparent !important;
              transition: none !important;
            }
            canvas, video, [data-regression-dynamic] {
              visibility: hidden !important;
            }
          \` });
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(1000);
        `
      });

      // Capture
      const resp = await kernel.browsers.computer.captureScreenshot(browserId);
      const buf = await bufferFromScreenshot(resp);

      const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
      const snapshotPath = path.join(DIFF_DIR, `${name}.${Date.now()}.png`);
      const hashPath = `${baselinePath}.sha256`;

      if (!fs.existsSync(baselinePath) || updateBaseline) {
        // Save as new baseline
        fs.writeFileSync(baselinePath, buf);
        fs.writeFileSync(hashPath, `${sha256(buf)}\n`);
        console.log(`  ✅ ${name}: Baseline saved (${(buf.length / 1024).toFixed(1)}KB)`);
        passed.push(name);
      } else {
        // Compare exact bytes. This avoids false passes from similarly sized but different screenshots.
        const baseline = fs.readFileSync(baselinePath);
        fs.writeFileSync(snapshotPath, buf);

        const baselineHash = sha256(baseline);
        const snapshotHash = sha256(buf);

        if (snapshotHash === baselineHash) {
          console.log(`  ✅ ${name}: PASS (${snapshotHash.slice(0, 12)})`);
          passed.push(name);
          fs.unlinkSync(snapshotPath); // clean up pass
        } else {
          console.log(`  ❌ ${name}: FAIL (baseline ${baselineHash.slice(0, 12)} != snapshot ${snapshotHash.slice(0, 12)})`);
          console.log(`     Snapshot saved: ${snapshotPath}`);
          failed.push(name);
        }
      }
    } catch (err) {
      console.log(`  ❌ ${name}: ERROR — ${err.message}`);
      failed.push(name);
    } finally {
      if (browserId) {
        try {
          await kernel.browsers.deleteByID(browserId);
        } catch (cleanupErr) {
          console.log(`     Cleanup warning: ${cleanupErr.message}`);
        }
      }
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

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
}

module.exports = { loadKernel };
