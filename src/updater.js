'use strict';

const { parse, isGreaterThan } = require('./version');

const GITHUB_RELEASE_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/[^/]+\/.+$/;

/**
 * Validate a GitHub release download URL.
 * @param {string} url
 * @returns {boolean}
 */
function isValidReleaseUrl(url) {
  if (typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return GITHUB_RELEASE_PATTERN.test(url.split('?')[0]);
  } catch {
    return false;
  }
}

/**
 * Extract the tag/version from a GitHub release URL.
 * @param {string} url
 * @returns {string|null}
 */
function extractTagFromUrl(url) {
  if (!isValidReleaseUrl(url)) return null;

  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    // Pattern: /owner/repo/releases/download/TAG/filename
    const downloadIdx = parts.indexOf('download');
    if (downloadIdx === -1 || downloadIdx + 1 >= parts.length) return null;
    return parts[downloadIdx + 1];
  } catch {
    return null;
  }
}

/**
 * Extract the filename from a GitHub release URL.
 * @param {string} url
 * @returns {string|null}
 */
function extractFilenameFromUrl(url) {
  if (!isValidReleaseUrl(url)) return null;

  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * Check if an update is available by comparing current and remote configs.
 * @param {{ version: string }} currentConfig
 * @param {{ version: string }} remoteConfig
 * @returns {{ updateAvailable: boolean, currentVersion: string, remoteVersion: string }}
 */
function checkForUpdate(currentConfig, remoteConfig) {
  if (!currentConfig || !currentConfig.version) {
    throw new Error('Current config must have a "version" field');
  }
  if (!remoteConfig || !remoteConfig.version) {
    throw new Error('Remote config must have a "version" field');
  }

  const currentVersion = currentConfig.version;
  const remoteVersion = remoteConfig.version;

  // Validate both are parseable
  parse(currentVersion);
  parse(remoteVersion);

  return {
    updateAvailable: isGreaterThan(remoteVersion, currentVersion),
    currentVersion,
    remoteVersion,
  };
}

/**
 * Build a release URL from repository info.
 * @param {string} owner
 * @param {string} repo
 * @param {string} tag
 * @param {string} filename
 * @returns {string}
 */
function buildReleaseUrl(owner, repo, tag, filename) {
  if (!owner || !repo || !tag || !filename) {
    throw new Error('All parameters (owner, repo, tag, filename) are required');
  }

  return `https://github.com/${owner}/${repo}/releases/download/${tag}/${filename}`;
}

/**
 * Parse owner and repo from a GitHub release URL.
 * @param {string} url
 * @returns {{ owner: string, repo: string }|null}
 */
function parseRepoFromUrl(url) {
  if (!isValidReleaseUrl(url)) return null;

  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

module.exports = {
  isValidReleaseUrl,
  extractTagFromUrl,
  extractFilenameFromUrl,
  checkForUpdate,
  buildReleaseUrl,
  parseRepoFromUrl,
  GITHUB_RELEASE_PATTERN,
};
