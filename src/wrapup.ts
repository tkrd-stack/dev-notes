import { readFile } from 'fs/promises';
import { appendToFile, vaultPath } from './lib/fs';
import { fmBlock } from './lib/md';
import { todayStr } from './lib/clock';
import { askClaude } from './lib/ai';

async function main() {
  const title = process.argv.slice(2).join(' ').trim() || '日次まとめ';
  const dailyPath = vaultPath(`daily/${todayStr()}.md`);
  const devlogPath = vaultPath(`dev-log/${todayStr()}.md`);

  async function safeRead(p: string) {
    try { return await readFile(p, 'utf8'); } catch { return ''; }
  }

  const daily = await safeRead(dailyPath);
  const devlog = await safeRead(devlogPath);

  const system = `あなたはエンジニアの1日を要約するアシスタントです。
- 見出し「進捗」「課題」「次の一手」を含める
- 箇条書きで簡潔に
- 末尾に「明日のTODO」を3〜5件`;

  const user = `daily:\n${daily}\n\ndev-log:\n${devlog}`;

  const summary = await askClaude(system, user);

  const meta = { date: todayStr(), tags: ['wrapup', 'summary'] };
  const block = fmBlock(meta) + `# ${title}\n\n${summary}\n`;

  await appendToFile(vaultPath(`daily/${todayStr()}__wrapup.md`), block);

  console.log(`✓ wrapup written: daily/${todayStr()}__wrapup.md`);
}

main();
