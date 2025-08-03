const { replayGame } = require('../useGameSession');

describe('replayGame', () => {
  it('replays moves and computes game over', () => {
    const Game = {
      setup: () => ({ count: 0 }),
      moves: {
        inc: ({ G, ctx }) => {
          G.count += 1;
          ctx.events.endTurn();
        },
      },
      turn: { moveLimit: 1 },
      endIf: ({ G }) => (G.count >= 2 ? { winner: '0' } : null),
    };
    const result = replayGame(Game, Game.setup(), [
      { action: 'inc' },
      { action: 'inc' },
    ]);
    expect(result.G.count).toBe(2);
    expect(result.gameover).toEqual({ winner: '0' });
  });
});
