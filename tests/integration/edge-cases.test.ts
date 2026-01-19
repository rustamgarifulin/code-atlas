import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { writeFileContent } from '../../src/utils.js';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { createTempDir, cleanupTempDir, getFixturePath } from '../helpers/fixtures.js';

describe('Edge Cases', () => {
  let tempDir: string;
  let outputFile: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    outputFile = join(tempDir, 'output.md');
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('empty directories', () => {
    test('should handle directory with only empty subdirectories', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(join(srcDir, 'empty1'), { recursive: true });
      await mkdir(join(srcDir, 'empty2'), { recursive: true });

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toHaveLength(0);
    });
  });

  describe('special filenames', () => {
    test('should handle files with spaces in names', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'file with spaces.ts'), 'content');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toContain('file with spaces.ts');
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('file with spaces.ts');
    });

    test('should handle files with dashes and underscores', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'file-with-dashes.ts'), 'dashes');
      await writeFile(join(srcDir, 'file_with_underscores.ts'), 'underscores');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toContain('file-with-dashes.ts');
      expect(result.includedPaths).toContain('file_with_underscores.ts');
    });

    test('should handle files without extension', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'Makefile'), 'all: build');
      await writeFile(join(srcDir, 'Dockerfile'), 'FROM node');
      await writeFile(join(srcDir, 'LICENSE'), 'MIT');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toContain('Makefile');
      expect(result.includedPaths).toContain('Dockerfile');
      expect(result.includedPaths).toContain('LICENSE');
    });
  });

  describe('deep nesting', () => {
    test('should handle 10 levels of nesting', async () => {
      let path = join(tempDir, 'deep');
      for (let i = 0; i < 10; i++) {
        path = join(path, `level${i}`);
      }
      await mkdir(path, { recursive: true });
      await writeFile(join(path, 'deep-file.ts'), 'deeply nested');

      const result = await writeFileContent({
        dir: join(tempDir, 'deep'),
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths.length).toBe(1);
      expect(result.includedPaths[0]).toContain('deep-file.ts');
    });
  });

  describe('line endings', () => {
    test('should handle Unix line endings (LF)', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'unix.ts'), 'line1\nline2\nline3\n');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('line1');
      expect(content).toContain('line2');
      expect(content).toContain('line3');
    });

    test('should handle Windows line endings (CRLF)', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'windows.ts'), 'line1\r\nline2\r\nline3\r\n');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('line1');
      expect(content).toContain('line2');
    });
  });

  describe('unicode content', () => {
    test('should preserve Cyrillic content', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'i18n.ts'), 'const greeting = "Привет мир";');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('Привет мир');
    });

    test('should preserve Chinese content', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'i18n.ts'), 'const greeting = "你好世界";');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('你好世界');
    });

    test('should preserve Arabic content', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'i18n.ts'), 'const greeting = "مرحبا بالعالم";');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('مرحبا بالعالم');
    });
  });

  describe('many files', () => {
    test('should handle 100 files', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);

      for (let i = 0; i < 100; i++) {
        await writeFile(join(srcDir, `file${i}.ts`), `// File ${i}`);
      }

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toHaveLength(100);
    });
  });

  describe('dotfiles', () => {
    test('should include dotfiles by default', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, '.env'), 'SECRET=value');
      await writeFile(join(srcDir, '.gitignore'), 'node_modules/');
      await writeFile(join(srcDir, 'visible.ts'), 'visible');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toContain('.env');
      expect(result.includedPaths).toContain('.gitignore');
      expect(result.includedPaths).toContain('visible.ts');
    });

    test('should exclude dotfiles with ignore pattern', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, '.env'), 'SECRET=value');
      await writeFile(join(srcDir, 'visible.ts'), 'visible');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: ['**/.*']
      });

      expect(result.includedPaths).not.toContain('.env');
      expect(result.includedPaths).toContain('visible.ts');
    });
  });

  describe('fixtures', () => {
    test('should handle special-chars fixture', async () => {
      const fixturePath = getFixturePath('special-chars');

      const result = await writeFileContent({
        dir: fixturePath,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths.length).toBeGreaterThan(0);
    });

    test('should handle no-extension fixture', async () => {
      const fixturePath = getFixturePath('no-extension');

      const result = await writeFileContent({
        dir: fixturePath,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toContain('Makefile');
      expect(result.includedPaths).toContain('Dockerfile');
    });

    test('should handle dotfiles fixture', async () => {
      const fixturePath = getFixturePath('dotfiles');

      const result = await writeFileContent({
        dir: fixturePath,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths.some((p) => p.startsWith('.'))).toBe(true);
    });
  });
});
