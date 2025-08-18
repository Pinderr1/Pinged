#!/bin/bash
set -e

# Install Cloud Functions dependencies
(cd functions && npm install)

# Deploy backend resources
firebase deploy --only functions,firestore,storage,hosting,database,auth

# Build client for production
if command -v eas >/dev/null 2>&1; then
  eas build --profile production --platform all
else
  expo export
fi
