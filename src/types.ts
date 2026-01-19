export interface ReposcopeConfig {
  /** Directory to scan */
  dir?: string;

  /** Output file name */
  output?: string;

  /** Patterns to ignore */
  ignore?: string[];

  /** File to save included paths */
  includedPathsFile?: string;

  /** File to save excluded paths */
  excludedPathsFile?: string;

  /** Custom header for the generated documentation */
  header?: string;

  /** Maximum file size to include (in bytes) */
  maxFileSize?: number;

  /** File extensions to always include regardless of size */
  alwaysIncludeExtensions?: string[];

  /** Custom template for file sections */
  fileTemplate?: string;

  /** Sort files and directories */
  sort?: 'name' | 'size' | 'modified' | 'type';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

export interface CLIArgs {
  /** Directory to scan */
  dir?: string;

  /** Output file name */
  output?: string;

  /** Comma-separated ignore patterns */
  ignore?: string;

  /** File to save included paths */
  includedPathsFile?: string;

  /** File to save excluded paths */
  excludedPathsFile?: string;

  /** Path to config file */
  config?: string;

  /** Maximum file size in bytes */
  maxFileSize?: string;

  /** Sort method */
  sort?: string;

  /** Show version flag */
  version?: boolean;

  /** Show help flag */
  help?: boolean;
}
