import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { appendToFile } from '../../src/utils.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createTempDir, cleanupTempDir } from '../helpers/fixtures.js';

describe('appendToFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('file creation', () => {
    test('should create file if not exists', () => {
      const filePath = join(tempDir, 'new-file.txt');
      appendToFile(filePath, 'content');

      expect(existsSync(filePath)).toBe(true);
    });

    test('should create parent directories if needed', () => {
      const filePath = join(tempDir, 'deep/nested/path/file.txt');
      appendToFile(filePath, 'content');

      expect(existsSync(filePath)).toBe(true);
    });

    test('should create deeply nested directories', () => {
      const filePath = join(tempDir, 'a/b/c/d/e/f/file.txt');
      appendToFile(filePath, 'content');

      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('appending content', () => {
    test('should append to existing file', async () => {
      const filePath = join(tempDir, 'file.txt');
      appendToFile(filePath, 'line1\n');
      appendToFile(filePath, 'line2\n');
      appendToFile(filePath, 'line3\n');

      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('line1\nline2\nline3\n');
    });

    test('should preserve existing content', async () => {
      const filePath = join(tempDir, 'file.txt');
      appendToFile(filePath, 'first');
      appendToFile(filePath, ' second');
      appendToFile(filePath, ' third');

      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('first second third');
    });

    test('should handle multiple rapid appends', async () => {
      const filePath = join(tempDir, 'file.txt');

      for (let i = 0; i < 100; i++) {
        appendToFile(filePath, `line${i}\n`);
      }

      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      expect(lines).toHaveLength(100);
    });
  });

  describe('content types', () => {
    test('should handle empty string', () => {
      const filePath = join(tempDir, 'empty.txt');
      appendToFile(filePath, '');

      expect(existsSync(filePath)).toBe(true);
    });

    test('should handle unicode content', async () => {
      const filePath = join(tempDir, 'unicode.txt');
      appendToFile(filePath, '你好世界\n');
      appendToFile(filePath, 'Привет мир\n');
      appendToFile(filePath, 'مرحبا بالعالم\n');

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('你好世界');
      expect(content).toContain('Привет мир');
      expect(content).toContain('مرحبا بالعالم');
    });

    test('should handle special characters', async () => {
      const filePath = join(tempDir, 'special.txt');
      appendToFile(filePath, 'Tab:\t\n');
      appendToFile(filePath, 'Quotes: "double" \'single\'\n');
      appendToFile(filePath, 'Backslash: \\\n');

      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('Tab:\t');
      expect(content).toContain('"double"');
      expect(content).toContain('\\');
    });

    test('should handle large content', async () => {
      const filePath = join(tempDir, 'large.txt');
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      appendToFile(filePath, largeContent);

      const content = await readFile(filePath, 'utf-8');
      expect(content.length).toBe(1024 * 1024);
    });

    test('should handle multiline content', async () => {
      const filePath = join(tempDir, 'multiline.txt');
      const multiline = `Line 1
Line 2
Line 3
Line 4`;
      appendToFile(filePath, multiline);

      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe(multiline);
    });
  });

  describe('edge cases', () => {
    test('should handle file path with spaces', async () => {
      const filePath = join(tempDir, 'file with spaces.txt');
      appendToFile(filePath, 'content');

      expect(existsSync(filePath)).toBe(true);
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('content');
    });

    test('should handle directory path at root of temp', () => {
      const filePath = join(tempDir, 'simple.txt');
      appendToFile(filePath, 'content');

      expect(existsSync(filePath)).toBe(true);
    });
  });
});
