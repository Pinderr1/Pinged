# Pinged

Pinged is a social mobile app built with **Expo** and **Firebase**. It lets users play quick party games with friends or strangers, chat in real time and receive push notifications. The project also integrates a premium subscription flow powered by **Stripe** via Firebase Cloud Functions.

## Features

- Login and signup via email or Google
- Onboarding flow and editable user profiles
- Browse the community, match with other players and invite them to games
- Variety of board games powered by [boardgame.io](https://boardgame.io) (Tic‑Tac‑Toe, Connect Four, Battleship and more)
- Real‑time chat and notifications
- Daily play limits with an optional premium upgrade
- Stripe checkout session triggered from the mobile app
- Push notification support using Expo's notification service

## Prerequisites

- **Node.js** (v18 recommended for Cloud Functions)
- **npm**
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Expo CLI** (`npm install -g expo-cli`)

## Local Setup

1. Install dependencies for the Expo app:

   ```bash
   npm install
   ```

2. Copy `functions/.env.example` to `functions/.env` and fill in your Stripe keys.
3. Create a `.env` file in the project root with all Expo variables (see below).
4. Install function dependencies:

   ```bash
   cd functions && npm install && cd ..
   ```

### Useful Expo Commands

- `npm start` – run the Metro bundler
- `npm run android` – open in Android emulator or device
- `npm run ios` – open in iOS simulator
- `npm run web` – run the web version

### Firebase Setup

Set your Firebase project ID in `.firebaserc` and configure Firestore, Storage and Functions in the Firebase console. The Firestore and Storage security rules are stored in `firestore.rules` and `storage.rules`.

## Environment Variables

### Expo App
Create a `.env` file with the following variables:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MSG_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_CHECKOUT_FUNCTION=
SUCCESS_URL=
CANCEL_URL=
```

### Cloud Functions
Inside `functions/.env` set:

```bash
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
SUCCESS_URL=
CANCEL_URL=
```

## Deploying to Firebase

The `scripts/deploy.sh` script deploys Firestore rules, indexes and Cloud Functions. Run:

```bash
npm run deploy
```

This assumes you are logged in with the Firebase CLI and the default project in `.firebaserc` is set correctly.

