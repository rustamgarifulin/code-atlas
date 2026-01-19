# Configuration Examples

This document provides various configuration examples for different use cases.

## Basic Configurations

### Minimal Configuration
```json
{
  "dir": "./src",
  "output": "docs.md"
}
```

### Standard Web Project
```json
{
  "dir": "./",
  "output": "project-documentation.md",
  "ignore": [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/*.log",
    "**/.DS_Store"
  ],
  "maxFileSize": 1048576,
  "sort": "name"
}
```

## Advanced Configurations

### Full-Featured Configuration
```json
{
  "dir": "./src",
  "output": "complete-docs.md",
  "ignore": [
    "**/node_modules/**",
    "**/.git/**",
    "**/*.log",
    "**/*.test.{js,ts,jsx,tsx}",
    "**/*.spec.{js,ts,jsx,tsx}",
    "**/coverage/**",
    "**/dist/**",
    "**/build/**",
    "**/.cache/**",
    "**/*.{ico,png,jpg,jpeg,gif,svg,webp}",
    "**/package-lock.json",
    "**/yarn.lock"
  ],
  "includedPathsFile": "included-files.txt",
  "excludedPathsFile": "excluded-files.txt",
  "header": "# 📚 Project Documentation\n\n> Generated automatically with Code Atlas\n\n## 📋 Table of Contents\n\n- [Tree View](#tree-view)\n- [Source Code](#content)\n\n",
  "maxFileSize": 2097152,
  "alwaysIncludeExtensions": ["md", "txt", "json", "yml", "yaml"],
  "fileTemplate": "### 📄 `{{path}}`\n\n```{{extension}}\n{{content}}\n```\n\n---\n\n",
  "sort": "type",
  "sortDirection": "asc"
}
```

### React/Next.js Project
```json
{
  "dir": "./",
  "output": "react-docs.md",
  "ignore": [
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/.git/**",
    "**/public/icons/**",
    "**/public/images/**",
    "**/*.test.{js,jsx,ts,tsx}",
    "**/__tests__/**",
    "**/coverage/**",
    "**/*.log",
    "**/package-lock.json"
  ],
  "header": "# React Application Documentation\n\n## Project Structure\n\nThis document contains the complete source code of our React application.\n\n",
  "maxFileSize": 1048576,
  "alwaysIncludeExtensions": ["json", "md", "env"],
  "fileTemplate": "## 🔗 {{path}}\n\n```{{extension}}\n{{content}}\n```\n\n",
  "sort": "name"
}
```

### TypeScript Library
```json
{
  "dir": "./src",
  "output": "library-docs.md",
  "ignore": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**",
    "**/tests/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**"
  ],
  "header": "# TypeScript Library Documentation\n\n## API Reference\n\nComplete source code documentation for the library.\n\n",
  "maxFileSize": 512000,
  "sort": "type",
  "fileTemplate": "### 📘 {{path}}\n\n> File type: `.{{extension}}`\n\n```{{extension}}\n{{content}}\n```\n\n---\n\n"
}
```

## JavaScript Configurations

### Dynamic Configuration
```javascript
// code-atlas.config.js
import { existsSync } from 'fs';
import { join } from 'path';

const isTypeScriptProject = existsSync('tsconfig.json');
const isReactProject = existsSync(join('src', 'App.jsx')) || existsSync(join('src', 'App.tsx'));

export default {
  dir: './src',
  output: `${isTypeScriptProject ? 'ts' : 'js'}-documentation.md`,
  
  ignore: [
    '**/node_modules/**',
    '**/.git/**',
    ...(isTypeScriptProject ? ['**/*.js.map'] : []),
    ...(isReactProject ? ['**/public/**'] : []),
    '**/*.{test,spec}.{js,ts,jsx,tsx}',
    '**/coverage/**'
  ],

  header: `# ${isTypeScriptProject ? 'TypeScript' : 'JavaScript'} Project Documentation\n\nGenerated on: ${new Date().toLocaleDateString()}\nProject Type: ${isReactProject ? 'React' : 'Standard'}\n\n`,

  maxFileSize: isTypeScriptProject ? 1048576 : 524288,
  alwaysIncludeExtensions: ['json', 'md'],
  sort: 'type'
};
```

### Environment-Based Configuration
```javascript
// code-atlas.config.js
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

export default {
  dir: './src',
  output: isDev ? 'dev-docs.md' : 'production-docs.md',
  
  ignore: [
    '**/node_modules/**',
    '**/.git/**',
    // Include test files only in development
    ...(isProd ? ['**/*.{test,spec}.*', '**/test/**', '**/__tests__/**'] : []),
    // Exclude dev tools in production
    ...(isProd ? ['**/dev-tools/**', '**/debug/**'] : [])
  ],

  header: `# ${isProd ? 'Production' : 'Development'} Documentation\n\nEnvironment: ${process.env.NODE_ENV}\nGenerated: ${new Date().toISOString()}\n\n`,

  maxFileSize: isProd ? 2097152 : 1048576,
  sort: isDev ? 'modified' : 'name'
};
```

## Package.json Integration

### Simple Integration
```json
{
  "name": "my-project",
  "scripts": {
    "docs": "code-atlas",
    "docs:full": "code-atlas -config=full-config.json"
  },
  "code-atlas": {
    "dir": "./src",
    "ignore": ["**/*.test.js"],
    "output": "quick-docs.md"
  }
}
```

### Multiple Configurations
```json
{
  "name": "my-project",
  "scripts": {
    "docs": "code-atlas",
    "docs:api": "code-atlas -config=api-config.json",
    "docs:full": "code-atlas -config=full-config.json",
    "docs:prod": "NODE_ENV=production code-atlas"
  },
  "code-atlas": {
    "dir": "./src",
    "output": "docs.md",
    "ignore": ["**/*.test.*", "**/node_modules/**"]
  }
}
```

## Custom Templates

### Detailed Template
```json
{
  "fileTemplate": "## 📄 {{path}}\n\n**File Information:**\n- Extension: `.{{extension}}`\n- Type: Source Code\n- Last Modified: *Dynamic*\n\n### Code:\n\n```{{extension}}\n{{content}}\n```\n\n### Analysis:\n- Lines: *To be calculated*\n- Size: *To be calculated*\n\n---\n\n"
}
```

### Minimal Template
```json
{
  "fileTemplate": "#### {{path}}\n```{{extension}}\n{{content}}\n```\n\n"
}
```

### Documentation-Style Template
```json
{
  "fileTemplate": "# {{path}}\n\n> Source file: `{{path}}`\n\n```{{extension}}\n{{content}}\n```\n\n**[⬆ Back to top](#table-of-contents)**\n\n---\n\n"
}
```

## Use Case Specific Configurations

### Monorepo Configuration
```json
{
  "dir": "./packages",
  "output": "monorepo-docs.md",
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**"
  ],
  "header": "# Monorepo Documentation\n\n## Packages Overview\n\nThis documentation covers all packages in the monorepo.\n\n",
  "sort": "name",
  "fileTemplate": "### 📦 {{path}}\n\n```{{extension}}\n{{content}}\n```\n\n"
}
```

### Documentation Only
```json
{
  "dir": "./",
  "output": "docs-only.md",
  "ignore": [
    "**/*",
    "!**/*.md",
    "!**/*.txt",
    "**/node_modules/**"
  ],
  "header": "# Documentation Files\n\n",
  "sort": "name"
}
```

### Configuration Files Only
```json
{
  "dir": "./",
  "output": "config-docs.md",
  "ignore": [
    "**/*",
    "!**/*.json",
    "!**/*.yml",
    "!**/*.yaml",
    "!**/*.toml",
    "!**/*.ini",
    "!**/.*rc",
    "!**/*.config.{js,ts}",
    "**/node_modules/**",
    "**/package-lock.json"
  ],
  "header": "# Configuration Files\n\n",
  "sort": "type"
}
```
