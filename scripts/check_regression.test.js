const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { loadKernel } = require('./check_regression.js');
const Module = require('node:module');

test('loadKernel - success on first require', () => {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === '@onkernel/sdk') {
      return { Kernel: 'mockKernel' };
    }
    return originalRequire.apply(this, arguments);
  };

  const result = loadKernel();
  assert.strictEqual(result, 'mockKernel');

  Module.prototype.require = originalRequire;
});

test('loadKernel - fallback to KERNEL_SDK_PATH root', () => {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === '@onkernel/sdk') {
      throw new Error('Not found');
    }
    if (id === '/mock/path') {
      return { Kernel: 'mockKernelPath' };
    }
    return originalRequire.apply(this, arguments);
  };

  process.env.KERNEL_SDK_PATH = '/mock/path';
  const result = loadKernel();
  assert.strictEqual(result, 'mockKernelPath');

  Module.prototype.require = originalRequire;
  delete process.env.KERNEL_SDK_PATH;
});

test('loadKernel - fallback to KERNEL_SDK_PATH/@onkernel/sdk', () => {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === '@onkernel/sdk') {
      throw new Error('Not found');
    }
    if (id === '/mock/path') {
      throw new Error('Not found');
    }
    if (id === path.join('/mock/path', '@onkernel/sdk')) {
      return { Kernel: 'mockKernelPathAppended' };
    }
    return originalRequire.apply(this, arguments);
  };

  process.env.KERNEL_SDK_PATH = '/mock/path';
  const result = loadKernel();
  assert.strictEqual(result, 'mockKernelPathAppended');

  Module.prototype.require = originalRequire;
  delete process.env.KERNEL_SDK_PATH;
});

test('loadKernel - throws if all attempts fail', () => {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === '@onkernel/sdk' || id === '/mock/path' || id === path.join('/mock/path', '@onkernel/sdk')) {
      const err = new Error("Cannot find module '" + id + "'");
      err.code = 'MODULE_NOT_FOUND';
      throw err;
    }
    return originalRequire.apply(this, arguments);
  };

  process.env.KERNEL_SDK_PATH = '/mock/path';

  let threw = false;
  try {
    loadKernel();
  } catch (err) {
    threw = true;
    assert.match(err.message, /Unable to load @onkernel\/sdk/);
  }

  assert.strictEqual(threw, true, 'Expected an error to be thrown');

  Module.prototype.require = originalRequire;
  delete process.env.KERNEL_SDK_PATH;
});

test('loadKernel - throws if all attempts fail (no env var)', () => {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === '@onkernel/sdk') {
      throw new Error('Not found');
    }
    return originalRequire.apply(this, arguments);
  };

  delete process.env.KERNEL_SDK_PATH;

  let error;
  try {
    loadKernel();
  } catch (err) {
    error = err;
  }

  assert.ok(error, 'Expected an error to be thrown');
  assert.match(error.message, /Unable to load @onkernel\/sdk/);

  Module.prototype.require = originalRequire;
});
