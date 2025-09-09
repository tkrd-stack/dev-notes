import 'dotenv/config';
import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import { dirname } from 'path';

const VAULT = process.env.VAULT_PATH!;

async function ensureDir(p: string) {
  try { await access(p, constants.F_OK); } catch { await mkdir(p, { recursive: true }); }
}

export async function appendToFile(absPath: string, content: string) {
  await ensureDir(dirname(absPath));
  let prev = '';
  try { prev = await readFile(absPath, 'utf8'); } catch {}
  await writeFile(absPath, prev ? `${prev}\n${content}\n` : `${content}\n`, 'utf8');
}

export function vaultPath(rel: string) {
  return `${VAULT.replace(/\/$/, '')}/${rel.replace(/^\//, '')}`;
}
