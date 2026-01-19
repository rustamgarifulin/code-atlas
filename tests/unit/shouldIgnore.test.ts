import { describe, test, expect } from 'vitest';
import { shouldIgnore } from '../../src/utils.js';

describe('shouldIgnore', () => {
  describe('basic pattern matching', () => {
    test('should match single glob pattern', () => {
      expect(shouldIgnore('src/file.log', ['**/*.log'])).toBe(true);
    });

    test('should not match non-matching pattern', () => {
      expect(shouldIgnore('src/file.ts', ['**/*.log'])).toBe(false);
    });

    test('should match multiple patterns', () => {
      const patterns = ['**/*.log', '**/node_modules/**', '**/.git/**'];
      expect(shouldIgnore('debug.log', patterns)).toBe(true);
      expect(shouldIgnore('node_modules/pkg/index.js', patterns)).toBe(true);
      expect(shouldIgnore('.git/config', patterns)).toBe(true);
    });

    test('should return true for dot path', () => {
      expect(shouldIgnore('.', [])).toBe(true);
      expect(shouldIgnore('.', ['**/*.ts'])).toBe(true);
    });
  });

  describe('glob pattern types', () => {
    test('should match file extension patterns', () => {
      expect(shouldIgnore('file.ts', ['*.ts'])).toBe(true);
      expect(shouldIgnore('file.js', ['*.ts'])).toBe(false);
    });

    test('should match double star patterns', () => {
      expect(shouldIgnore('src/components/Button.tsx', ['**/*.tsx'])).toBe(true);
      expect(shouldIgnore('a/b/c/d/file.ts', ['**/*.ts'])).toBe(true);
    });

    test('should match brace expansion', () => {
      expect(shouldIgnore('file.spec.ts', ['**/*.{spec,test}.ts'])).toBe(true);
      expect(shouldIgnore('file.test.ts', ['**/*.{spec,test}.ts'])).toBe(true);
      expect(shouldIgnore('file.ts', ['**/*.{spec,test}.ts'])).toBe(false);
    });

    test('should match directory patterns', () => {
      expect(shouldIgnore('node_modules/package/index.js', ['**/node_modules/**'])).toBe(true);
      expect(shouldIgnore('src/node_modules/file.js', ['**/node_modules/**'])).toBe(true);
    });
  });

  describe('dotfiles', () => {
    test('should match hidden files with dot option', () => {
      expect(shouldIgnore('.env', ['.*'])).toBe(true);
      expect(shouldIgnore('.gitignore', ['.*'])).toBe(true);
      expect(shouldIgnore('.hidden', ['.*'])).toBe(true);
    });

    test('should match hidden directories', () => {
      expect(shouldIgnore('.git/config', ['**/.git/**'])).toBe(true);
      expect(shouldIgnore('.vscode/settings.json', ['**/.vscode/**'])).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle empty patterns array', () => {
      expect(shouldIgnore('any/file.ts', [])).toBe(false);
    });

    test('should handle paths with special characters', () => {
      expect(shouldIgnore('file@test.ts', ['**/*.ts'])).toBe(true);
      expect(shouldIgnore('file#hash.ts', ['**/*.ts'])).toBe(true);
      expect(shouldIgnore('file$dollar.ts', ['**/*.ts'])).toBe(true);
    });

    test('should handle very long paths', () => {
      const longPath = 'a/'.repeat(50) + 'file.ts';
      expect(shouldIgnore(longPath, ['**/*.ts'])).toBe(true);
    });

    test('should handle paths with spaces', () => {
      expect(shouldIgnore('path with spaces/file.ts', ['**/*.ts'])).toBe(true);
    });

    test('should be case sensitive by default', () => {
      expect(shouldIgnore('FILE.LOG', ['**/*.log'])).toBe(false);
      expect(shouldIgnore('file.LOG', ['**/*.log'])).toBe(false);
      expect(shouldIgnore('file.log', ['**/*.log'])).toBe(true);
    });
  });

  describe('negation and complex patterns', () => {
    test('should match exact filename', () => {
      expect(shouldIgnore('package-lock.json', ['package-lock.json'])).toBe(true);
      expect(shouldIgnore('package.json', ['package-lock.json'])).toBe(false);
    });

    test('should match partial path', () => {
      expect(shouldIgnore('src/utils/helpers.ts', ['**/utils/**'])).toBe(true);
    });

    test('should handle multiple extensions', () => {
      const patterns = ['**/*.{js,ts,jsx,tsx}'];
      expect(shouldIgnore('file.js', patterns)).toBe(true);
      expect(shouldIgnore('file.ts', patterns)).toBe(true);
      expect(shouldIgnore('file.jsx', patterns)).toBe(true);
      expect(shouldIgnore('file.tsx', patterns)).toBe(true);
      expect(shouldIgnore('file.css', patterns)).toBe(false);
    });
  });
});
