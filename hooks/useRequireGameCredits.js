import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useGameLimit } from '../contexts/GameLimitContext';

export default function useRequireGameCredits() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { gamesLeft } = useGameLimit();

  const isPremiumUser = !!user?.isPremium;

  const requireCredits = useCallback(
    (opts = {}) => {
      if (!isPremiumUser && gamesLeft <= 0) {
        const method = opts.replace ? 'replace' : 'navigate';
        navigation[method]('PremiumPaywall', { context: 'game-limit' });
        return false;
      }
      return true;
    },
    [isPremiumUser, gamesLeft, navigation]
  );

  return requireCredits;
}
