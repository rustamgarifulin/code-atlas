# Reposcope
[![npm version](https://img.shields.io/npm/v/reposcope.svg)](https://www.npmjs.com/package/reposcope)
[![npm downloads](https://img.shields.io/npm/dm/reposcope.svg)](https://www.npmjs.com/package/reposcope)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript CLI tool for generating comprehensive codebase documentation with tree view and file contents.

## Features

- **Tree View Generation**: Creates a visual directory structure
- **File Content Extraction**: Includes actual file contents with syntax highlighting
- **Smart Filtering**: Configurable ignore patterns using glob syntax
- **Path Tracking**: Optional included/excluded paths reporting
- **Fast & Efficient**: Built with TypeScript and optimized for large codebases
- **Configuration Files**: Support for JSON and JS config files
- **File Size Limits**: Control maximum file size with exceptions for specific extensions
- **Custom Templates**: Customizable file section templates

## Installation

### Global Installation (Recommended)
```bash
npm install -g reposcope
```

### Local Installation
```bash
npm install reposcope
```

## Usage

### Command Line Interface

```bash
# Scan current directory (requires config file or -dir argument)
reposcope -dir=.

# Scan specific directory
reposcope -dir=./src -output=documentation.md

# With custom ignore patterns
reposcope -ignore="**/*.log,**/node_modules/**,**/.git/**"

# Save path reports
reposcope -included-paths-file=included.txt -excluded-paths-file=excluded.txt
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-dir=<path>` | Directory to scan | `.` (current directory) |
| `-output=<file>` | Output markdown file | `codebase.md` |
| `-ignore=<patterns>` | Comma-separated glob patterns to ignore | `\\.git.*` |
| `-included-paths-file=<file>` | File to save included paths | - |
| `-excluded-paths-file=<file>` | File to save excluded paths | - |
| `-config=<file>` | Path to config file | Auto-detected |
| `-max-file-size=<bytes>` | Maximum file size to include | No limit |
| `-sort=<method>` | Sort method: name, size, modified, type | `name` |
| `-version` | Show version | - |
| `-help` | Show help message | - |

## Configuration Files

Reposcope supports configuration files for easier management of complex setups. The tool will automatically look for config files in this order:

1. `.reposcope.json`
2. `.reposcoperc`
3. `.reposcoperc.json`
4. `reposcope.config.json`
5. `reposcope.config.js`
6. `package.json` (reposcope section)

### JSON Configuration Example

```json
{
  "dir": "./src",
  "output": "project-docs.md",
  "ignore": [
    "**/node_modules/**",
    "**/.git/**",
    "**/*.log",
    "**/*.test.{js,ts}"
  ],
  "maxFileSize": 1048576,
  "alwaysIncludeExtensions": ["md", "json"],
  "header": "# My Project Documentation\n\n",
  "fileTemplate": "### 📄 {{path}}\n\n```{{extension}}\n{{content}}\n```\n\n",
  "sort": "name"
}
```

### JavaScript Configuration Example

```javascript
// reposcope.config.js
export default {
  dir: './src',
  output: 'docs.md',
  ignore: [
    '**/node_modules/**',
    '**/*.test.{js,ts}',
    // Dynamic patterns based on environment
    ...(process.env.NODE_ENV === 'production' ? ['**/dev-**'] : [])
  ],
  header: `# Documentation\n\nGenerated: ${new Date().toISOString()}\n\n`,
  maxFileSize: 512 * 1024, // 512KB
  alwaysIncludeExtensions: ['md', 'json'],
  sort: 'type'
};
```

### Package.json Configuration

```json
{
  "name": "my-project",
  "reposcope": {
    "dir": "./src",
    "ignore": ["**/*.test.js"],
    "output": "api-docs.md"
  }
}
```

### Programmatic Usage

```typescript
import { walkDir, writeFileContent } from 'reposcope';

// Custom file processing
await walkDir(
  './src',
  './src',
  ['**/*.test.ts', '**/node_modules/**'],
  async (filePath, relPath, depth, isLast, depthOpen) => {
    console.log(`File: ${relPath}`);
  },
  async (dirPath, relPath, depth, isLast, depthOpen) => {
    console.log(`Directory: ${relPath}`);
  }
);
```

## Examples

### Basic Documentation Generation
```bash
reposcope -dir=./my-project -output=project-docs.md
```

### Using Configuration File
```bash
# Uses auto-detected config file
reposcope

# Use specific config file
reposcope -config=./my-config.json
```

### Advanced CLI Usage
```bash
# Limit file size and sort by type
reposcope -dir=./src -max-file-size=1048576 -sort=type

# Complex ignore patterns
reposcope -dir=. -ignore="**/node_modules/**,**/.git/**,**/*.log,**/*.ico,**/*.png"
```

### TypeScript Project Documentation
```bash
reposcope -dir=./src -output=api-docs.md -ignore="**/*.test.ts,**/*.spec.ts,**/__mocks__/**"
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `dir` | string | Directory to scan |
| `output` | string | Output file name |
| `ignore` | string[] | Array of glob patterns to ignore |
| `includedPathsFile` | string | File to save included paths |
| `excludedPathsFile` | string | File to save excluded paths |
| `header` | string | Custom header for documentation |
| `maxFileSize` | number | Maximum file size in bytes |
| `alwaysIncludeExtensions` | string[] | Extensions to always include |
| `fileTemplate` | string | Custom template for file sections |
| `sort` | string | Sort method: name, size, modified, type |
| `sortDirection` | string | Sort direction: asc, desc |

### Template Variables

When using `fileTemplate`, you can use these variables:
- `{{path}}` - Relative file path
- `{{extension}}` - File extension
- `{{content}}` - File content

## Output Format

The generated markdown file includes:

1. **Custom Header** (if configured)
2. **Tree View**: Visual directory structure
```
├─src/
│  ├─components/
│  │  └─Button.tsx
│  ├─utils/
│  │  └─helpers.ts
│  └─main.ts
```

3. **File Contents**: Syntax-highlighted code blocks
```typescript
// Content of each file with proper syntax highlighting
export function helper() {
  return "Hello World";
}
```

## Ignore Patterns

Reposcope uses [minimatch](https://github.com/isaacs/minimatch) for pattern matching. Common patterns:

- `**/*.log` - All .log files
- `**/node_modules/**` - Node modules directory
- `**/.git/**` - Git directory
- `*.{png,jpg,ico}` - Image files
- `test/**` - Test directories

## Requirements

- Node.js >= 18.0.0
- TypeScript support (for development)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Tree view generation
- File content extraction
- Configurable ignore patterns
- Path tracking features
