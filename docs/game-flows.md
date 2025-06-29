# Game Flows

Pinged supports two types of game play between matched users.

## Local Games

Local games are launched directly from the chat screen. When a player selects a game, the `startLocalGame` helper in `ChatContext` stores an invite in the local chat state. Once accepted, the game component is rendered inline in the chat. Local games are not persisted to Firestore and only exist for the current chat session.

## Online Games

Online games rely on Firestore backed invites. Using `useMatchmaking().sendGameInvite` creates a document under `gameInvites` and, once accepted by both players, a `gameSessions` document is created. The session is then played in `GameSessionScreen` and the state is synchronized across devices.
