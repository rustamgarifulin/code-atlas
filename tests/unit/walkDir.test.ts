import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { walkDir } from '../../src/utils.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { createTempDir, cleanupTempDir, getFixturePath } from '../helpers/fixtures.js';

describe('walkDir', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('basic traversal', () => {
    test('should find all files in flat directory', async () => {
      await writeFile(join(tempDir, 'file1.ts'), 'content1');
      await writeFile(join(tempDir, 'file2.js'), 'content2');
      await writeFile(join(tempDir, 'file3.json'), '{}');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      });

      expect(files).toHaveLength(3);
      expect(files).toContain('file1.ts');
      expect(files).toContain('file2.js');
      expect(files).toContain('file3.json');
    });

    test('should traverse nested directories', async () => {
      await mkdir(join(tempDir, 'a/b/c'), { recursive: true });
      await writeFile(join(tempDir, 'root.ts'), 'root');
      await writeFile(join(tempDir, 'a/level1.ts'), 'level1');
      await writeFile(join(tempDir, 'a/b/level2.ts'), 'level2');
      await writeFile(join(tempDir, 'a/b/c/level3.ts'), 'level3');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      });

      expect(files).toHaveLength(4);
      expect(files).toContain('root.ts');
      expect(files).toContain('a/level1.ts');
      expect(files).toContain('a/b/level2.ts');
      expect(files).toContain('a/b/c/level3.ts');
    });

    test('should call onDir callback for directories', async () => {
      await mkdir(join(tempDir, 'subdir1'));
      await mkdir(join(tempDir, 'subdir2'));
      await writeFile(join(tempDir, 'subdir1/file.ts'), 'content');
      await writeFile(join(tempDir, 'subdir2/file.ts'), 'content');

      const dirs: string[] = [];
      await walkDir(
        tempDir,
        tempDir,
        [],
        async () => {},
        async (_, relPath) => {
          dirs.push(relPath);
        }
      );

      expect(dirs).toHaveLength(2);
      expect(dirs).toContain('subdir1');
      expect(dirs).toContain('subdir2');
    });
  });

  describe('ignore patterns', () => {
    test('should respect ignore patterns for files', async () => {
      await writeFile(join(tempDir, 'keep.ts'), 'keep');
      await writeFile(join(tempDir, 'ignore.log'), 'ignore');
      await writeFile(join(tempDir, 'also-ignore.log'), 'ignore');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, ['**/*.log'], async (_, relPath) => {
        files.push(relPath);
      });

      expect(files).toHaveLength(1);
      expect(files).toContain('keep.ts');
      expect(files).not.toContain('ignore.log');
    });

    test('should respect ignore patterns for directories', async () => {
      await mkdir(join(tempDir, 'node_modules/pkg'), { recursive: true });
      await mkdir(join(tempDir, 'src'));
      await writeFile(join(tempDir, 'node_modules/pkg/index.js'), 'module');
      await writeFile(join(tempDir, 'src/index.ts'), 'source');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, ['**/node_modules/**'], async (_, relPath) => {
        files.push(relPath);
      });

      expect(files).toHaveLength(1);
      expect(files).toContain('src/index.ts');
    });

    test('should handle multiple ignore patterns', async () => {
      await writeFile(join(tempDir, 'keep.ts'), 'keep');
      await writeFile(join(tempDir, 'ignore1.log'), 'log');
      await writeFile(join(tempDir, 'ignore2.tmp'), 'tmp');
      await writeFile(join(tempDir, 'ignore3.cache'), 'cache');

      const files: string[] = [];
      await walkDir(
        tempDir,
        tempDir,
        ['**/*.log', '**/*.tmp', '**/*.cache'],
        async (_, relPath) => {
          files.push(relPath);
        }
      );

      expect(files).toHaveLength(1);
      expect(files).toContain('keep.ts');
    });
  });

  describe('depth and position tracking', () => {
    test('should track depth correctly', async () => {
      await mkdir(join(tempDir, 'a/b'), { recursive: true });
      await writeFile(join(tempDir, 'root.ts'), 'root');
      await writeFile(join(tempDir, 'a/level1.ts'), 'level1');
      await writeFile(join(tempDir, 'a/b/level2.ts'), 'level2');

      const depths: Record<string, number> = {};
      await walkDir(tempDir, tempDir, [], async (_, relPath, depth) => {
        depths[relPath] = depth;
      });

      expect(depths['root.ts']).toBe(0);
      expect(depths['a/level1.ts']).toBe(1);
      expect(depths['a/b/level2.ts']).toBe(2);
    });

    test('should indicate isLast correctly', async () => {
      await writeFile(join(tempDir, 'a.ts'), 'a');
      await writeFile(join(tempDir, 'b.ts'), 'b');
      await writeFile(join(tempDir, 'c.ts'), 'c');

      const items: Array<{ path: string; isLast: boolean }> = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath, depth, isLast) => {
        items.push({ path: relPath, isLast });
      });

      const lastItems = items.filter((item) => item.isLast);
      expect(lastItems).toHaveLength(1);
    });

    test('should track depthOpen correctly for tree rendering', async () => {
      await mkdir(join(tempDir, 'a'));
      await mkdir(join(tempDir, 'b'));
      await writeFile(join(tempDir, 'a/file1.ts'), 'a1');
      await writeFile(join(tempDir, 'a/file2.ts'), 'a2');
      await writeFile(join(tempDir, 'b/file1.ts'), 'b1');

      const depthOpenStates: Array<Record<number, boolean>> = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath, depth, isLast, depthOpen) => {
        depthOpenStates.push({ ...depthOpen });
      });

      expect(depthOpenStates.length).toBeGreaterThan(0);
    });
  });

  describe('with real fixtures', () => {
    test('should traverse basic fixture', async () => {
      const fixturePath = getFixturePath('basic');
      const files: string[] = [];

      await walkDir(fixturePath, fixturePath, [], async (_, relPath) => {
        files.push(relPath);
      });

      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.endsWith('.ts'))).toBe(true);
      expect(files.some((f) => f.endsWith('.js'))).toBe(true);
    });

    test('should traverse nested fixture', async () => {
      const fixturePath = getFixturePath('nested');
      const files: string[] = [];

      await walkDir(fixturePath, fixturePath, [], async (_, relPath) => {
        files.push(relPath);
      });

      expect(files.some((f) => f.includes('level1'))).toBe(true);
      expect(files.some((f) => f.includes('level2'))).toBe(true);
      expect(files.some((f) => f.includes('level3'))).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should throw on non-existent directory', async () => {
      await expect(
        walkDir('/non/existent/path', '/non/existent/path', [], async () => {})
      ).rejects.toThrow();
    });
  });

  describe('empty directories', () => {
    test('should handle directory with no files', async () => {
      await mkdir(join(tempDir, 'empty'));

      const files: string[] = [];
      const dirs: string[] = [];

      await walkDir(
        tempDir,
        tempDir,
        [],
        async (_, relPath) => {
          files.push(relPath);
        },
        async (_, relPath) => {
          dirs.push(relPath);
        }
      );

      expect(files).toHaveLength(0);
      expect(dirs).toContain('empty');
    });
  });

  describe('sorting', () => {
    test('should sort files by name ascending', async () => {
      await writeFile(join(tempDir, 'zebra.ts'), 'z');
      await writeFile(join(tempDir, 'apple.ts'), 'a');
      await writeFile(join(tempDir, 'mango.ts'), 'm');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      }, undefined, 0, {}, { sort: 'name', sortDirection: 'asc' });

      expect(files).toEqual(['apple.ts', 'mango.ts', 'zebra.ts']);
    });

    test('should sort files by name descending', async () => {
      await writeFile(join(tempDir, 'zebra.ts'), 'z');
      await writeFile(join(tempDir, 'apple.ts'), 'a');
      await writeFile(join(tempDir, 'mango.ts'), 'm');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      }, undefined, 0, {}, { sort: 'name', sortDirection: 'desc' });

      expect(files).toEqual(['zebra.ts', 'mango.ts', 'apple.ts']);
    });

    test('should sort files by type (extension)', async () => {
      await writeFile(join(tempDir, 'script.ts'), 'ts');
      await writeFile(join(tempDir, 'style.css'), 'css');
      await writeFile(join(tempDir, 'data.json'), 'json');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      }, undefined, 0, {}, { sort: 'type', sortDirection: 'asc' });

      // .css < .json < .ts
      expect(files).toEqual(['style.css', 'data.json', 'script.ts']);
    });

    test('should sort files by size ascending', async () => {
      await writeFile(join(tempDir, 'large.ts'), 'x'.repeat(1000));
      await writeFile(join(tempDir, 'small.ts'), 'x');
      await writeFile(join(tempDir, 'medium.ts'), 'x'.repeat(100));

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      }, undefined, 0, {}, { sort: 'size', sortDirection: 'asc' });

      expect(files).toEqual(['small.ts', 'medium.ts', 'large.ts']);
    });

    test('should sort files by size descending', async () => {
      await writeFile(join(tempDir, 'large.ts'), 'x'.repeat(1000));
      await writeFile(join(tempDir, 'small.ts'), 'x');
      await writeFile(join(tempDir, 'medium.ts'), 'x'.repeat(100));

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      }, undefined, 0, {}, { sort: 'size', sortDirection: 'desc' });

      expect(files).toEqual(['large.ts', 'medium.ts', 'small.ts']);
    });

    test('should place directories before files', async () => {
      await mkdir(join(tempDir, 'zdir'));
      await writeFile(join(tempDir, 'afile.ts'), 'a');
      await writeFile(join(tempDir, 'zdir/inner.ts'), 'inner');

      const items: string[] = [];
      await walkDir(
        tempDir,
        tempDir,
        [],
        async (_, relPath) => {
          items.push(`file:${relPath}`);
        },
        async (_, relPath) => {
          items.push(`dir:${relPath}`);
        },
        0,
        {},
        { sort: 'name', sortDirection: 'asc' }
      );

      // Directory should come first even though 'zdir' > 'afile' alphabetically
      expect(items[0]).toBe('dir:zdir');
    });

    test('should sort nested directories independently', async () => {
      await mkdir(join(tempDir, 'subdir'));
      await writeFile(join(tempDir, 'subdir/z.ts'), 'z');
      await writeFile(join(tempDir, 'subdir/a.ts'), 'a');

      const files: string[] = [];
      await walkDir(tempDir, tempDir, [], async (_, relPath) => {
        files.push(relPath);
      }, undefined, 0, {}, { sort: 'name', sortDirection: 'asc' });

      expect(files).toEqual(['subdir/a.ts', 'subdir/z.ts']);
    });
  });
});
