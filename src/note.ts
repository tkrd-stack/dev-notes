import { askClaude } from './lib/ai';
import { todayStr } from './lib/clock';
import { appendNote } from './lib/appendNote'; // ← これがFM一回だけロジック

async function main() {
  const input = process.argv.slice(2).join(' ').trim();
  if (!input) {
    console.error('Usage: npm run note -- "your memo"');
    process.exit(1);
  }

  console.log('AIにメモ整形を依頼しています...');

  const system = `あなたはエンジニアの開発メモを最小のMarkdown断片に整形するアシスタントです。
- 箇条書きメインで短く
- 不要な敬語や冗長表現は削除
- 最後に1〜3個の #タグ を提案`;
  const user = `メモ: ${input}`;

  const out = await askClaude(system, user);
  console.log('AIからの応答を受信しました。', out);

  const meta = {
    date: todayStr(),
    tags: ['dev', 'memo'],
  };

  console.log('メモをファイルに追記しています...');
  await appendNote(`dev-logs/${todayStr()}.md`, out, meta);

  console.log(`✓ memo appended to dev-logs/${todayStr()}.md`);
}

main();
