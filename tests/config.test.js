'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadJson, validate, resolveConfigPath, loadConfig, writeConfig, DEFAULT_CONFIG_FILENAME } = require('../src/config');

describe('config module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shaiya-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadJson()', () => {
    it('should load and parse a valid JSON file', () => {
      const filePath = path.join(tmpDir, 'test.json');
      fs.writeFileSync(filePath, JSON.stringify({ version: '1.0.0', url: 'https://example.com' }));

      const result = loadJson(filePath);
      expect(result).toEqual({ version: '1.0.0', url: 'https://example.com' });
    });

    it('should throw on non-existent file', () => {
      expect(() => loadJson('/nonexistent/path.json')).toThrow('Config file not found');
    });

    it('should throw on invalid JSON', () => {
      const filePath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(filePath, '{not valid json}');

      expect(() => loadJson(filePath)).toThrow('Failed to parse config file');
    });

    it('should throw on non-string file path', () => {
      expect(() => loadJson(null)).toThrow(TypeError);
      expect(() => loadJson(123)).toThrow(TypeError);
      expect(() => loadJson('')).toThrow(TypeError);
      expect(() => loadJson('   ')).toThrow(TypeError);
    });

    it('should handle a file with nested JSON', () => {
      const filePath = path.join(tmpDir, 'nested.json');
      const data = { version: '1.0.0', url: 'https://example.com', meta: { name: 'test' } };
      fs.writeFileSync(filePath, JSON.stringify(data));

      const result = loadJson(filePath);
      expect(result).toEqual(data);
    });
  });

  describe('validate()', () => {
    it('should validate a correct config', () => {
      const result = validate({
        version: '1.0.0',
        url: 'https://github.com/Astr0n99/Shaiya-Old-School-Client/releases/download/v1.0.0/file.exe',
      });
      expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should report missing version field', () => {
      const result = validate({ url: 'https://example.com' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: "version"');
    });

    it('should report missing url field', () => {
      const result = validate({ version: '1.0.0' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: "url"');
    });

    it('should report invalid semver version', () => {
      const result = validate({ version: 'not-semver', url: 'https://example.com' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid semver version/);
    });

    it('should report non-string version', () => {
      const result = validate({ version: 123, url: 'https://example.com' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"version" must be a string');
    });

    it('should report non-string url', () => {
      const result = validate({ version: '1.0.0', url: 123 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"url" must be a string');
    });

    it('should report invalid URL', () => {
      const result = validate({ version: '1.0.0', url: 'not-a-url' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid URL/);
    });

    it('should report multiple errors at once', () => {
      const result = validate({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('should reject non-object inputs', () => {
      expect(validate(null).valid).toBe(false);
      expect(validate(null).errors).toContain('Config must be a plain object');
      expect(validate('string').valid).toBe(false);
      expect(validate([]).valid).toBe(false);
      expect(validate(123).valid).toBe(false);
    });
  });

  describe('resolveConfigPath()', () => {
    it('should resolve to version.json in given directory', () => {
      const result = resolveConfigPath('/some/dir');
      expect(result).toBe(path.resolve('/some/dir', 'version.json'));
    });

    it('should use cwd when no baseDir is provided', () => {
      const result = resolveConfigPath();
      expect(result).toBe(path.resolve(process.cwd(), 'version.json'));
    });
  });

  describe('loadConfig()', () => {
    it('should load and validate the version.json from a directory', () => {
      const filePath = path.join(tmpDir, 'version.json');
      fs.writeFileSync(filePath, JSON.stringify({ version: '1.0.0', url: 'https://example.com/file.exe' }));

      const { config, validation } = loadConfig(tmpDir);
      expect(config.version).toBe('1.0.0');
      expect(validation.valid).toBe(true);
    });

    it('should return validation errors for bad config', () => {
      const filePath = path.join(tmpDir, 'version.json');
      fs.writeFileSync(filePath, JSON.stringify({ version: 'bad' }));

      const { config, validation } = loadConfig(tmpDir);
      expect(config.version).toBe('bad');
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should throw when version.json does not exist', () => {
      expect(() => loadConfig('/nonexistent/dir')).toThrow('Config file not found');
    });
  });

  describe('writeConfig()', () => {
    it('should write a valid config to disk', () => {
      const filePath = path.join(tmpDir, 'output.json');
      const config = { version: '2.0.0', url: 'https://example.com/download' };

      writeConfig(filePath, config);

      const written = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(written).toEqual(config);
    });

    it('should throw on invalid config', () => {
      const filePath = path.join(tmpDir, 'output.json');
      expect(() => writeConfig(filePath, { version: 'bad' })).toThrow('Invalid config');
    });

    it('should throw on non-string file path', () => {
      expect(() => writeConfig(null, { version: '1.0.0', url: 'https://example.com' })).toThrow(TypeError);
      expect(() => writeConfig('', { version: '1.0.0', url: 'https://example.com' })).toThrow(TypeError);
    });

    it('should produce formatted JSON with trailing newline', () => {
      const filePath = path.join(tmpDir, 'formatted.json');
      writeConfig(filePath, { version: '1.0.0', url: 'https://example.com/file' });

      const raw = fs.readFileSync(filePath, 'utf-8');
      expect(raw).toMatch(/\n$/);
      expect(raw).toContain('  ');
    });
  });

  describe('DEFAULT_CONFIG_FILENAME', () => {
    it('should be "version.json"', () => {
      expect(DEFAULT_CONFIG_FILENAME).toBe('version.json');
    });
  });
});
