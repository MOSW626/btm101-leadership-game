#!/usr/bin/env bash
# Run after reviewing the committed app. No course PDFs, responses, or .env files are published.
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
if ! git diff --quiet || ! git diff --cached --quiet; then
  printf '%s\n' 'Commit or review current changes before publishing.' >&2
  exit 1
fi
gh auth status
if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin HEAD
else
  gh repo create btm101-leadership-game --public --source . --remote origin --push \
    --description 'Bilingual leadership and management classroom activity: 18 scenarios, personal interpretations, and live class/group statistics.'
fi
