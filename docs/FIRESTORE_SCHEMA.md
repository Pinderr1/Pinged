# Firestore Schema

This document outlines the final Firestore structure used by the Pinged application. It lists the primary collections and the fields stored for each document.

## Users (`users/{uid}`)
- `uid` (string) – user identifier (document ID)
- `email` (string)
- `displayName` (string)
- `photoURL` (string)
- `name` (string)
- `age` (number)
- `gender` (string)
- `genderPref` (string)
- `location` (string)
- `favoriteGames` (array of string)
- `bio` (string)
- `onboardingComplete` (boolean)
- `createdAt` (timestamp)
- `isPremium` (boolean)
- `premiumUpdatedAt` (timestamp)
- `xp` (number)
- `streak` (number)
- `lastPlayedAt` (timestamp)
- `dailyPlayCount` (number) – count of games started today for free users
- `lastGamePlayedAt` (timestamp) – when the last game session began
- `expoPushToken` (string)
- `online` (boolean)
- `lastSeenAt` (timestamp)

### Subcollections
- **gameInvites** – invitations sent or received by the user. Each invite document mirrors the root `gameInvites` collection.
- **notifications** – optional per-user notifications (see `notifications` below).

## Match Requests (`matchRequests/{requestId}`)
- `from` (string) – user id of requester
- `to` (string) – user id of target
- `status` (string) – `pending`, `accepted`, or `cancelled`
- `createdAt` (timestamp)

## Game Invites (`gameInvites/{inviteId}`)
- `from` (string) – sender uid
- `to` (string) – recipient uid
- `gameId` (string)
- `fromName` (string)
- `status` (string) – `pending`, `ready`, `accepted`, `declined`, `cancelled`
- `acceptedBy` (array of strings) – user ids who accepted the invite
- `createdAt` (timestamp)

A copy of each invite is also stored under `users/{uid}/gameInvites/{inviteId}` for quick access.

## Matches (`matches/{matchId}`)
- `users` (array of string) – exactly two user ids
- `createdAt` (timestamp)
- `typing` (map) – per-user typing status
- `messageCounts` (map) – per-user sent message totals

### Subcollections
- **messages** – chat messages between the matched users.
  - `senderId` (string)
  - `text` (string)
  - `timestamp` (timestamp)
  - `readBy` (array of string)

## Game Sessions (`gameSessions/{sessionId}`)
- `gameId` (string)
- `players` (array of string) – user ids
- `state` (map) – current game state object
- `currentPlayer` (string) – id of the current player (`"0"` or `"1"`)
- `gameover` (map|null)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Chats
Chat conversations occur inside match documents under the `messages` subcollection (see **Matches** above). Each event also has a chat stored at `events/{eventId}/messages` following the same message shape.

## Notifications (`users/{uid}/notifications/{notificationId}`)
- `message` (string)
- `read` (boolean)
- `type` (string) – e.g. `invite`, `match`, etc.
- `createdAt` (timestamp)
- `extra` (map) – optional additional data

These per-user notifications can be paired with push notifications to keep users informed of invites or other activity.

