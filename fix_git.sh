#!/bin/bash
set -e
rm -f .git/index.lock .git/HEAD.lock
git reset --hard origin/main
git merge --no-edit --no-ff vercel-security-fix
git push --force origin main
