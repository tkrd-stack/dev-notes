import { askClaude } from '../lib/ai';
import { todayStr } from '../lib/clock';
import { latestCommitInfo } from '../lib/git';
import { appendNote } from '../lib/appendNote'; // FMは最初だけ

async function main() {
  try {
    const { message, hash, diff } = await latestCommitInfo();

    const system = `あなたはgitコミットの要約係です。出力はMarkdown。
- 「何を/なぜ」を1〜3行で要約
- 必要ならリスク/注意点を1行で補足
- 末尾に短いタグ（#bugfix #feature #refactor 等）を1〜2個`;
    const user = `コミットメッセージ:
${message}

差分（抜粋可）:
${(diff || '').slice(0, 4000)}`;

    const summary = await askClaude(system, user);

    const meta = { date: todayStr(), commit: hash, tags: ['git','commit'] };
    const body = `## ${message}\n\n${summary}\n`;

    // ※ dev-log/ に追記。リンクは wrap 時に張るのでここでは付与しない
    await appendNote(`dev-log/${todayStr()}.md`, body, meta);

    console.log(`✓ commit summary appended to dev-log/${todayStr()}.md`);
  } catch (err) {
    console.error('post-commit hook failed:', err);
    process.exit(0); // 失敗してもコミットは止めない
  }
}

main();
