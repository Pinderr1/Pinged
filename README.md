# Pinged

Pinged is a Firebase-powered mobile app built with React Native and Expo. It enables real-time user presence, game invites, and push notifications, optimized for quick communication and casual gameplay.

---

## Tech Stack

- React Native (0.79)
- Expo SDK 53
- Firebase v9 (Firestore, Auth, Cloud Functions, Realtime DB)
- Boardgame.io (for embedded games)
- Stripe (configured but optional)
- Lottie for animations
- Expo Notifications for push

---

## Setup

1. Clone the repository

```bash
git clone https://github.com/your-username/pinged.git
cd pinged

    Install dependencies

npm install

    Install additional Expo modules

npx expo install expo-image-manipulator

    Start the app

npm run start

Push notifications require running the app in a development build (Expo Go no longer includes remote notification support).

Other scripts:

npm run android     # Launch on Android emulator
npm run ios         # Launch on iOS simulator
npm run web         # Launch in browser
npm run deploy      # Deploy Firebase backend and build for release

Project Structure

Pinged/
├── ai/                    # Bot game logic (tic-tac-toe, RPS, etc.)
├── assets/                # Icons, splash, animations
├── components/            # Shared and screen components
├── functions/             # Firebase Cloud Functions
├── styles.js              # App-wide styling
├── firebase.js            # Firebase client init
├── App.js                 # Entry point
├── app.json               # Expo config
├── app.config.js          # Runtime env + plugin config

## Configuration Files

Common settings live at the repository root:

- `.env.example` – environment variables for both the Expo app and Cloud Functions.
- `.gitignore` – global ignore rules. Add function-specific ignores here instead of `functions/.gitignore`.
- `package.json` – project-wide scripts and shared dependencies. `functions/package.json` keeps only backend-specific packages.

Update the root files for shared changes; only touch files under `functions/` when the setting applies exclusively to Cloud Functions.

Features

    Push notifications with Expo

    Realtime presence tracking via Realtime Database

    Game invites and automated match start

    AI bots for built-in games

    Modular bot/game logic

    Firebase auth and Firestore sync

    Deployment script for full backend/frontend push

Testing

To run rule tests (if applicable), install:

npm install --save-dev @firebase/rules-unit-testing

Deployment

Run the full deployment pipeline:

npm run deploy

This deploys:

    Cloud Functions

    Firestore

    Storage

    Hosting

    Mobile/web build via EAS or Expo export

License

This project is private and not licensed for redistribution.
