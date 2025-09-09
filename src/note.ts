import { askClaude } from './lib/ai';
import { appendToFile, vaultPath } from './lib/fs';
import { fmBlock } from './lib/md';
import { todayStr } from './lib/clock';

async function main() {
  const input = process.argv.slice(2).join(' ').trim();
  if (!input) {
    console.error('Usage: npm run note -- "your memo"');
    process.exit(1);
  }

  const system = `あなたはエンジニアの開発メモを最小のMarkdown断片に整形するアシスタントです。
- 箇条書きメインで短く
- 不要な敬語や冗長表現は削除
- 最後に1〜3個の #タグ を提案`;

  const user = `メモ: ${input}`;

  const out = await askClaude(system, user);

  const meta = {
    date: todayStr(),
    tags: ['dev', 'memo'],
  };

  const block = fmBlock(meta) + out + '\n';

  await appendToFile(vaultPath(`daily/${todayStr()}.md`), block);

  console.log(`✓ memo appended to daily/${todayStr()}.md`);
}

main();
