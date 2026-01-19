// code-atlas.config.js
export default {
  dir: './src',
  output: 'documentation.md',

  // Dynamic ignore patterns
  ignore: [
    '**/node_modules/**',
    '**/.git/**',
    '**/*.log',
    '**/*.test.{js,ts}',
    '**/*.spec.{js,ts}',
    '**/coverage/**',
    // Conditionally ignore files based on environment
    ...(process.env.NODE_ENV === 'production' ? ['**/dev-**'] : []),
    // Ignore large data files
    '**/*.{csv,xlsx,json}',
    // Ignore media files
    '**/*.{png,jpg,jpeg,gif,svg,ico,webp,mp4,avi,mov}'
  ],

  // Header with dynamic information
  header: `# Project Documentation

Generated on: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}

## Overview
This is the complete documentation of our codebase.

`,

  // Maximum file size: 500KB
  maxFileSize: 512 * 1024,

  // Always include configuration files
  alwaysIncludeExtensions: ['json', 'md', 'yml', 'yaml', 'env'],

  // Custom file template
  fileTemplate: `
## 📁 {{path}}

\`\`\`{{extension}}
{{content}}
\`\`\`

**File Info:**
- Extension: .{{extension}}
- Size: Dynamic (to be calculated)

---

`,

  sort: 'type',
  sortDirection: 'asc'
};
