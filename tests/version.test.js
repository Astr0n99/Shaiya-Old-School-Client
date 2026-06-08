'use strict';

const { parse, isValid, compare, isGreaterThan, isLessThan, isEqual, format, increment, SEMVER_REGEX } = require('../src/version');

describe('version module', () => {
  describe('parse()', () => {
    it('should parse a simple semver string', () => {
      const result = parse('1.0.0');
      expect(result).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: null,
        build: null,
      });
    });

    it('should parse a version with larger numbers', () => {
      const result = parse('12.34.56');
      expect(result).toEqual({
        major: 12,
        minor: 34,
        patch: 56,
        prerelease: null,
        build: null,
      });
    });

    it('should parse a version with prerelease', () => {
      const result = parse('1.0.0-alpha');
      expect(result).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: 'alpha',
        build: null,
      });
    });

    it('should parse a version with build metadata', () => {
      const result = parse('1.0.0+build.123');
      expect(result).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: null,
        build: 'build.123',
      });
    });

    it('should parse a version with both prerelease and build', () => {
      const result = parse('2.1.3-beta.1+build.456');
      expect(result).toEqual({
        major: 2,
        minor: 1,
        patch: 3,
        prerelease: 'beta.1',
        build: 'build.456',
      });
    });

    it('should strip leading "v" prefix', () => {
      const result = parse('v1.2.3');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: null,
        build: null,
      });
    });

    it('should trim whitespace', () => {
      const result = parse('  1.2.3  ');
      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: null,
        build: null,
      });
    });

    it('should throw on non-string input', () => {
      expect(() => parse(123)).toThrow(TypeError);
      expect(() => parse(null)).toThrow(TypeError);
      expect(() => parse(undefined)).toThrow(TypeError);
      expect(() => parse({})).toThrow(TypeError);
    });

    it('should throw on invalid version strings', () => {
      expect(() => parse('')).toThrow('Invalid version string');
      expect(() => parse('abc')).toThrow('Invalid version string');
      expect(() => parse('1.0')).toThrow('Invalid version string');
      expect(() => parse('1.0.0.0')).toThrow('Invalid version string');
      expect(() => parse('1.0.a')).toThrow('Invalid version string');
    });

    it('should handle version 0.0.0', () => {
      const result = parse('0.0.0');
      expect(result).toEqual({
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: null,
        build: null,
      });
    });
  });

  describe('isValid()', () => {
    it('should return true for valid versions', () => {
      expect(isValid('1.0.0')).toBe(true);
      expect(isValid('v1.0.0')).toBe(true);
      expect(isValid('0.0.1')).toBe(true);
      expect(isValid('1.2.3-alpha')).toBe(true);
      expect(isValid('1.2.3+build')).toBe(true);
    });

    it('should return false for invalid versions', () => {
      expect(isValid('')).toBe(false);
      expect(isValid('abc')).toBe(false);
      expect(isValid('1.0')).toBe(false);
      expect(isValid(null)).toBe(false);
      expect(isValid(undefined)).toBe(false);
      expect(isValid(123)).toBe(false);
    });
  });

  describe('compare()', () => {
    it('should return 0 for equal versions', () => {
      expect(compare('1.0.0', '1.0.0')).toBe(0);
      expect(compare('0.0.0', '0.0.0')).toBe(0);
      expect(compare('10.20.30', '10.20.30')).toBe(0);
    });

    it('should compare major versions', () => {
      expect(compare('2.0.0', '1.0.0')).toBe(1);
      expect(compare('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should compare minor versions', () => {
      expect(compare('1.2.0', '1.1.0')).toBe(1);
      expect(compare('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should compare patch versions', () => {
      expect(compare('1.0.2', '1.0.1')).toBe(1);
      expect(compare('1.0.1', '1.0.2')).toBe(-1);
    });

    it('should give prerelease lower precedence than release', () => {
      expect(compare('1.0.0-alpha', '1.0.0')).toBe(-1);
      expect(compare('1.0.0', '1.0.0-alpha')).toBe(1);
    });

    it('should compare prerelease strings lexicographically', () => {
      expect(compare('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
      expect(compare('1.0.0-beta', '1.0.0-alpha')).toBe(1);
      expect(compare('1.0.0-alpha', '1.0.0-alpha')).toBe(0);
    });

    it('should handle v-prefix in comparisons', () => {
      expect(compare('v1.0.0', '1.0.0')).toBe(0);
      expect(compare('v2.0.0', 'v1.0.0')).toBe(1);
    });
  });

  describe('isGreaterThan()', () => {
    it('should return true when a > b', () => {
      expect(isGreaterThan('2.0.0', '1.0.0')).toBe(true);
      expect(isGreaterThan('1.1.0', '1.0.0')).toBe(true);
      expect(isGreaterThan('1.0.1', '1.0.0')).toBe(true);
    });

    it('should return false when a <= b', () => {
      expect(isGreaterThan('1.0.0', '2.0.0')).toBe(false);
      expect(isGreaterThan('1.0.0', '1.0.0')).toBe(false);
    });
  });

  describe('isLessThan()', () => {
    it('should return true when a < b', () => {
      expect(isLessThan('1.0.0', '2.0.0')).toBe(true);
      expect(isLessThan('1.0.0', '1.1.0')).toBe(true);
    });

    it('should return false when a >= b', () => {
      expect(isLessThan('2.0.0', '1.0.0')).toBe(false);
      expect(isLessThan('1.0.0', '1.0.0')).toBe(false);
    });
  });

  describe('isEqual()', () => {
    it('should return true for equal versions', () => {
      expect(isEqual('1.0.0', '1.0.0')).toBe(true);
      expect(isEqual('v1.0.0', '1.0.0')).toBe(true);
    });

    it('should return false for different versions', () => {
      expect(isEqual('1.0.0', '1.0.1')).toBe(false);
      expect(isEqual('1.0.0', '2.0.0')).toBe(false);
    });
  });

  describe('format()', () => {
    it('should format a basic version object', () => {
      expect(format({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
    });

    it('should format with prerelease', () => {
      expect(format({ major: 1, minor: 0, patch: 0, prerelease: 'alpha' })).toBe('1.0.0-alpha');
    });

    it('should format with build metadata', () => {
      expect(format({ major: 1, minor: 0, patch: 0, build: 'build.1' })).toBe('1.0.0+build.1');
    });

    it('should format with both prerelease and build', () => {
      expect(format({ major: 1, minor: 0, patch: 0, prerelease: 'rc.1', build: '789' })).toBe('1.0.0-rc.1+789');
    });

    it('should throw on non-object input', () => {
      expect(() => format(null)).toThrow(TypeError);
      expect(() => format('1.0.0')).toThrow(TypeError);
      expect(() => format(123)).toThrow(TypeError);
    });

    it('should throw on missing numeric fields', () => {
      expect(() => format({ major: 'a', minor: 0, patch: 0 })).toThrow(TypeError);
      expect(() => format({ major: 1 })).toThrow(TypeError);
    });
  });

  describe('increment()', () => {
    it('should increment major version', () => {
      expect(increment('1.2.3', 'major')).toBe('2.0.0');
    });

    it('should increment minor version', () => {
      expect(increment('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('should increment patch version', () => {
      expect(increment('1.2.3', 'patch')).toBe('1.2.4');
    });

    it('should clear prerelease on increment', () => {
      expect(increment('1.0.0-alpha', 'patch')).toBe('1.0.1');
      expect(increment('1.0.0-beta+build', 'minor')).toBe('1.1.0');
    });

    it('should handle v-prefix input', () => {
      expect(increment('v1.0.0', 'patch')).toBe('1.0.1');
    });

    it('should throw on invalid release type', () => {
      expect(() => increment('1.0.0', 'invalid')).toThrow('Invalid release type');
      expect(() => increment('1.0.0', '')).toThrow('Invalid release type');
    });

    it('should throw on invalid version input', () => {
      expect(() => increment('invalid', 'patch')).toThrow('Invalid version string');
    });
  });

  describe('SEMVER_REGEX', () => {
    it('should be a RegExp', () => {
      expect(SEMVER_REGEX).toBeInstanceOf(RegExp);
    });

    it('should match valid semver strings', () => {
      expect(SEMVER_REGEX.test('1.0.0')).toBe(true);
      expect(SEMVER_REGEX.test('0.0.0')).toBe(true);
      expect(SEMVER_REGEX.test('1.2.3-alpha')).toBe(true);
      expect(SEMVER_REGEX.test('1.2.3+build')).toBe(true);
    });

    it('should not match invalid strings', () => {
      expect(SEMVER_REGEX.test('1.0')).toBe(false);
      expect(SEMVER_REGEX.test('abc')).toBe(false);
    });
  });
});
