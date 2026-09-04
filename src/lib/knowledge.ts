import { access, writeFile, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { dirname } from 'path';
import { fmBlock } from './md';
import { vaultPath } from './fs';
import { todayStr } from './clock';

export interface KnowledgeEntry {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  body: string;
}

/** ファイル名に使えない文字を除去（Obsidian 用に日本語はそのまま残す） */
function toSafeName(title: string): string {
  const safe = title
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 80);
  return safe || 'untitled';
}

async function exists(absPath: string): Promise<boolean> {
  try {
    await access(absPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** 既存ファイルと衝突しない knowledge/<title>.md の相対パスを返す */
async function resolveRelPath(title: string): Promise<string> {
  const base = toSafeName(title);
  let rel = `knowledge/${base}.md`;
  let i = 2;
  while (await exists(vaultPath(rel))) {
    rel = `knowledge/${base}-${i}.md`;
    i += 1;
  }
  return rel;
}

/** ナレッジを 1 トピック 1 ファイルとして vault の knowledge/ に保存する */
export async function writeKnowledge(entry: KnowledgeEntry): Promise<string> {
  const rel = await resolveRelPath(entry.title);
  const abs = vaultPath(rel);
  await mkdir(dirname(abs), { recursive: true });

  const meta = {
    title: entry.title,
    type: 'knowledge',
    category: entry.category,
    created: todayStr(),
    tags: ['knowledge', ...entry.tags],
  };

  const content =
    `${fmBlock(meta)}# ${entry.title}\n\n` +
    `> ${entry.summary.trim()}\n\n` +
    `${entry.body.trim()}\n`;

  await writeFile(abs, content, 'utf8');
  return rel;
}
