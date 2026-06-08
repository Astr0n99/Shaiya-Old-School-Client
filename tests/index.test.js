'use strict';

const lib = require('../src/index');

describe('index module', () => {
  it('should export the version module', () => {
    expect(lib.version).toBeDefined();
    expect(typeof lib.version.parse).toBe('function');
    expect(typeof lib.version.isValid).toBe('function');
    expect(typeof lib.version.compare).toBe('function');
  });

  it('should export the config module', () => {
    expect(lib.config).toBeDefined();
    expect(typeof lib.config.loadJson).toBe('function');
    expect(typeof lib.config.validate).toBe('function');
  });

  it('should export the updater module', () => {
    expect(lib.updater).toBeDefined();
    expect(typeof lib.updater.isValidReleaseUrl).toBe('function');
    expect(typeof lib.updater.checkForUpdate).toBe('function');
  });
});
