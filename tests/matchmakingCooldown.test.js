import React, { forwardRef, useImperativeHandle } from 'react';
import { render, act } from '@testing-library/react-native';
import { MatchmakingProvider, useMatchmaking } from '../contexts/MatchmakingContext';
import Toast from 'react-native-toast-message';

jest.mock('../contexts/UserContext', () => ({
  useUser: () => ({ user: { uid: 'u1', displayName: 'User' } }),
}));

jest.mock('../contexts/ListenerContext', () => ({
  useListeners: () => ({ incomingInvites: [], outgoingInvites: [] }),
}));

jest.mock('../contexts/LoadingContext', () => ({
  useLoading: () => ({ show: jest.fn(), hide: jest.fn() }),
}));

jest.mock('../utils/matchUtils', () => ({
  validateMatch: jest.fn().mockResolvedValue(true),
}));

const addMock = jest.fn().mockResolvedValue({ id: 'abc' });

jest.mock('../firebase', () => {
  const firestore = () => ({
    collection: () => ({ add: addMock }),
  });
  firestore.FieldValue = { serverTimestamp: jest.fn() };
  return { __esModule: true, default: { firestore }, firestore };
});

jest.mock('react-native-toast-message', () => ({ show: jest.fn() }));

describe('MatchmakingContext invite cooldown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    addMock.mockClear();
    Toast.show.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setup = () => {
    const ref = React.createRef();
    const Test = forwardRef((props, ref) => {
      const { sendGameInvite, inviteDisabled } = useMatchmaking();
      useImperativeHandle(ref, () => ({
        sendGameInvite,
        getInviteDisabled: () => inviteDisabled,
      }));
      return null;
    });
    render(
      <MatchmakingProvider>
        <Test ref={ref} />
      </MatchmakingProvider>,
    );
    return ref;
  };

  it('throttles rapid invites and resets after interval', async () => {
    const ref = setup();

    await act(async () => {
      await ref.current.sendGameInvite('u2', 'game1');
    });
    expect(addMock).toHaveBeenCalledTimes(1);
    expect(addMock.mock.calls[0][0]).toMatchObject({ matchId: 'u1_u2' });
    expect(ref.current.getInviteDisabled()).toBe(true);

    let result;
    await act(async () => {
      result = await ref.current.sendGameInvite('u2', 'game1');
    });
    expect(result).toBeNull();
    expect(addMock).toHaveBeenCalledTimes(1);
    expect(Toast.show).toHaveBeenCalled();
    expect(ref.current.getInviteDisabled()).toBe(true);

    await act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(ref.current.getInviteDisabled()).toBe(false);

    await act(async () => {
      await ref.current.sendGameInvite('u2', 'game1');
    });
    expect(addMock).toHaveBeenCalledTimes(2);
    expect(ref.current.getInviteDisabled()).toBe(true);
  });
});

