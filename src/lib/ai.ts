import 'dotenv/config';

const API_KEY = process.env.ANTHROPIC_API_KEY!;
const MODEL = process.env.MODEL || 'claude-3-7-sonnet';

export async function askClaude(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });
  const json = await res.json();
  console.log('Claude API response:', json);
  // @ts-ignore
  return json.content?.[0]?.text ?? '';
}
