export const bots = [
  {
    id: 'ava',
    name: 'Ava',
    image: require('../assets/user1.jpg'),
    personality: 'friendly'
  },
  {
    id: 'zane',
    name: 'Zane',
    image: require('../assets/user2.jpg'),
    personality: 'competitive'
  },
  {
    id: 'leo',
    name: 'Leo',
    image: require('../assets/user3.jpg'),
    personality: 'sarcastic'
  }
];

export function getRandomBot() {
  return bots[Math.floor(Math.random() * bots.length)];
}
