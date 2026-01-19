import { existsSync, mkdirSync, writeFileSync, Dirent } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { dirname, extname, join, relative } from 'path';
import { minimatch } from 'minimatch';
import type { CodeAtlasConfig } from './types.js';

export function shouldIgnore(path: string, ignorePatterns: string[]): boolean {
  if (path === '.') return true;
  return ignorePatterns.some(pattern => minimatch(path, pattern, { dot: true }));
}

// Compare function that always places directories before files
function directoriesFirst(a: Dirent, b: Dirent): number | null {
  if (a.isDirectory() !== b.isDirectory()) {
    return a.isDirectory() ? -1 : 1;
  }
  return null; // Both are same type, need further comparison
}

// Sort entries based on sort method and direction
async function sortEntries(
  entries: Dirent[],
  dirPath: string,
  sort: CodeAtlasConfig['sort'] = 'name',
  sortDirection: CodeAtlasConfig['sortDirection'] = 'asc'
): Promise<Dirent[]> {
  const multiplier = sortDirection === 'asc' ? 1 : -1;

  // For size/modified sorting, we need file stats
  if (sort === 'size' || sort === 'modified') {
    const entriesWithStats = await Promise.all(
      entries.map(async (entry) => ({
        entry,
        stats: await stat(join(dirPath, entry.name))
      }))
    );

    return entriesWithStats
      .sort((a, b) => {
        const dirCompare = directoriesFirst(a.entry, b.entry);
        if (dirCompare !== null) return dirCompare;

        const value = sort === 'size'
          ? a.stats.size - b.stats.size
          : a.stats.mtimeMs - b.stats.mtimeMs;
        return multiplier * value;
      })
      .map(e => e.entry);
  }

  // For name/type sorting, no stats needed
  return [...entries].sort((a, b) => {
    const dirCompare = directoriesFirst(a, b);
    if (dirCompare !== null) return dirCompare;

    // Both directories - sort by name
    if (a.isDirectory()) {
      return multiplier * a.name.localeCompare(b.name);
    }

    // Both files
    if (sort === 'type') {
      const extA = extname(a.name).toLowerCase();
      const extB = extname(b.name).toLowerCase();
      if (extA !== extB) {
        return multiplier * extA.localeCompare(extB);
      }
    }

    return multiplier * a.name.localeCompare(b.name);
  });
}

// Recursive function for directory traversal
export async function walkDir(
  dirPath: string,
  rootDir: string, // Root directory, relative to which relPath is calculated
  ignorePatterns: string[],
  onFile: (
    filePath: string,
    relPath: string,
    depth: number,
    isLast: boolean,
    depthOpen: Record<number, boolean>
  ) => Promise<void>,
  onDir?: (
    dirPath: string,
    relPath: string,
    depth: number,
    isLast: boolean,
    depthOpen: Record<number, boolean>
  ) => Promise<void>,
  depth: number = 0,
  depthOpen: Record<number, boolean> = {},
  options: Pick<CodeAtlasConfig, 'sort' | 'sortDirection'> = {}
): Promise<void> {
  const { sort, sortDirection } = options;

  const entries = await readdir(dirPath, { withFileTypes: true });
  const filteredEntries = entries.filter(entry =>
    !shouldIgnore(join(dirPath, entry.name), ignorePatterns)
  );

  // Sort entries based on sort options
  const sortedEntries = await sortEntries(filteredEntries, dirPath, sort, sortDirection);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const fullPath = join(dirPath, entry.name);
    const relPath = relative(rootDir, fullPath); // Calculate relative path

    const isLast = i === sortedEntries.length - 1; // Check if the element is last

    if (entry.isDirectory()) {
      if (onDir) {
        await onDir(fullPath, relPath, depth, isLast, depthOpen);
      }
      depthOpen[depth] = !isLast; // Open level if this is not the last element
      await walkDir(fullPath, rootDir, ignorePatterns, onFile, onDir, depth + 1, depthOpen, options);
      depthOpen[depth] = false; // Close level after traversal is complete
    } else {
      await onFile(fullPath, relPath, depth, isLast, depthOpen);
    }
  }
}

export async function writeFileContent(
  options: CodeAtlasConfig
): Promise<{ includedPaths: string[]; excludedPaths: string[] }> {
  const includedPaths: string[] = [];
  const excludedPaths: string[] = [];

  const {
    dir = '.',
    output = 'codebase.md',
    includedPathsFile,
    excludedPathsFile,
    ignore = [],
    maxFileSize,
    alwaysIncludeExtensions = [],
    fileTemplate,
    sort,
    sortDirection
  } = options;

  await walkDir(
    dir,
    dir, // Pass root directory as rootDir
    ignore,
    async (filePath, relPath) => {
      const extension = extname(filePath).slice(1).toLowerCase();

      // Check file size limit
      if (maxFileSize !== undefined) {
        const fileStat = await stat(filePath);
        const shouldAlwaysInclude = alwaysIncludeExtensions.some(
          ext => ext.toLowerCase().replace(/^\./, '') === extension
        );

        if (fileStat.size > maxFileSize && !shouldAlwaysInclude) {
          excludedPaths.push(relPath);
          return;
        }
      }

      includedPaths.push(relPath);

      const content = await readFile(filePath, 'utf-8');

      // Use custom template or default format
      if (fileTemplate) {
        const formattedContent = fileTemplate
          .replace(/\{\{path\}\}/g, relPath)
          .replace(/\{\{extension\}\}/g, extension)
          .replace(/\{\{content\}\}/g, content);
        appendToFile(output, formattedContent + '\n\n');
      } else {
        appendToFile(output, `## ${relPath}\n`);
        appendToFile(output, `\`\`\`${extension}\n${content}\n\`\`\`\n\n`);
      }
    },
    undefined,
    0,
    {},
    { sort, sortDirection }
  );

  if (includedPathsFile) {
    writeFileSync(includedPathsFile, includedPaths.join('\n'), 'utf-8');
  }
  if (excludedPathsFile) {
    writeFileSync(excludedPathsFile, excludedPaths.join('\n'), 'utf-8');
  }

  return { includedPaths, excludedPaths };
}

export function appendToFile(filePath: string, data: string): void {
  const dir = dirname(filePath);
  if (dir && dir !== '.' && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, data, { flag: 'a' });
}
