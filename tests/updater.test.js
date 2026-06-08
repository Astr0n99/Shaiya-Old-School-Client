'use strict';

const {
  isValidReleaseUrl,
  extractTagFromUrl,
  extractFilenameFromUrl,
  checkForUpdate,
  buildReleaseUrl,
  parseRepoFromUrl,
  GITHUB_RELEASE_PATTERN,
} = require('../src/updater');

const VALID_URL = 'https://github.com/Astr0n99/Shaiya-Old-School-Client/releases/download/v1.0.0/ShaiyaOldSchoolLauncher.exe';
const VALID_URL_WITH_QUERY = `${VALID_URL}?raw=true`;

describe('updater module', () => {
  describe('isValidReleaseUrl()', () => {
    it('should return true for a valid GitHub release URL', () => {
      expect(isValidReleaseUrl(VALID_URL)).toBe(true);
    });

    it('should return true for a URL with query parameters', () => {
      expect(isValidReleaseUrl(VALID_URL_WITH_QUERY)).toBe(true);
    });

    it('should return false for non-https URLs', () => {
      const httpUrl = VALID_URL.replace('https://', 'http://');
      expect(isValidReleaseUrl(httpUrl)).toBe(false);
    });

    it('should return false for non-GitHub URLs', () => {
      expect(isValidReleaseUrl('https://gitlab.com/owner/repo/releases/download/v1/file.exe')).toBe(false);
    });

    it('should return false for non-release GitHub URLs', () => {
      expect(isValidReleaseUrl('https://github.com/owner/repo')).toBe(false);
      expect(isValidReleaseUrl('https://github.com/owner/repo/blob/main/file.js')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidReleaseUrl(null)).toBe(false);
      expect(isValidReleaseUrl(123)).toBe(false);
      expect(isValidReleaseUrl(undefined)).toBe(false);
      expect(isValidReleaseUrl({})).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidReleaseUrl('')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidReleaseUrl('not a url')).toBe(false);
    });
  });

  describe('extractTagFromUrl()', () => {
    it('should extract the tag from a valid release URL', () => {
      expect(extractTagFromUrl(VALID_URL)).toBe('v1.0.0');
    });

    it('should extract the tag from a URL with query parameters', () => {
      expect(extractTagFromUrl(VALID_URL_WITH_QUERY)).toBe('v1.0.0');
    });

    it('should return null for invalid URLs', () => {
      expect(extractTagFromUrl('https://example.com')).toBeNull();
      expect(extractTagFromUrl(null)).toBeNull();
      expect(extractTagFromUrl('')).toBeNull();
    });

    it('should handle different tag formats', () => {
      const url = 'https://github.com/owner/repo/releases/download/release-2.0/file.zip';
      expect(extractTagFromUrl(url)).toBe('release-2.0');
    });
  });

  describe('extractFilenameFromUrl()', () => {
    it('should extract the filename from a valid release URL', () => {
      expect(extractFilenameFromUrl(VALID_URL)).toBe('ShaiyaOldSchoolLauncher.exe');
    });

    it('should extract the filename from a URL with query string', () => {
      expect(extractFilenameFromUrl(VALID_URL_WITH_QUERY)).toBe('ShaiyaOldSchoolLauncher.exe');
    });

    it('should return null for invalid URLs', () => {
      expect(extractFilenameFromUrl('https://example.com')).toBeNull();
      expect(extractFilenameFromUrl(null)).toBeNull();
    });

    it('should handle different file extensions', () => {
      const url = 'https://github.com/owner/repo/releases/download/v1/archive.tar.gz';
      expect(extractFilenameFromUrl(url)).toBe('archive.tar.gz');
    });
  });

  describe('checkForUpdate()', () => {
    it('should detect when an update is available', () => {
      const result = checkForUpdate({ version: '1.0.0' }, { version: '2.0.0' });
      expect(result).toEqual({
        updateAvailable: true,
        currentVersion: '1.0.0',
        remoteVersion: '2.0.0',
      });
    });

    it('should detect when no update is available (same version)', () => {
      const result = checkForUpdate({ version: '1.0.0' }, { version: '1.0.0' });
      expect(result).toEqual({
        updateAvailable: false,
        currentVersion: '1.0.0',
        remoteVersion: '1.0.0',
      });
    });

    it('should detect when current is ahead of remote', () => {
      const result = checkForUpdate({ version: '2.0.0' }, { version: '1.0.0' });
      expect(result).toEqual({
        updateAvailable: false,
        currentVersion: '2.0.0',
        remoteVersion: '1.0.0',
      });
    });

    it('should detect minor version updates', () => {
      const result = checkForUpdate({ version: '1.0.0' }, { version: '1.1.0' });
      expect(result.updateAvailable).toBe(true);
    });

    it('should detect patch version updates', () => {
      const result = checkForUpdate({ version: '1.0.0' }, { version: '1.0.1' });
      expect(result.updateAvailable).toBe(true);
    });

    it('should throw when current config has no version', () => {
      expect(() => checkForUpdate({}, { version: '1.0.0' })).toThrow('Current config must have a "version" field');
      expect(() => checkForUpdate(null, { version: '1.0.0' })).toThrow('Current config must have a "version" field');
    });

    it('should throw when remote config has no version', () => {
      expect(() => checkForUpdate({ version: '1.0.0' }, {})).toThrow('Remote config must have a "version" field');
      expect(() => checkForUpdate({ version: '1.0.0' }, null)).toThrow('Remote config must have a "version" field');
    });

    it('should throw when version strings are not valid semver', () => {
      expect(() => checkForUpdate({ version: 'bad' }, { version: '1.0.0' })).toThrow('Invalid version string');
      expect(() => checkForUpdate({ version: '1.0.0' }, { version: 'bad' })).toThrow('Invalid version string');
    });
  });

  describe('buildReleaseUrl()', () => {
    it('should build a correct GitHub release URL', () => {
      const url = buildReleaseUrl('Astr0n99', 'Shaiya-Old-School-Client', 'v1.0.0', 'ShaiyaOldSchoolLauncher.exe');
      expect(url).toBe('https://github.com/Astr0n99/Shaiya-Old-School-Client/releases/download/v1.0.0/ShaiyaOldSchoolLauncher.exe');
    });

    it('should throw when any parameter is missing', () => {
      expect(() => buildReleaseUrl('', 'repo', 'v1', 'file')).toThrow('All parameters');
      expect(() => buildReleaseUrl('owner', '', 'v1', 'file')).toThrow('All parameters');
      expect(() => buildReleaseUrl('owner', 'repo', '', 'file')).toThrow('All parameters');
      expect(() => buildReleaseUrl('owner', 'repo', 'v1', '')).toThrow('All parameters');
    });

    it('should throw when parameters are null/undefined', () => {
      expect(() => buildReleaseUrl(null, 'repo', 'v1', 'file')).toThrow('All parameters');
      expect(() => buildReleaseUrl('owner', undefined, 'v1', 'file')).toThrow('All parameters');
    });
  });

  describe('parseRepoFromUrl()', () => {
    it('should parse owner and repo from a valid URL', () => {
      const result = parseRepoFromUrl(VALID_URL);
      expect(result).toEqual({ owner: 'Astr0n99', repo: 'Shaiya-Old-School-Client' });
    });

    it('should return null for invalid URLs', () => {
      expect(parseRepoFromUrl('https://example.com')).toBeNull();
      expect(parseRepoFromUrl(null)).toBeNull();
      expect(parseRepoFromUrl('')).toBeNull();
    });

    it('should handle URLs with query parameters', () => {
      const result = parseRepoFromUrl(VALID_URL_WITH_QUERY);
      expect(result).toEqual({ owner: 'Astr0n99', repo: 'Shaiya-Old-School-Client' });
    });
  });

  describe('GITHUB_RELEASE_PATTERN', () => {
    it('should be a RegExp', () => {
      expect(GITHUB_RELEASE_PATTERN).toBeInstanceOf(RegExp);
    });

    it('should match valid release URL patterns', () => {
      expect(GITHUB_RELEASE_PATTERN.test('https://github.com/owner/repo/releases/download/v1/file.exe')).toBe(true);
    });

    it('should not match non-release URLs', () => {
      expect(GITHUB_RELEASE_PATTERN.test('https://github.com/owner/repo')).toBe(false);
    });
  });
});
