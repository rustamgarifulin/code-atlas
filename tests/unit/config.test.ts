import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, mergeConfigWithArgs, validateConfig } from '../../src/config.js';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createTempDir, cleanupTempDir, getFixturePath } from '../helpers/fixtures.js';

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('loading JSON config', () => {
    test('should load JSON config file', async () => {
      const configPath = join(tempDir, 'config.json');
      await writeFile(
        configPath,
        JSON.stringify({
          dir: './src',
          output: 'docs.md',
          ignore: ['**/*.test.ts']
        })
      );

      const config = await loadConfig(configPath);
      expect(config.dir).toBe('./src');
      expect(config.output).toBe('docs.md');
      expect(config.ignore).toEqual(['**/*.test.ts']);
    });

    test('should load config with all options', async () => {
      const configPath = join(tempDir, 'config.json');
      await writeFile(
        configPath,
        JSON.stringify({
          dir: './lib',
          output: 'documentation.md',
          ignore: ['**/*.log'],
          maxFileSize: 1048576,
          alwaysIncludeExtensions: ['json', 'md'],
          header: '# My Project\n\n',
          fileTemplate: '## {{path}}\n{{content}}'
        })
      );

      const config = await loadConfig(configPath);
      expect(config.dir).toBe('./lib');
      expect(config.maxFileSize).toBe(1048576);
      expect(config.alwaysIncludeExtensions).toEqual(['json', 'md']);
      expect(config.header).toBe('# My Project\n\n');
    });
  });

  describe('loading JS config', () => {
    test('should load JS config file', async () => {
      const configPath = join(tempDir, 'config.js');
      await writeFile(
        configPath,
        `export default {
          dir: './src',
          output: 'docs.md'
        };`
      );

      const config = await loadConfig(configPath);
      expect(config.dir).toBe('./src');
      expect(config.output).toBe('docs.md');
    });
  });

  describe('error handling', () => {
    test('should throw for non-existent config file', async () => {
      await expect(loadConfig('/non/existent/config.json')).rejects.toThrow(
        'Config file not found'
      );
    });

    test('should throw for invalid JSON', async () => {
      const configPath = join(tempDir, 'invalid.json');
      await writeFile(configPath, '{invalid json content}');

      await expect(loadConfig(configPath)).rejects.toThrow();
    });
  });

  describe('with fixture configs', () => {
    test('should load fixture JSON config', async () => {
      const configPath = getFixturePath('configs/.reposcope.json');
      const config = await loadConfig(configPath);

      expect(config.dir).toBe('./src');
      expect(config.output).toBe('documentation.md');
      expect(Array.isArray(config.ignore)).toBe(true);
    });
  });
});

describe('mergeConfigWithArgs', () => {
  describe('priority handling', () => {
    test('should give CLI args priority over config', () => {
      const config = { dir: './src', output: 'docs.md' };
      const args = { dir: './lib', output: 'lib-docs.md' };

      const result = mergeConfigWithArgs(config, args);
      expect(result.dir).toBe('./lib');
      expect(result.output).toBe('lib-docs.md');
    });

    test('should use config values when args not provided', () => {
      const config = { dir: './src', output: 'docs.md', maxFileSize: 1024 };
      const args = {};

      const result = mergeConfigWithArgs(config, args);
      expect(result.dir).toBe('./src');
      expect(result.output).toBe('docs.md');
      expect(result.maxFileSize).toBe(1024);
    });

    test('should handle undefined args gracefully', () => {
      const config = { dir: './src' };
      const args = { dir: undefined, output: 'docs.md' };

      const result = mergeConfigWithArgs(config, args);
      expect(result.dir).toBe('./src');
      expect(result.output).toBe('docs.md');
    });
  });

  describe('type conversion', () => {
    test('should parse maxFileSize string to number', () => {
      const result = mergeConfigWithArgs({}, { maxFileSize: '1048576' });
      expect(result.maxFileSize).toBe(1048576);
      expect(typeof result.maxFileSize).toBe('number');
    });

    test('should split comma-separated ignore patterns', () => {
      const result = mergeConfigWithArgs({}, { ignore: '**/*.log,**/*.tmp,**/*.cache' });
      expect(result.ignore).toEqual(['**/*.log', '**/*.tmp', '**/*.cache']);
    });
  });

  describe('ignore patterns', () => {
    test('should override config ignore with args ignore', () => {
      const config = { ignore: ['**/*.log'] };
      const args = { ignore: '**/*.tmp' };

      const result = mergeConfigWithArgs(config, args);
      expect(result.ignore).toEqual(['**/*.tmp']);
    });

    test('should preserve config ignore when args ignore not provided', () => {
      const config = { ignore: ['**/*.log', '**/*.tmp'] };
      const args = {};

      const result = mergeConfigWithArgs(config, args);
      expect(result.ignore).toEqual(['**/*.log', '**/*.tmp']);
    });
  });

  describe('sort option', () => {
    test('should set sort option from args', () => {
      const result = mergeConfigWithArgs({}, { sort: 'size' });
      expect(result.sort).toBe('size');
    });

    test('should override config sort with args sort', () => {
      const config = { sort: 'name' as const };
      const args = { sort: 'modified' };

      const result = mergeConfigWithArgs(config, args);
      expect(result.sort).toBe('modified');
    });
  });

  describe('all options together', () => {
    test('should merge all options correctly', () => {
      const config = {
        dir: './src',
        header: '# Docs\n'
      };
      const args = {
        dir: './lib',
        output: 'output.md',
        ignore: '**/*.log',
        maxFileSize: '2097152',
        sort: 'type'
      };

      const result = mergeConfigWithArgs(config, args);
      expect(result.dir).toBe('./lib');
      expect(result.output).toBe('output.md');
      expect(result.ignore).toEqual(['**/*.log']);
      expect(result.maxFileSize).toBe(2097152);
      expect(result.sort).toBe('type');
      expect(result.header).toBe('# Docs\n');
    });
  });
});

describe('validateConfig', () => {
  describe('valid configurations', () => {
    test('should pass empty config', () => {
      expect(() => validateConfig({})).not.toThrow();
    });

    test('should pass valid config with all options', () => {
      expect(() =>
        validateConfig({
          dir: './src',
          output: 'docs.md',
          maxFileSize: 1024,
          sort: 'name',
          sortDirection: 'asc'
        })
      ).not.toThrow();
    });

    test('should pass all valid sort options', () => {
      const validSorts: Array<'name' | 'size' | 'modified' | 'type'> = [
        'name',
        'size',
        'modified',
        'type'
      ];

      validSorts.forEach((sort) => {
        expect(() => validateConfig({ sort })).not.toThrow();
      });
    });

    test('should pass all valid sort directions', () => {
      expect(() => validateConfig({ sortDirection: 'asc' })).not.toThrow();
      expect(() => validateConfig({ sortDirection: 'desc' })).not.toThrow();
    });

    test('should pass positive maxFileSize', () => {
      expect(() => validateConfig({ maxFileSize: 1 })).not.toThrow();
      expect(() => validateConfig({ maxFileSize: 1000000 })).not.toThrow();
    });
  });

  describe('invalid configurations', () => {
    test('should throw for negative maxFileSize', () => {
      expect(() => validateConfig({ maxFileSize: -1 })).toThrow(
        'maxFileSize must be a positive number'
      );
    });

    test('should throw for invalid sort option', () => {
      expect(() => validateConfig({ sort: 'invalid' as any })).toThrow(
        'sort must be one of'
      );
    });

    test('should throw for invalid sortDirection', () => {
      expect(() => validateConfig({ sortDirection: 'up' as any })).toThrow(
        'sortDirection must be either'
      );
    });
  });

  describe('edge cases', () => {
    test('should pass zero maxFileSize', () => {
      // Zero is technically non-negative, implementation decides if valid
      expect(() => validateConfig({ maxFileSize: 0 })).not.toThrow();
    });

    test('should pass very large maxFileSize', () => {
      expect(() => validateConfig({ maxFileSize: Number.MAX_SAFE_INTEGER })).not.toThrow();
    });
  });
});
