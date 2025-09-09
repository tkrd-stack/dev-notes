#!/usr/bin/env bash
set -euo pipefail

HOOK=".git/hooks/post-commit"

cat > "$HOOK" <<'SH'
#!/usr/bin/env bash
npm run hook:post-commit >/dev/null 2>&1 || true
SH

chmod +x "$HOOK"
echo "✓ git post-commit hook installed"
