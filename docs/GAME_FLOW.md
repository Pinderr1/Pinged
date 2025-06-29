# Game Flow Overview

Pinged supports two ways to play quick games with other users:

## Local Chat Games
- Games embedded directly in the chat.
- Managed entirely on the device through `ChatContext`.
- When you pick a game inside a chat the state is stored locally for that match.
- No Firestore data is created for these sessions.

## Online Game Sessions
- Created when you send an invite from the Matchmaking screens.
- Stored in Firestore collections such as `gameInvites` and `gameSessions`.
- Players join a shared lobby and game state syncs between devices.

The `startLocalGame` helper in `ChatContext` kicks off the local flow. Online games
use `sendGameInvite` from `MatchmakingContext` and eventually create a `gameSession`
document.
