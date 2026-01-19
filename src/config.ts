import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CLIArgs, CodeAtlasConfig } from './types.js';

// Possible config file names (in priority order)
const CONFIG_FILES = [
  '.code-atlas.json',
  '.code-atlasrc',
  '.code-atlasrc.json',
  'code-atlas.config.json',
  'code-atlas.config.js'
];

/**
 * Loads configuration from a file
 */
export async function loadConfig(configPath?: string): Promise<CodeAtlasConfig> {
  let config: CodeAtlasConfig = {};

  // If a specific config path is provided
  if (configPath) {
    if (!existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    config = await loadConfigFile(configPath);
  } else {
    // Search for config files in current directory
    config = await findAndLoadConfig(process.cwd());
  }

  // Check package.json for code-atlas section
  const packageConfig = await loadPackageJsonConfig();
  if (packageConfig) {
    config = mergeConfigs(packageConfig, config);
  }

  return config;
}

/**
 * Finds and loads config file in the specified directory
 */
async function findAndLoadConfig(dir: string): Promise<CodeAtlasConfig> {
  for (const configFile of CONFIG_FILES) {
    const configPath = join(dir, configFile);
    if (existsSync(configPath)) {
      console.log(`📄 Using config file: ${configFile}`);
      return await loadConfigFile(configPath);
    }
  }
  return {};
}

/**
 * Loads configuration from a specific file
 */
async function loadConfigFile(filePath: string): Promise<CodeAtlasConfig> {
  try {
    const ext = filePath.split('.').pop()?.toLowerCase();

    if (ext === 'js') {
      // For .js files use dynamic import
      const fullPath = resolve(filePath);
      const module = await import(`file://${fullPath}`);
      return module.default || module;
    } else {
      // For JSON files
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    throw new Error(`Failed to load config from ${filePath}: ${error}`);
  }
}

/**
 * Loads configuration from package.json
 */
async function loadPackageJsonConfig(): Promise<CodeAtlasConfig | null> {
  const packageJsonPath = join(process.cwd(), 'package.json');

  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson['code-atlas'] || null;
  } catch {
    return null;
  }
}

/**
 * Merges configurations (second argument takes priority)
 */
function mergeConfigs(base: CodeAtlasConfig, override: CodeAtlasConfig): CodeAtlasConfig {
  return {
    ...base,
    ...override,
    // Special handling for arrays
    ignore: override.ignore || base.ignore,
    alwaysIncludeExtensions: override.alwaysIncludeExtensions || base.alwaysIncludeExtensions
  };
}

/**
 * Merges configuration with CLI arguments
 */
export function mergeConfigWithArgs(config: CodeAtlasConfig, args: CLIArgs): CodeAtlasConfig {
  const merged: CodeAtlasConfig = { ...config };

  // CLI arguments take priority over config
  if (args.dir !== undefined) merged.dir = args.dir;
  if (args.output !== undefined) merged.output = args.output;
  if (args.ignore !== undefined) {
    merged.ignore = Array.isArray(args.ignore) ? args.ignore : args.ignore.split(',');
  }
  if (args.includedPathsFile !== undefined) merged.includedPathsFile = args.includedPathsFile;
  if (args.excludedPathsFile !== undefined) merged.excludedPathsFile = args.excludedPathsFile;
  if (args.maxFileSize !== undefined) merged.maxFileSize = parseInt(args.maxFileSize);
  if (args.sort !== undefined) merged.sort = args.sort as CodeAtlasConfig['sort'];

  return merged;
}

/**
 * Validates configuration
 */
export function validateConfig(config: CodeAtlasConfig): void {
  if (config.maxFileSize && config.maxFileSize < 0) {
    throw new Error('maxFileSize must be a positive number');
  }

  if (config.sort && !['name', 'size', 'modified', 'type'].includes(config.sort)) {
    throw new Error('sort must be one of: name, size, modified, type');
  }

  if (config.sortDirection && !['asc', 'desc'].includes(config.sortDirection)) {
    throw new Error('sortDirection must be either "asc" or "desc"');
  }
}
