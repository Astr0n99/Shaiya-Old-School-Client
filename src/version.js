'use strict';

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?(?:\+([\w.]+))?$/;

/**
 * Parse a semver string into its component parts.
 * @param {string} versionStr
 * @returns {{ major: number, minor: number, patch: number, prerelease: string|null, build: string|null }}
 */
function parse(versionStr) {
  if (typeof versionStr !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof versionStr}`);
  }

  const trimmed = versionStr.trim();
  const normalized = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed;
  const match = normalized.match(SEMVER_REGEX);

  if (!match) {
    throw new Error(`Invalid version string: "${versionStr}"`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null,
  };
}

/**
 * Validate whether a string is a valid semver version.
 * @param {string} versionStr
 * @returns {boolean}
 */
function isValid(versionStr) {
  try {
    parse(versionStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compare two semver version strings.
 * Returns -1 if a < b, 0 if a == b, 1 if a > b.
 * @param {string} a
 * @param {string} b
 * @returns {-1|0|1}
 */
function compare(a, b) {
  const va = parse(a);
  const vb = parse(b);

  const fields = ['major', 'minor', 'patch'];
  for (const field of fields) {
    if (va[field] < vb[field]) return -1;
    if (va[field] > vb[field]) return 1;
  }

  // Pre-release versions have lower precedence than the associated normal version
  if (va.prerelease && !vb.prerelease) return -1;
  if (!va.prerelease && vb.prerelease) return 1;
  if (va.prerelease && vb.prerelease) {
    if (va.prerelease < vb.prerelease) return -1;
    if (va.prerelease > vb.prerelease) return 1;
  }

  return 0;
}

/**
 * Check if version a is greater than version b.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isGreaterThan(a, b) {
  return compare(a, b) === 1;
}

/**
 * Check if version a is less than version b.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isLessThan(a, b) {
  return compare(a, b) === -1;
}

/**
 * Check if two versions are equal.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isEqual(a, b) {
  return compare(a, b) === 0;
}

/**
 * Format a parsed version object back to a string.
 * @param {{ major: number, minor: number, patch: number, prerelease?: string|null, build?: string|null }} ver
 * @returns {string}
 */
function format(ver) {
  if (typeof ver !== 'object' || ver === null) {
    throw new TypeError('Expected a version object');
  }
  if (typeof ver.major !== 'number' || typeof ver.minor !== 'number' || typeof ver.patch !== 'number') {
    throw new TypeError('Version object must have numeric major, minor, and patch fields');
  }

  let result = `${ver.major}.${ver.minor}.${ver.patch}`;
  if (ver.prerelease) result += `-${ver.prerelease}`;
  if (ver.build) result += `+${ver.build}`;
  return result;
}

/**
 * Increment a version by a given release type.
 * @param {string} versionStr
 * @param {'major'|'minor'|'patch'} releaseType
 * @returns {string}
 */
function increment(versionStr, releaseType) {
  const ver = parse(versionStr);
  const validTypes = ['major', 'minor', 'patch'];

  if (!validTypes.includes(releaseType)) {
    throw new Error(`Invalid release type: "${releaseType}". Must be one of: ${validTypes.join(', ')}`);
  }

  switch (releaseType) {
    case 'major':
      ver.major += 1;
      ver.minor = 0;
      ver.patch = 0;
      break;
    case 'minor':
      ver.minor += 1;
      ver.patch = 0;
      break;
    case 'patch':
      ver.patch += 1;
      break;
  }

  ver.prerelease = null;
  ver.build = null;
  return format(ver);
}

module.exports = {
  parse,
  isValid,
  compare,
  isGreaterThan,
  isLessThan,
  isEqual,
  format,
  increment,
  SEMVER_REGEX,
};
