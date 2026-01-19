import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { dirname, extname, join, relative } from 'path';
import { minimatch } from 'minimatch';
import type { CodeAtlasConfig } from './types.js';

export function shouldIgnore(path: string, ignorePatterns: string[]): boolean {
  if (path === '.') return true;
  return ignorePatterns.some(pattern => minimatch(path, pattern, { dot: true }));
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
  depthOpen: Record<number, boolean> = {}
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const filteredEntries = entries.filter(entry =>
    !shouldIgnore(join(dirPath, entry.name), ignorePatterns)
  );

  for (let i = 0; i < filteredEntries.length; i++) {
    const entry = filteredEntries[i];
    const fullPath = join(dirPath, entry.name);
    const relPath = relative(rootDir, fullPath); // Calculate relative path

    const isLast = i === filteredEntries.length - 1; // Check if the element is last

    if (entry.isDirectory()) {
      if (onDir) {
        await onDir(fullPath, relPath, depth, isLast, depthOpen);
      }
      depthOpen[depth] = !isLast; // Open level if this is not the last element
      await walkDir(fullPath, rootDir, ignorePatterns, onFile, onDir, depth + 1, depthOpen);
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
    fileTemplate
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
    undefined
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
