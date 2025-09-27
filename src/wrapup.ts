import { readFile, writeFile, appendFile, readdir } from 'fs/promises';
import { todayStr } from './lib/clock';
import { vaultPath } from './lib/fs';
import { fmBlock } from './lib/md';
import { askClaude } from './lib/ai';

async function safeRead(p: string) { try { return await readFile(p, 'utf8'); } catch { return ''; } }
async function safeAppend(p: string, s: string) { await appendFile(p, s, 'utf8'); }
async function safeWrite(p: string, s: string) { await writeFile(p, s, 'utf8'); }

/** 既に同じ行が含まれていなければ末尾に追記（idempotent） */
async function ensureLineContains(absPath: string, line: string, opts?: { createIfMissing?: boolean }) {
  const createIfMissing = opts?.createIfMissing ?? true;
  const cur = await safeRead(absPath);
  if (!cur) {
    if (!createIfMissing) return;
    // 新規ファイルは frontmatter なしで素直に作る（wrap は集計ファイル生成が主目的のため）
    await safeWrite(absPath, `${line}\n`);
    return;
  }
  if (!cur.includes(line)) {
    await safeAppend(absPath, `\n${line}\n`);
  }
}

function shiftDate(date: string, diff: number) {
  const base = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) throw new Error(`Invalid date: ${date}`);
  base.setUTCDate(base.getUTCDate() + diff);
  return base.toISOString().slice(0, 10);
}

function compareDate(a: string, b: string) {
  return a.localeCompare(b);
}

async function wrapHasSummary(date: string) {
  const rel = `daily/${date}__wrapup.md`;
  const content = await safeRead(vaultPath(rel));
  if (!content) return false;
  const body = content.replace(/^---[\s\S]*?---\s*/, '').trim();
  if (!body) return false;
  return body.includes('今日の要点') || body.includes('明日のTODO');
}

async function hasNoteForDate(date: string) {
  const rel = `dev-note/${date}.md`;
  const content = await safeRead(vaultPath(rel));
  if (!content) return false;
  const body = content.replace(/^---[\s\S]*?---\s*/, '').trim();
  return body.length > 0;
}

async function findLastWrapDate(targetDate: string) {
  try {
    const dailyDir = vaultPath('daily');
    const entries = await readdir(dailyDir);
    const dates = entries
      .map(name => name.match(/^(\d{4}-\d{2}-\d{2})__wrapup\.md$/)?.[1])
      .filter((d): d is string => Boolean(d))
      .filter(d => compareDate(d, targetDate) <= 0)
      .sort();
    for (let i = dates.length - 1; i >= 0; i -= 1) {
      if (await wrapHasSummary(dates[i])) return dates[i];
    }
    return null;
  } catch {
    return null;
  }
}

function collectDatesToWrap(lastWrapDate: string | null, targetDate: string) {
  const start = lastWrapDate ? shiftDate(lastWrapDate, 1) : targetDate;
  if (compareDate(start, targetDate) > 0) return [] as string[];

  const dates: string[] = [];
  let current = start;
  while (compareDate(current, targetDate) <= 0) {
    dates.push(current);
    current = shiftDate(current, 1);
  }
  return dates;
}

async function createWrapForDate(d: string, title: string) {
  const dailyRel = `daily/${d}.md`;
  const noteRel = `dev-note/${d}.md`;
  const wrapRel = `daily/${d}__wrapup.md`;

  const dailyPath = vaultPath(dailyRel);
  const notePath = vaultPath(noteRel);
  const wrapPath = vaultPath(wrapRel);

  const note = await safeRead(notePath);
  const daily = await safeRead(dailyPath);

  const system = `あなたはエンジニアの1日を要約するアシスタント。
- 見出し: 今日の要点 / 進捗 / 課題 / 次の一手
- 箇条書き中心、冗長禁止
- 末尾に「明日のTODO」3〜7件`;
  const user = `dev-note:\n${note}\n\ndaily:\n${daily}`;

  const summary = await askClaude(system, user);

  const wrapFM = fmBlock({ date: d, tags: ['wrapup','summary'] });
  await safeWrite(wrapPath, `${wrapFM}# ${title}\n\n${summary}\n`);
  console.log(`✓ wrapup written: ${wrapRel}`);

  const linkFromNote = `関連まとめ: [[${wrapRel}]]`;

  await ensureLineContains(notePath, linkFromNote, { createIfMissing: false });

  console.log(`✓ linked: ${wrapRel} ↔ ${noteRel}`);
}

async function main() {
  const title = process.argv.slice(2).join(' ').trim() || '日次まとめ';
  const today = todayStr();
  const targetDate = shiftDate(today, -1);
  const lastWrapDate = await findLastWrapDate(targetDate);
  const datesToCheck = collectDatesToWrap(lastWrapDate, targetDate);
  const dates: string[] = [];
  for (const date of datesToCheck) {
    if (await hasNoteForDate(date)) {
      dates.push(date);
    } else {
      console.log(`skip ${date}: no note entries`);
    }
  }

  if (!dates.length) {
    console.log('✓ wrapup up-to-date: nothing to do.');
    return;
  }

  console.log(`wrapup target dates: ${dates.join(', ')}`);

  for (const date of dates) {
    await createWrapForDate(date, title);
  }
}

main().catch(e => {
  console.error('wrapup failed:', e);
  process.exit(1);
});
