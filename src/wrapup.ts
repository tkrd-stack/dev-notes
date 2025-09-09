import { readFile, writeFile, appendFile } from 'fs/promises';
import { todayStr } from './lib/clock';
import { vaultPath } from './lib/fs';
import { fmBlock } from './lib/md';
import { askClaude } from './lib/ai';

async function safeRead(p: string) { try { return await readFile(p, 'utf8'); } catch { return ''; } }
async function safeAppend(p: string, s: string) { await appendFile(p, s, 'utf8'); }
async function safeWrite(p: string, s: string) { await writeFile(p, s, 'utf8'); }

/** 既に同じ行が含まれていなければ末尾に追記（idempotent） */
async function ensureLineContains(absPath: string, line: string) {
  const cur = await safeRead(absPath);
  if (!cur) {
    // 新規ファイルは frontmatter なしで素直に作る（wrap は集計ファイル生成が主目的のため）
    await safeWrite(absPath, `${line}\n`);
    return;
  }
  if (!cur.includes(line)) {
    await safeAppend(absPath, `\n${line}\n`);
  }
}

async function main() {
  const title = process.argv.slice(2).join(' ').trim() || '日次まとめ';
  const d = todayStr();

  const dailyRel = `daily/${d}.md`;
  const devlogRel = `dev-log/${d}.md`;
  const wrapRel = `daily/${d}__wrapup.md`;

  const dailyPath = vaultPath(dailyRel);
  const devlogPath = vaultPath(devlogRel);
  const wrapPath = vaultPath(wrapRel);

  // 素材読み込み
  const daily = await safeRead(dailyPath);
  const devlog = await safeRead(devlogPath);

  // 要約生成
  const system = `あなたはエンジニアの1日を要約するアシスタント。
- 見出し: 今日の要点 / 進捗 / 課題 / 次の一手
- 箇条書き中心、冗長禁止
- 末尾に「明日のTODO」3〜7件`;
  const user = `daily:\n${daily}\n\ndev-log:\n${devlog}`;

  const summary = await askClaude(system, user);

  // wrapupファイル（frontmatter付きで新規生成）
  const wrapFM = fmBlock({ date: d, tags: ['wrapup','summary'] });
  await safeWrite(wrapPath, `${wrapFM}# ${title}\n\n${summary}\n`);
  console.log(`✓ wrapup written: ${wrapRel}`);

  // ここで相互リンクを保証（重複追記なし）
  const linkFromDaily = `関連コミット: [[${devlogRel}]]`;
  const linkFromDevlog = `関連ノート: [[${dailyRel}]]`;

  await ensureLineContains(dailyPath, linkFromDaily);
  await ensureLineContains(devlogPath, linkFromDevlog);

  console.log(`✓ linked: ${dailyRel} ↔ ${devlogRel}`);
}

main().catch(e => {
  console.error('wrapup failed:', e);
  process.exit(1);
});
