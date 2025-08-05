# Firestore Schema

This document outlines the final Firestore structure used by the Pinged application. It lists the primary collections and the fields stored for each document.

## Users (`users/{uid}`)
- `uid` (string) – user identifier (document ID)
- `email` (string)
- `displayName` (string)
- `photoURL` (string)
- `age` (number)
- `gender` (string)
- `genderPref` (string)
- `location` (string)
- `favoriteGames` (array of string)
- `bio` (string)
- `mood` (string)
- `themePreset` (string)
- `colorTheme` (string)
- `promptResponses` (array of string)
- `personalityTags` (string)
- `badgePrefs` (array of string)
- `jobTitle` (string)
- `company` (string)
- `school` (string)
- `livingIn` (string)
- `showDistance` (boolean)
- `showAge` (boolean)
- `showSocialMedia` (boolean)
- `isInternational` (boolean)
- `socialLinks` (map) – `{ instagram, tiktok }`
- `onboardingCompleted` (boolean)
- `createdAt` (timestamp)
- `isPremium` (boolean)
- `premiumUpdatedAt` (timestamp)
- `priorityScore` (number) – higher values surface the user more often
- `boostUntil` (timestamp|null) – temporary boost end time
- `boostTrialUsed` (boolean) – whether the free boost has been used
- `xp` (number)
- `streak` (number)
- `lastActiveAt` (timestamp) – last login or game completion
- `lastPlayedAt` (timestamp)
- `streakRewardedAt` (timestamp) – last time a streak reward notification was sent
- `dailyPlayCount` (number) – count of games started today for free users
- `lastGamePlayedAt` (timestamp) – when the last game session began
- `dailyLikeCount` (number) – count of likes sent today for free users
- `lastLikeSentAt` (timestamp) – when the last like was sent
- `pushToken` (string)
- `online` (boolean)
- `lastOnline` (timestamp) – last presence update time
- `blockedUsers` (array of string) – ids of users this account has blocked
- `blockedBy` (array of string) – ids of users who have blocked this account
- `badges` (array of string) – earned badge IDs
- `mood` (string) – optional status message
- `introClipUrl` (string) – voice or video intro clip
- `profilePrompts` (map) – prompt answers keyed by id
- `personalityTags` (array of string) – descriptive tags
- `badgePreferences` (map) – user-selected badge display
- `visibility` (string) – `standard` or `incognito`
- `discoveryEnabled` (boolean) – hide from swipe if false
- `messagePermission` (string) – `everyone`, `verified`, or `profile100`
- `seeAgeRange` (array) – preferred age range for matches
- `seeGender` (string) – preferred gender of matches
- `seeLocation` (string) – preferred location for matches
- `seeVerifiedOnly` (boolean) – show only verified profiles

User matches are stored separately in the `matches` collection (`matches/{matchId}`), where each document tracks the pair of user IDs and related chat metadata.

### Subcollections
- **notifications** – optional per-user notifications (see `notifications` below).
- **notificationSettings** – per-type preferences (`enabled: boolean`).

#### `notificationSettings` (`users/{uid}/notificationSettings/{settingId}`)
Each document controls whether a specific category of notifications is sent.

Document IDs:
- `invite` – game invite reminders.
- `reengage` – prompts inactive users to return.
- `streak` – streak milestone rewards.

Fields:
- `enabled` (boolean) – `true` to allow notifications of this type.

To migrate existing users, create the above documents under each user's
`notificationSettings` subcollection with `{ enabled: true }`.

## Game Invites (`gameInvites/{inviteId}`)
- `from` (string) – sender uid
- `to` (string) – recipient uid
- `matchId` (string) – related match document id
- `gameId` (string)
- `fromName` (string)
- `status` (string) – `pending`, `ready`, `accepted`, `declined`, `cancelled`
- `acceptedBy` (array of strings) – user ids who accepted the invite
- `createdAt` (timestamp)


## Matches (`matches/{matchId}`)
Each document in this collection represents a match between two users and serves as the container for their chat.

- `users` (array of string) – exactly two user ids
- `createdAt` (timestamp)
- `typingIndicator` (map) – per-user typing status
- `messageCounts` (map) – per-user sent message totals
- `chatCounts` (map) – count of replies sent by each user
- `replyTotals` (map) – cumulative reply time in milliseconds per user
- `replyCounts` (map) – number of recorded replies per user
- `lastMessageAt` (timestamp) – time of the most recent message
- `lastSenderId` (string) – uid of the last message sender

### Subcollections
- **messages** – chat messages between the matched users.
  - `senderId` (string)
  - `text` (string)
  - `timestamp` (timestamp)
  - `readBy` (array of string)

## Game Sessions (`gameSessions/{sessionId}`)
- `gameId` (string)
- `players` (array of string) – user ids
- `sessionMatchId` (string) – associated match id
- `state` (map) – current game state object
- `currentPlayer` (string) – id of the current player (`"0"` or `"1"`)
- `gameover` (map|null)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
 - `turnExpiresAt` (timestamp) – when the current player's timer ends

## Game Stats (`gameStats/{statId}`)
- `gameId` (string)
- `players` (array of string)
- `durationSec` (number)
- `winner` (string|null) – uid of the winner or `null`
- `moves` (array of map) – `{ action, player, at }`
- `loggedAt` (timestamp)

## Badges (`badges/{badgeId}`)
- `name` (string)
- `description` (string)
- `icon` (string) – Ionicons icon name
- `premium` (boolean) – if true, badge is exclusive to Premium members

## Chats
Chat conversations occur inside match documents under the `messages` subcollection (see **Matches** above). Each event also has a chat stored at `events/{eventId}/messages` following the same message shape.

## Notifications (`users/{uid}/notifications/{notificationId}`)
- `message` (string)
- `read` (boolean)
- `type` (string) – e.g. `invite`, `match`, etc.
- `createdAt` (timestamp)
- `extra` (map) – optional additional data

These per-user notifications can be paired with push notifications to keep users informed of invites or other activity.

## Match History (`matchHistory/{pairId}`)
- `users` (array of string) – two user ids in sorted order
- `likeInitiator` (string|null) – uid of the user who first liked
- `gameId` (string|null) – last game played between the pair
- `startedAt` (timestamp)
- `endedAt` (timestamp)
- `chatCounts` (map) – per-user message totals

