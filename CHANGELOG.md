# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-18

### Added

- Initial release
- Tree view generation for directory structures with ASCII formatting
- File content extraction with automatic syntax highlighting
- Configurable ignore patterns using glob syntax (via minimatch)
- Multiple configuration file support:
  - `.code-atlas.json`
  - `.code-atlasrc`
  - `.code-atlasrc.json`
  - `code-atlas.config.json`
  - `code-atlas.config.js` (with dynamic configuration support)
  - `package.json` (code-atlas section)
- CLI with comprehensive options:
  - `-dir` - Directory to scan
  - `-output` - Output file name
  - `-ignore` - Ignore patterns
  - `-config` - Custom config file path
  - `-max-file-size` - File size limit
  - `-sort` - Sort method (name, size, modified, type)
  - `-included-paths-file` - Save included paths list
  - `-excluded-paths-file` - Save excluded paths list
- TypeScript type definitions for programmatic usage
- Custom file templates with `{{path}}`, `{{extension}}`, `{{content}}` variables
- File size limits with extension-based exceptions
- Custom headers for generated documentation
