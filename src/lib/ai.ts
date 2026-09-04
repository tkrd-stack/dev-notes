import 'dotenv/config';
import { z } from 'zod';

const API_KEY = process.env.ANTHROPIC_API_KEY!;
const MODEL = process.env.MODEL || 'claude-3-7-sonnet';

async function callClaude(system: string, user: string, maxTokens = 800): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });
  const json = await res.json();
  console.log('Claude API response:', json);

  if (!res.ok) {
    const message = json?.error?.message ?? json?.error ?? res.statusText;
    throw new Error(`Claude API request failed: ${message}`);
  }

  if (json?.type === 'error' || json?.error) {
    const message = json?.error?.message ?? json?.error ?? 'Unknown error';
    throw new Error(`Claude API responded with an error: ${message}`);
  }

  const content = json?.content?.[0]?.text;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Claude API returned no content');
  }

  return content;
}

export async function askClaude(system: string, user: string): Promise<string> {
  return callClaude(system, user);
}

/** ```json フェンスや前後の説明を取り除き、最初の { ... } を取り出す */
function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence ? fence[1] : trimmed).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return candidate;
  return candidate.slice(start, end + 1);
}

/** Claude に JSON を返させ、zod スキーマで検証して返す */
export async function askClaudeJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  maxTokens = 1500
): Promise<T> {
  const raw = await callClaude(system, user, maxTokens);
  const jsonText = extractJsonText(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Claude API did not return valid JSON:\n${raw}`);
  }

  return schema.parse(parsed);
}
