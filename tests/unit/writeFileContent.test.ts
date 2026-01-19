import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { writeFileContent } from '../../src/utils.js';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { createTempDir, cleanupTempDir, getFixturePath } from '../helpers/fixtures.js';

describe('writeFileContent', () => {
  let tempDir: string;
  let outputFile: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    outputFile = join(tempDir, 'output.md');
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('basic functionality', () => {
    test('should write file contents to output', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'index.ts'), 'export const x = 1;');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toContain('index.ts');
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('export const x = 1;');
    });

    test('should use correct extension for syntax highlighting', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'code.ts'), 'const x = 1;');
      await writeFile(join(srcDir, 'code.js'), 'var y = 2;');
      await writeFile(join(srcDir, 'data.json'), '{}');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toMatch(/```ts/);
      expect(content).toMatch(/```js/);
      expect(content).toMatch(/```json/);
    });

    test('should include relative paths as headers', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(join(srcDir, 'utils'), { recursive: true });
      await writeFile(join(srcDir, 'index.ts'), 'main');
      await writeFile(join(srcDir, 'utils/helper.ts'), 'helper');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('## index.ts');
      expect(content).toContain('## utils/helper.ts');
    });
  });

  describe('maxFileSize filtering', () => {
    test('should exclude files exceeding maxFileSize', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'small.ts'), 'x');
      await writeFile(join(srcDir, 'large.ts'), 'x'.repeat(10000));

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: [],
        maxFileSize: 1000
      });

      expect(result.includedPaths).toContain('small.ts');
      expect(result.excludedPaths).toContain('large.ts');
    });

    test('should always include files with alwaysIncludeExtensions', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'large.json'), '{"data": "' + 'x'.repeat(10000) + '"}');
      await writeFile(join(srcDir, 'large.txt'), 'x'.repeat(10000));

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: [],
        maxFileSize: 100,
        alwaysIncludeExtensions: ['json']
      });

      expect(result.includedPaths).toContain('large.json');
      expect(result.excludedPaths).toContain('large.txt');
    });

    test('should handle extension with or without leading dot', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'large.ts'), 'x'.repeat(10000));

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: [],
        maxFileSize: 100,
        alwaysIncludeExtensions: ['.ts']
      });

      expect(result.includedPaths).toContain('large.ts');
    });
  });

  describe('custom fileTemplate', () => {
    test('should use fileTemplate when provided', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'file.ts'), 'const x = 1;');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: [],
        fileTemplate: '### File: {{path}}\nLanguage: {{extension}}\n```{{extension}}\n{{content}}\n```'
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('### File: file.ts');
      expect(content).toContain('Language: ts');
      expect(content).toContain('const x = 1;');
    });

    test('should replace all template variables', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'test.js'), 'var x = 1;');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: [],
        fileTemplate: 'PATH={{path}} EXT={{extension}}\n{{content}}'
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('PATH=test.js');
      expect(content).toContain('EXT=js');
      expect(content).toContain('var x = 1;');
    });
  });

  describe('path tracking', () => {
    test('should track included paths correctly', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'a.ts'), 'a');
      await writeFile(join(srcDir, 'b.ts'), 'b');
      await writeFile(join(srcDir, 'c.ts'), 'c');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toHaveLength(3);
      expect(result.includedPaths).toContain('a.ts');
      expect(result.includedPaths).toContain('b.ts');
      expect(result.includedPaths).toContain('c.ts');
    });

    test('should save included paths to file when specified', async () => {
      const srcDir = join(tempDir, 'src');
      const includedPathsFile = join(tempDir, 'included.txt');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'a.ts'), 'a');
      await writeFile(join(srcDir, 'b.ts'), 'b');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: [],
        includedPathsFile
      });

      const includedContent = await readFile(includedPathsFile, 'utf-8');
      expect(includedContent).toContain('a.ts');
      expect(includedContent).toContain('b.ts');
    });

    test('should save excluded paths to file when specified', async () => {
      const srcDir = join(tempDir, 'src');
      const excludedPathsFile = join(tempDir, 'excluded.txt');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'small.ts'), 'x');
      await writeFile(join(srcDir, 'large.ts'), 'x'.repeat(10000));

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: [],
        maxFileSize: 100,
        excludedPathsFile
      });

      const excludedContent = await readFile(excludedPathsFile, 'utf-8');
      expect(excludedContent).toContain('large.ts');
    });
  });

  describe('with fixtures', () => {
    test('should process basic fixture', async () => {
      const fixturePath = getFixturePath('basic');

      const result = await writeFileContent({
        dir: fixturePath,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths.length).toBeGreaterThan(0);
      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('file1.ts');
    });

    test('should exclude log files with ignore pattern', async () => {
      const fixturePath = getFixturePath('basic');

      const result = await writeFileContent({
        dir: fixturePath,
        output: outputFile,
        ignore: ['**/*.log']
      });

      expect(result.includedPaths.some((p) => p.endsWith('.log'))).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle files without extension', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'Makefile'), 'all: build');
      await writeFile(join(srcDir, 'Dockerfile'), 'FROM node');

      const result = await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toContain('Makefile');
      expect(result.includedPaths).toContain('Dockerfile');

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('## Makefile');
      expect(content).toContain('## Dockerfile');
    });

    test('should handle empty directory', async () => {
      const emptyDir = join(tempDir, 'empty');
      await mkdir(emptyDir);

      const result = await writeFileContent({
        dir: emptyDir,
        output: outputFile,
        ignore: []
      });

      expect(result.includedPaths).toHaveLength(0);
    });

    test('should handle unicode content', async () => {
      const srcDir = join(tempDir, 'src');
      await mkdir(srcDir);
      await writeFile(join(srcDir, 'i18n.ts'), 'const greeting = "Привет мир 你好世界";');

      await writeFileContent({
        dir: srcDir,
        output: outputFile,
        ignore: []
      });

      const content = await readFile(outputFile, 'utf-8');
      expect(content).toContain('Привет мир');
      expect(content).toContain('你好世界');
    });
  });
});
