import { readFile, writeFile, appendFile } from 'fs/promises';
import { fmBlock } from './md';
import { vaultPath } from './fs';

export async function appendNote(relPath: string, content: string, meta: Record<string, any>) {
  const absPath = vaultPath(relPath);
  let existing = '';

  try {
    existing = await readFile(absPath, 'utf8');
  } catch {
    // ファイルがなければ新規扱い
  }

  if (existing.trim().startsWith('---')) {
    // 既に frontmatter がある場合 → 本文だけ追記
    await appendFile(absPath, `\n${content}\n`);
  } else {
    // frontmatter が無い場合 → 最初に frontmatter を付ける
    const block = fmBlock(meta) + content + '\n';
    await writeFile(absPath, block, 'utf8');
  }
}
