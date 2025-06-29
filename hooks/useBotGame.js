import { useMemo, useEffect, useState } from 'react';
import { Client } from 'boardgame.io/client';

export default function useBotGame(game, getBotMove, onGameEnd) {
  const client = useMemo(() => {
    return Client({
      game,
      numPlayers: 2,
      ai: {
        bot: {
          play: ({ state }) => getBotMove(state.G, state.ctx.currentPlayer, game),
        },
      },
    });
  }, [game, getBotMove]);

  const [state, setState] = useState(client.getState());

  useEffect(() => {
    client.start();
    const unsub = client.subscribe(s => {
      setState(s);
      if (s.ctx.gameover) onGameEnd && onGameEnd(s.ctx.gameover);
    });
    return () => unsub();
  }, [client, onGameEnd]);

  return { G: state.G, ctx: state.ctx, moves: client.moves, reset: client.reset };
}
