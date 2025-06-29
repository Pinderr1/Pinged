import { randomItem } from './botUtils';

export function getBotMove() {
  return randomItem([0, 1, 2]); // 0 rock, 1 paper, 2 scissors
}
