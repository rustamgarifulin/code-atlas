import { mkdtemp, rm, cp } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const FIXTURES_PATH = join(__dirname, '..', 'fixtures');

export function getFixturePath(name: string): string {
  return join(FIXTURES_PATH, name);
}

export async function createTempDir(prefix = 'reposcope-test-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function copyFixtureToTemp(fixtureName: string): Promise<string> {
  const tempDir = await createTempDir();
  const fixturePath = getFixturePath(fixtureName);
  await cp(fixturePath, tempDir, { recursive: true });
  return tempDir;
}

export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}
