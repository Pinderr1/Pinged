import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useMatches } from '../contexts/MatchesContext';
import { validateMatch } from '../utils/matchUtils';

export default function useRequireMatch() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { matches } = useMatches();

  const requireMatch = useCallback(
    async (otherId, opts = {}) => {
      if (!user?.uid || !otherId) return false;
      const matchId = [user.uid, otherId].sort().join('_');
      const local = matches.some(
        (m) => m.id === matchId || m.otherUserId === otherId,
      );
      let valid = local;
      if (!valid) {
        valid = await validateMatch(user.uid, otherId);
      }
      if (!valid) {
        Alert.alert('Match Required', 'You must match with this user first.');
        if (!opts.noBack) {
          const method = opts.replace ? 'replace' : 'goBack';
          navigation[method]();
        }
      }
      return valid;
    },
    [navigation, user?.uid, matches],
  );

  return requireMatch;
}
