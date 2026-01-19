import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { runCLI } from '../helpers/cli.js';
import { createTempDir, cleanupTempDir, getFixturePath } from '../helpers/fixtures.js';

describe('CLI Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('help and version', () => {
    test('should show help with -help flag', async () => {
      const result = await runCLI(['-help']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('-dir=');
      expect(result.stdout).toContain('-output=');
      expect(result.stdout).toContain('-ignore=');
    });

    test('should show help when no arguments provided', async () => {
      const result = await runCLI([]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Usage:');
    });

    test('should show version with -version flag', async () => {
      const result = await runCLI(['-version']);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/v\d+\.\d+\.\d+/);
    });
  });

  describe('basic documentation generation', () => {
    test('should generate documentation from directory', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'index.ts'), 'export const x = 1;');

      const result = await runCLI([`-dir=${srcDir}`, `-output=${outputFile}`]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Codebase documentation generated successfully');
      expect(existsSync(outputFile)).toBe(true);

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('Tree View');
      expect(content).toContain('index.ts');
      expect(content).toContain('export const x = 1;');
    });

    test('should show statistics in output', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'a.ts'), 'a');
      await writeFile(join(srcDir, 'b.ts'), 'b');
      await writeFile(join(srcDir, 'c.ts'), 'c');

      const result = await runCLI([`-dir=${srcDir}`, `-output=${outputFile}`]);

      expect(result.stdout).toContain('Included paths:');
      expect(result.stdout).toMatch(/Included paths: [0-9]+/);
    });
  });

  describe('ignore patterns', () => {
    test('should exclude files matching ignore patterns', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'keep.ts'), 'keep');
      await writeFile(join(srcDir, 'ignore.log'), 'ignore');

      const result = await runCLI([
        `-dir=${srcDir}`,
        `-output=${outputFile}`,
        `-ignore=**/*.log`
      ]);

      expect(result.code).toBe(0);
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('keep.ts');
      expect(content).not.toContain('ignore.log');
    });

    test('should handle multiple ignore patterns', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'keep.ts'), 'keep');
      await writeFile(join(srcDir, 'a.log'), 'log');
      await writeFile(join(srcDir, 'b.tmp'), 'tmp');

      const result = await runCLI([
        `-dir=${srcDir}`,
        `-output=${outputFile}`,
        `-ignore=**/*.log,**/*.tmp`
      ]);

      expect(result.code).toBe(0);
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('keep.ts');
      expect(content).not.toContain('.log');
      expect(content).not.toContain('.tmp');
    });
  });

  describe('file size limits', () => {
    test('should respect maxFileSize option', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'small.ts'), 'small');
      await writeFile(join(srcDir, 'large.ts'), 'x'.repeat(10000));

      const result = await runCLI([
        `-dir=${srcDir}`,
        `-output=${outputFile}`,
        `-max-file-size=1000`
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/Excluded paths: [1-9]/);
    });
  });

  describe('path tracking files', () => {
    test('should save included paths to file', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      const includedFile = join(tempDir, 'included.txt');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'a.ts'), 'a');
      await writeFile(join(srcDir, 'b.ts'), 'b');

      await runCLI([
        `-dir=${srcDir}`,
        `-output=${outputFile}`,
        `-included-paths-file=${includedFile}`
      ]);

      expect(existsSync(includedFile)).toBe(true);
      const content = await readFile(includedFile, 'utf-8');
      expect(content).toContain('a.ts');
      expect(content).toContain('b.ts');
    });

    test('should save excluded paths to file', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      const excludedFile = join(tempDir, 'excluded.txt');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'small.ts'), 'small');
      await writeFile(join(srcDir, 'large.ts'), 'x'.repeat(10000));

      await runCLI([
        `-dir=${srcDir}`,
        `-output=${outputFile}`,
        `-max-file-size=100`,
        `-excluded-paths-file=${excludedFile}`
      ]);

      expect(existsSync(excludedFile)).toBe(true);
      const content = await readFile(excludedFile, 'utf-8');
      expect(content).toContain('large.ts');
    });
  });

  describe('with fixtures', () => {
    test('should process basic fixture', async () => {
      const fixturePath = getFixturePath('basic');
      const outputFile = join(tempDir, 'output.md');

      const result = await runCLI([`-dir=${fixturePath}`, `-output=${outputFile}`]);

      expect(result.code).toBe(0);
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('file1.ts');
      expect(content).toContain('file2.js');
      expect(content).toContain('data.json');
    });

    test('should process nested fixture', async () => {
      const fixturePath = getFixturePath('nested');
      const outputFile = join(tempDir, 'output.md');

      const result = await runCLI([`-dir=${fixturePath}`, `-output=${outputFile}`]);

      expect(result.code).toBe(0);
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('level1');
      expect(content).toContain('level2');
      expect(content).toContain('level3');
    });
  });

  describe('error handling', () => {
    test('should fail for non-existent directory', async () => {
      const result = await runCLI([
        `-dir=/non/existent/path`,
        `-output=${join(tempDir, 'output.md')}`
      ]);

      expect(result.code).not.toBe(0);
    });

    test('should fail for invalid sort option', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'file.ts'), 'content');

      const result = await runCLI([
        `-dir=${srcDir}`,
        `-output=${join(tempDir, 'output.md')}`,
        `-sort=invalid`
      ]);

      expect(result.code).not.toBe(0);
    });
  });

  describe('tree view formatting', () => {
    test('should generate proper tree view', async () => {
      const srcDir = join(tempDir, 'src');
      const outputFile = join(tempDir, 'output.md');
      await mkdir(join(srcDir, 'components'), { recursive: true });
      await writeFile(join(srcDir, 'index.ts'), 'main');
      await writeFile(join(srcDir, 'components/Button.tsx'), 'button');

      const result = await runCLI([`-dir=${srcDir}`, `-output=${outputFile}`]);

      expect(result.code).toBe(0);
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('## Tree View');
      expect(content).toMatch(/[├└]/); // Tree characters
    });
  });
});
