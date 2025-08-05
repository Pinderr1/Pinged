import React from 'react';
import { View, Text, Animated } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SwipeControls from '../components/SwipeControls';
import { handleLike } from '../utils/matchUtils';

jest.mock('../firebase', () => ({
  functions: () => ({
    httpsCallable: () => async () => ({ data: { matchId: 'u1_u2' } }),
  }),
}));

describe('swiping and matching flow', () => {
  it('shows match when like results in match', async () => {
    const TestComp = () => {
      const [matched, setMatched] = React.useState(false);
      const likeAction = () =>
        handleLike({
          currentUser: { uid: 'u1' },
          targetUser: { id: 'u2', displayName: 'User2', age: 20, images: ['img'] },
          firestore: {},
          navigation: { navigate: jest.fn() },
          isPremiumUser: true,
          showNotification: jest.fn(),
          revertLike: jest.fn(),
          addMatch: jest.fn(),
          setMatchedUser: () => setMatched(true),
          setMatchLine: jest.fn(),
          setMatchGame: jest.fn(),
          play: jest.fn(),
          setShowFireworks: jest.fn(),
        });
      return (
        <View>
          <SwipeControls
            buttons={[{ icon: 'heart', color: 'red', action: likeAction }]}
            scaleRefs={[new Animated.Value(1)]}
            actionLoading={false}
          />
          {matched && <Text testID="match">Matched</Text>}
        </View>
      );
    };

    const { getByRole, queryByTestId } = render(<TestComp />);
    expect(queryByTestId('match')).toBeNull();
    fireEvent.press(getByRole('button'));
    await waitFor(() => expect(queryByTestId('match')).not.toBeNull());
  });
});
