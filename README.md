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

    Start the app

npm run start

Other scripts:

npm run android     # Launch on Android emulator
npm run ios         # Launch on iOS simulator
npm run web         # Launch in browser
npm run deploy      # Deploy Firebase functions, rules, and static build

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

Features

    Push notifications with Expo

    Realtime presence tracking

    Game invites and automated match start

    AI bots for built-in games

    Modular bot/game logic

    Firebase auth and Firestore sync

    Deployment script for full backend/frontend push

Testing

Test presence sync logic:

node tests/syncPresence.test.js

To run rule tests (if applicable), install:

npm install --save-dev @firebase/rules-unit-testing

Deployment

Run the full deployment pipeline:

npm run deploy

This deploys:

    Cloud Functions

    Firestore Rules

    Firestore Indexes

    Static web build (via Expo export)
    Image compression enabled with --image-compression flag

License

This project is private and not licensed for redistribution.
