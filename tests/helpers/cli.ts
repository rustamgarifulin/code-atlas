import { spawn } from 'child_process';
import { resolve } from 'path';

export interface CLIResult {
  code: number;
  stdout: string;
  stderr: string;
}

export async function runCLI(args: string[], cwd?: string): Promise<CLIResult> {
  return new Promise((resolve) => {
    const mainScript = './dist/main.js';
    const proc = spawn('node', [mainScript, ...args], {
      cwd: cwd || process.cwd(),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        code: code || 0,
        stdout,
        stderr
      });
    });

    proc.on('error', (err) => {
      resolve({
        code: 1,
        stdout,
        stderr: err.message
      });
    });
  });
}
