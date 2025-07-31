const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'screens', 'SwipeScreen.js');
const contents = fs.readFileSync(filePath, 'utf8');

if (contents.includes('handleSwipeChallenge')) {
  throw new Error('SwipeScreen still references handleSwipeChallenge');
}

console.log('SwipeScreen check passed');

