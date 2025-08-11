#!/bin/bash
set -euo pipefail
git fetch origin gh-pages
git checkout gh-pages
git pull --rebase origin gh-pages
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "${1:-Update GitHub Pages}"
  git push origin gh-pages
else
  echo "No changes to publish."
fi