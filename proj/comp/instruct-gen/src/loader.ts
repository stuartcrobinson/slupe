import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, '../templates/base-instructions.md');

export async function loadBaseInstructions(): Promise<string> {
  return readFile(TEMPLATE_PATH, 'utf8');
}