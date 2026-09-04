import { z } from 'zod';
import { askClaudeJson } from './lib/ai';
import { writeKnowledge } from './lib/knowledge';

const KnowledgeSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1).max(6),
  body: z.string().min(1),
});

async function main() {
  const input = process.argv.slice(2).join(' ').trim();
  if (!input) {
    console.error('Usage: npm run knowledge -- "覚えておきたい知識"');
    process.exit(1);
  }

  console.log('AIにナレッジ整形を依頼しています...');

  const system = `あなたはエンジニアの断片的なメモを、後から再利用できる「ナレッジ」記事に整形するアシスタントです。
出力は必ず JSON オブジェクト1つだけにしてください（前後の説明文やコードフェンスは付けない）。
各フィールド:
- title: 内容を端的に表す日本語タイトル（30文字以内。記号 / \\ : * ? " < > | は使わない）
- summary: 1〜2文の要約
- category: 大分類を1つ（例: TypeScript / インフラ / Git / 設計 / ツール など）
- tags: 2〜5個のタグ文字列（先頭に # は付けない）
- body: Markdown本文。見出しや箇条書きで背景・要点・具体例やコードを簡潔にまとめる。冗長な敬語は避ける。`;
  const user = `メモ: ${input}`;

  const entry = await askClaudeJson(system, user, KnowledgeSchema);
  console.log('AIからの応答を受信しました。');

  const rel = await writeKnowledge(entry);
  console.log(`✓ knowledge saved to ${rel}`);
}

main().catch(e => {
  console.error('knowledge failed:', e);
  process.exit(1);
});
