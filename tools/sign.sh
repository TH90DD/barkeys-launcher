#!/usr/bin/env bash
# Sign Barkeys Launcher with addons.mozilla.org (unlisted = for your own use,
# not listed in the store). The API credentials are asked for interactively,
# never echoed, never written to disk or shell history.
#
#   tools/sign.sh            # unlisted (default)
#   tools/sign.sh listed     # submit for the public listing (needs review)
#
# Get credentials: https://addons.mozilla.org/developers/addon/api/key/
set -euo pipefail

cd "$(dirname "$0")/.."
channel="${1:-unlisted}"
case "$channel" in unlisted|listed) ;; *) echo "Channel must be 'unlisted' or 'listed'." >&2; exit 1 ;; esac

version=$(grep -oP '"version":\s*"\K[^"]+' manifest.json)
echo "Barkeys Launcher $version → channel: $channel"

echo "1/3 Tests …"
node --test 'tests/*.test.mjs' >/dev/null || { echo "Tests failed – not signing." >&2; exit 1; }

echo "2/3 Lint …"
lint=$(npx --yes web-ext lint 2>&1 || true)
if ! grep -qE 'errors +0' <<<"$lint"; then
  echo "$lint" >&2
  echo "Lint has errors – not signing." >&2
  exit 1
fi

echo "3/3 Signing – enter your AMO API credentials (input is hidden):"
read -rsp "  JWT issuer: " WEB_EXT_API_KEY; echo
read -rsp "  JWT secret: " WEB_EXT_API_SECRET; echo
export WEB_EXT_API_KEY WEB_EXT_API_SECRET

npx --yes web-ext sign --channel="$channel" --artifacts-dir web-ext-artifacts

unset WEB_EXT_API_KEY WEB_EXT_API_SECRET
echo
echo "Done. Signed file:"
ls -1t web-ext-artifacts/*.xpi 2>/dev/null | head -1
