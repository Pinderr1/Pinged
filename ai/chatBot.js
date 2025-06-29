const friendly = [
  "Good luck!",
  "Nice move!",
  "I'm having fun!",
  "You're pretty good!"
];

const competitive = [
  "I'm going to win this!",
  "You'll have to try harder.",
  "Watch this move!",
  "I bet you didn't see that coming."
];

const sarcastic = [
  "Oh wow, impressive...",
  "Is that your strategy?",
  "I'll try not to fall asleep.",
  "Maybe you'll get me next time." 
];

import { randomItem } from './botUtils';

export function generateReply(personality = 'friendly') {
  const pools = { friendly, competitive, sarcastic };
  const list = pools[personality] || friendly;
  return randomItem(list);
}
