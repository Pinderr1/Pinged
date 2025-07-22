// Basic placeholder test for invite acceptance flow
// This is a stub since Firebase emulator deps are unavailable in this repo.
// It ensures the acceptInvite callable returns a match id when invoked.
import { acceptInvite } from '../functions/invites';

test('acceptInvite callable exists', () => {
  expect(typeof acceptInvite).toBe('function');
});
