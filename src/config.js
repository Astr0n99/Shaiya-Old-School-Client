'use strict';

const fs = require('fs');
const path = require('path');
const { isValid } = require('./version');

const DEFAULT_CONFIG_FILENAME = 'version.json';

/**
 * Load and parse a JSON config file.
 * @param {string} filePath
 * @returns {object}
 */
function loadJson(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('File path must be a non-empty string');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse config file: ${err.message}`);
  }
}

/**
 * Validate the structure of a version config object.
 * Expected shape: { version: string, url: string }
 * @param {object} config
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(config) {
  const errors = [];

  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return { valid: false, errors: ['Config must be a plain object'] };
  }

  if (!config.version) {
    errors.push('Missing required field: "version"');
  } else if (typeof config.version !== 'string') {
    errors.push('"version" must be a string');
  } else if (!isValid(config.version)) {
    errors.push(`Invalid semver version: "${config.version}"`);
  }

  if (!config.url) {
    errors.push('Missing required field: "url"');
  } else if (typeof config.url !== 'string') {
    errors.push('"url" must be a string');
  } else {
    try {
      new URL(config.url);
    } catch {
      errors.push(`Invalid URL: "${config.url}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Resolve the default config file path relative to the project root.
 * @param {string} [baseDir]
 * @returns {string}
 */
function resolveConfigPath(baseDir) {
  const dir = baseDir || process.cwd();
  return path.resolve(dir, DEFAULT_CONFIG_FILENAME);
}

/**
 * Load and validate the version config from the default file.
 * @param {string} [baseDir]
 * @returns {{ config: object, validation: { valid: boolean, errors: string[] } }}
 */
function loadConfig(baseDir) {
  const filePath = resolveConfigPath(baseDir);
  const config = loadJson(filePath);
  const validation = validate(config);
  return { config, validation };
}

/**
 * Write a config object to a JSON file.
 * @param {string} filePath
 * @param {object} config
 */
function writeConfig(filePath, config) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('File path must be a non-empty string');
  }

  const validation = validate(config);
  if (!validation.valid) {
    throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
  }

  const json = JSON.stringify(config, null, 2) + '\n';
  fs.writeFileSync(filePath, json, 'utf-8');
}

module.exports = {
  loadJson,
  validate,
  resolveConfigPath,
  loadConfig,
  writeConfig,
  DEFAULT_CONFIG_FILENAME,
};
