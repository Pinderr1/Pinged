# Pinged

Pinged is a React Native/Expo application. This repository does not include the Firebase configuration values that the application expects at runtime. These values are supplied through environment variables loaded from a `.env` file.

## Obtaining Firebase configuration values

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (or open an existing one).
2. In the project dashboard click **Settings** > **Project settings**.
3. Under **Your apps**, create a **Web** app if you have not already. Firebase will show a configuration snippet containing values such as `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` and `appId`. Copy these values.
4. For Google authentication you will also need a **Web client ID**:
   - In the Firebase console open **Authentication** > **Sign-in method** and enable **Google**.
   - Click **Web client** under the Google provider to create a new OAuth client or copy the existing Client ID.

## Creating the `.env` file

Copy `.env.example` to `.env` at the project root and define the following variables using the values from the steps above:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=<your apiKey>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your authDomain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your projectId>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your storageBucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your messagingSenderId>
EXPO_PUBLIC_FIREBASE_APP_ID=<your appId>
EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=<your Web client ID>
```

You can copy the included `.env.example` file to `.env` and populate it with
your values.

These variables are consumed in [`firebase.js`](firebase.js) when initializing Firebase and in [`authConfig.js`](authConfig.js) for authentication.

## Running the app

Install dependencies and start Expo:

```bash
npm install
npm start
```

Expo will load the values from the `.env` file automatically using the `dotenv` package configured in `app.config.js`.

## Building a release

This project uses **Expo Application Services (EAS)** to create production builds.

1. Install the EAS CLI if you do not have it:

```bash
npm install -g eas-cli
```

2. Log in to your Expo account:

```bash
eas login
```

3. Build the app for Android or iOS:

```bash
eas build --platform android   # or ios
```

EAS will read the Firebase configuration from environment variables. For production builds you can create a `.env.production` file or define the variables in your EAS project settings so that the release uses your production Firebase project.
