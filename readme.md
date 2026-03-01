# Vero

Vero is a small, offline‑first flashcard / interview‑prep app built with Expo and React Native.  
You create **topics**, paste in your notes, and Vero turns them into individual Q&A cards you can review later.

## Tech stack

- **App**: Expo (React Native), Expo Router
- **DB**: `expo-sqlite` (local SQLite database on device)
- **Platform targets**: iOS, Android, Web (web is mainly for development)

## Getting started

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Run in development

Start the Metro dev server:

```bash
npx expo start
```

Then:

- **Android**: press `a` in the terminal (emulator) or scan the QR in Expo Go.
- **iOS**: press `i` (simulator) or use Expo Go.
- **Web**: press `w` to open in the browser.

The app will automatically initialize the local SQLite database on first launch.

## Core concepts

- **Topic**: a collection of questions (e.g. "React hooks", "System design basics").
- **Question**: individual Q&A card within a topic.

From the home screen you can:

- Create a new topic.
- Open an existing topic to see questions.
- Mark topics / questions as read.
- Delete topics (and all of their questions).

## Question generation (Convert to Q&A)

The “Convert to Q&A” feature uses OpenAI to extract question–answer pairs from your pasted text.

There are **two ways** it can run:

1. **Simple (no backend, easier – but exposes your key)**  
   - Set `EXPO_PUBLIC_OPENAI_API_KEY` in your `.env` (or build env) to a valid OpenAI API key.  
   - The app will call OpenAI **directly from the device**.  
   - This is fine for personal use / experiments, but **not secure for a public app**, because the key is baked into the app and can be extracted.

2. **Backend mode (more work, but safer for production)**  
   - The app calls an API route at `/api/format` (see `app/api/format+api.ts`).  
   - In development (`npx expo start`), this route is served by the Metro dev server and “just works”.  
   - For standalone builds, you should deploy that route to your own backend and set `EXPO_PUBLIC_API_BASE_URL` to its base URL (e.g. `https://your-api.example.com`) before building. Android release builds should use HTTPS.

## Local database

Vero uses `expo-sqlite` and a local database file named `vero.db`.  
Schema is defined under `app/db/schema.ts`, and all queries live in `app/db/queries.ts`.

- Tables: `topics`, `questions`
- Data is stored **locally on device** and is not synced anywhere.

## Native Android build (Gradle)

To generate the native Android project (Expo → Gradle) and build an APK:

### 1. Prebuild (generate `android/`)

From the project root:

```bash
npm install
npx expo prebuild --platform android
```

This creates the `android/` folder with a standard Gradle project.

> After this, avoid running `expo prebuild` repeatedly unless you really need to
> regenerate native files, as it can overwrite manual changes in `android/`.

### 2. Build APK with Gradle

From the same root:

```bash
cd android

# Local debug APK
./gradlew assembleDebug

# Release APK (unsigned unless you configure signing)
./gradlew assembleRelease
```

Generated APKs will be under `android/app/build/outputs/apk/`.

## Troubleshooting

- **“Network error” when converting to Q&A in Gradle/standalone build**: The app has no API to call. See [Question generation (Convert to Q&A)](#question-generation-convert-to-qa) above: you need a hosted API and `EXPO_PUBLIC_API_BASE_URL` set at build time.

- **"Could not create topic" popup** in native builds usually indicates a SQLite / DB init issue.  
  - Check the Metro / Logcat logs for `[Vero DB]` messages.
  - Ensure `expo-sqlite` is installed and added as a plugin in `app.json`.

- If builds behave strangely after changing native‑related config, try:

  ```bash
  rm -rf android
  npx expo prebuild --platform android
  ```
