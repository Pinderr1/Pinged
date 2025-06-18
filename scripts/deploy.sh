#!/bin/bash
set -e

# Deploy firestore rules
firebase deploy --only firestore:rules

# Deploy firestore indexes
firebase deploy --only firestore:indexes

# Deploy cloud functions
cd functions && npm install && firebase deploy --only functions && cd ..
