#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { walkDir, writeFileContent } from './utils.js';
import { basename } from 'node:path';
import { appendToFile } from './utils.js';
import { loadConfig, mergeConfigWithArgs, validateConfig } from './config.js';
import type { CLIArgs, CodeAtlasConfig } from './types.js';

// Application version
const VERSION = 'v1.0.0';

// Parse command line arguments
const args = process.argv.slice(2);
const flags: CLIArgs = {
  dir: args.find(arg => arg.startsWith('-dir='))?.split('=')[1],
  output: args.find(arg => arg.startsWith('-output='))?.split('=')[1],
  ignore: args.find(arg => arg.startsWith('-ignore='))?.split('=')[1],
  includedPathsFile: args.find(arg => arg.startsWith('-included-paths-file='))?.split('=')[1],
  excludedPathsFile: args.find(arg => arg.startsWith('-excluded-paths-file='))?.split('=')[1],
  config: args.find(arg => arg.startsWith('-config='))?.split('=')[1],
  maxFileSize: args.find(arg => arg.startsWith('-max-file-size='))?.split('=')[1],
  sort: args.find(arg => arg.startsWith('-sort='))?.split('=')[1],
  version: args.includes('-version'),
  help: args.includes('-help')
};

// Print version
if (flags.version) {
  console.log(VERSION);
  process.exit(0);
}

// Print help
if (flags.help || args.length === 0) {
  console.log(`
Code Atlas - Generate codebase documentation with tree view and file contents

Usage: code-atlas [options]

Options:
  -dir=<path>                  Directory to scan (default: ".")
  -output=<file>               Output file name (default: "codebase.md")
  -ignore=<patterns>           Comma-separated list of patterns to ignore (default: "\\.git.*")
  -included-paths-file=<file>  File to save included paths
  -excluded-paths-file=<file>  File to save excluded paths
  -config=<file>               Path to config file
  -max-file-size=<bytes>       Maximum file size to include (default: no limit)
  -sort=<method>               Sort method: name, size, modified, type (default: name)
  -version                     Show version and exit
  -help                        Show help message and exit

Config Files:
  Code Atlas will automatically look for config files in this order:
  - .code-atlas.json
  - .code-atlasrc
  - .code-atlasrc.json  
  - code-atlas.config.json
  - code-atlas.config.js
  - package.json (code-atlas section)

Examples:
  code-atlas -dir=./src -output=docs.md
  code-atlas -ignore="**/*.log,**/node_modules/**"
  code-atlas -config=my-config.json
  code-atlas -max-file-size=1048576 -sort=size
  `);
  process.exit(0);
}

// Main logic
async function main() {
  try {
    // Load configuration
    const config = await loadConfig(flags.config);

    // Merge config with CLI arguments (CLI takes priority)
    const finalConfig = mergeConfigWithArgs(config, flags);

    // Set default values
    const options: Required<Pick<CodeAtlasConfig, 'dir' | 'output' | 'ignore'>> & CodeAtlasConfig = {
      dir: finalConfig.dir || '.',
      output: finalConfig.output || 'codebase.md',
      ignore: finalConfig.ignore || ['\\.git.*'],
      ...finalConfig
    };

    // Validate configuration
    validateConfig(options);

    console.log(`📁 Scanning directory: ${options.dir}`);
    console.log(`📄 Output file: ${options.output}`);
    if (options.ignore.length > 0) {
      console.log(`🚫 Ignore patterns: ${options.ignore.join(', ')}`);
    }

    // Create file header
    const header = options.header || '# Code Atlas Documentation\n\nGenerated with Code Atlas\n\n';
    writeFileSync(options.output, header + '## Tree View:\n```\n', 'utf-8');

    // Recursively walk directory and write tree
    await walkDir(
      options.dir,
      options.dir,
      options.ignore,
      async (filePath, relPath, depth, isLast, depthOpen) => {
        const indent = buildIndent(depth, depthOpen);
        const pipe = isLast ? '└─' : '├─';
        appendToFile(options.output, `${indent}${pipe}${basename(relPath)}\n`);
      },
      async (dirPath, relPath, depth, isLast, depthOpen) => {
        const indent = buildIndent(depth, depthOpen);
        const pipe = isLast ? '└─' : '├─';
        appendToFile(options.output, `${indent}${pipe}${basename(relPath)}/\n`);
      },
      0
    );

    appendToFile(options.output, '```\n\n## Content:\n');

    const { includedPaths, excludedPaths } = await writeFileContent(options);

    console.log('✅ Codebase documentation generated successfully!');
    console.log(`📊 Included paths: ${includedPaths.length}`);
    console.log(`🚫 Excluded paths: ${excludedPaths.length}`);

  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Function to build indentation with vertical lines
function buildIndent(depth: number, depthOpen: Record<number, boolean>): string {
  let indent = '';
  for (let i = 0; i < depth; i++) {
    indent += depthOpen[i] ? '│  ' : '   ';
  }
  return indent;
}

// Error handling
main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

// Export for use as a module
export { walkDir, writeFileContent } from './utils.js';
