#!/bin/bash
set -euo pipefail

# Run tests
npm run test

# Build static assets
npx expo export --output-dir dist

# Bump patch version
npm version patch

# Push changes and tags
git push
git push --tags

# Publish build via EAS
npx eas build --platform all --non-interactive
