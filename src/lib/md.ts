/** YAML frontmatter で安全になるよう、必要なときだけダブルクオートで囲む */
function fmScalar(v: any): string {
  const s = String(v);
  if (s === '') return '""';
  if (/[:#\[\]{}",&*!|>%@`]/.test(s) || /^[\s>-]/.test(s) || /\s$/.test(s)) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return s;
}

function fmValue(v: any): string {
  return Array.isArray(v) ? `[${v.map(fmScalar).join(', ')}]` : fmScalar(v);
}

export function fmBlock(meta: Record<string, any>) {
  const yaml = Object.entries(meta)
    .map(([k, v]) => `${k}: ${fmValue(v)}`)
    .join('\n');
  return `---\n${yaml}\n---\n`;
}
