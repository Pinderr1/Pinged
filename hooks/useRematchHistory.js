import { useEffect, useState } from 'react';
import firebase from '../firebase';
import { useUser } from '../contexts/UserContext';

export default function useRematchHistory(matches) {
  const { user } = useUser();
  const [history, setHistory] = useState({});

  useEffect(() => {
    if (!user?.uid || !Array.isArray(matches) || matches.length === 0) {
      setHistory({});
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const snap = await firebase
          .firestore()
          .collection('gameStats')
          .where('players', 'array-contains', user.uid)
          .get();
        if (!active) return;
        const stats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const map = {};
        matches.forEach((m) => {
          const other = m.otherUserId;
          if (!other) return;
          const games = stats
            .filter((g) => Array.isArray(g.players) && g.players.includes(other))
            .sort(
              (a, b) =>
                (b.loggedAt?.toDate?.() || b.loggedAt || 0) -
                (a.loggedAt?.toDate?.() || a.loggedAt || 0)
            );
          if (!games.length) return;
          const last = games[0];
          const lastResult =
            last.winner == null
              ? 'draw'
              : last.winner === user.uid
              ? 'win'
              : 'loss';
          const rematchPercent =
            games.length > 1
              ? Math.round(((games.length - 1) / games.length) * 100)
              : null;
          map[m.id] = {
            gameId: last.gameId,
            lastResult,
            rematchPercent,
          };
        });
        setHistory(map);
      } catch (e) {
        console.warn('Failed to load rematch history', e);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [user?.uid, matches]);

  return history;
}
