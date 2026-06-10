#!/usr/bin/env bash
# backport.sh — copy UI changes from ui/ back into the assistant-ui monorepo.
# Run from any directory: bash /path/to/ui/backport.sh
#
# What gets merged:
#   ui/components/  →  assistant-ui/packages/ui/src/components/
#   ui/lib/         →  assistant-ui/packages/ui/src/lib/
#   ui/hooks/       →  assistant-ui/packages/ui/src/hooks/
#   ui/app/         →  assistant-ui/apps/omnistack-ui/app/
#     (excluding ui/app/api/ — mock backend, not for the monorepo)
#
# globals.css @source directive is fixed automatically.

set -euo pipefail

UI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO="${UI_DIR}/../assistant-ui"
PKG_UI="${MONOREPO}/packages/ui/src"
APP_UI="${MONOREPO}/apps/omnistack-ui/app"

# ── Sanity check ───────────────────────────────────────────────────────────────
if [[ ! -d "${MONOREPO}" ]]; then
  echo "ERROR: assistant-ui not found at ${MONOREPO}"
  echo "       ui/ must sit next to assistant-ui/ in the same parent folder."
  exit 1
fi

echo "Backporting ui/ → $(realpath "${MONOREPO}")"
echo ""

# ── 1. Component library ───────────────────────────────────────────────────────
echo "[1/4] components/ → packages/ui/src/components/"
cp -r "${UI_DIR}/components/." "${PKG_UI}/components/"

echo "[2/4] lib/         → packages/ui/src/lib/"
cp -r "${UI_DIR}/lib/."        "${PKG_UI}/lib/"

echo "[3/4] hooks/       → packages/ui/src/hooks/"
cp -r "${UI_DIR}/hooks/."      "${PKG_UI}/hooks/"

# ── 2. App shell (skip mock API routes) ───────────────────────────────────────
echo "[4/4] app/         → apps/omnistack-ui/app/  (excluding app/api/)"
if command -v rsync &>/dev/null; then
  rsync -a --exclude="api/" "${UI_DIR}/app/" "${APP_UI}/"
else
  cp -r "${UI_DIR}/app/." "${APP_UI}/"
  rm -rf "${APP_UI}/api"
fi

# ── 3. Fix globals.css @source path ───────────────────────────────────────────
GLOBALS="${APP_UI}/globals.css"
echo ""
echo "Fixing @source directives in globals.css …"
python3 - "${GLOBALS}" <<'EOF'
import sys, re
path = sys.argv[1]
text = open(path).read()
# Replace one or more @source lines with the monorepo-relative single line
text = re.sub(
    r'(@source\s+"[^"]+"\s*;?\s*\n)+',
    '@source "../../../packages/ui/src";\n',
    text,
)
open(path, "w").write(text)
print(f"  updated: {path}")
EOF

echo ""
echo "Done. Review with:"
echo "  git -C '$(realpath "${MONOREPO}")' diff --stat"
