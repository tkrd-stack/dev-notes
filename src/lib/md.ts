export function fmBlock(meta: Record<string, any>) {
  const yaml = Object.entries(meta)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`)
    .join('\n');
  return `---\n${yaml}\n---\n`;
}
