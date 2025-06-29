# Game Flows

Pinged supports two ways to play mini-games with other users:

## Local Games

Local games happen entirely on the current device. When you start a local game from the chat screen the selected match record is updated with a `pendingInvite` object and, once accepted, an `activeGameId`. No Firestore `gameInvites` document is created.

Use local games for quick, in-person play when both players share the same device.

## Online Games

Online games are coordinated through the `MatchmakingContext`. When an online invite is sent a new document is created under the `gameInvites` collection and mirrored in each user's subcollection. Once every player accepts, the game session is launched remotely.

Online games are best when players are on separate devices and need to coordinate over the network.
