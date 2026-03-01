# Linear Knowledge Reader

Local-first. AI-formatted. Gesture-driven reading.

Paste raw content under a topic. AI converts it into clean question/answer pairs. Read them one by one in a distraction-free environment.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` with your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

3. Start the app:
   ```bash
   npm start
   ```
   Then press `i` for iOS simulator, `a` for Android emulator.

## Features

- **Topics**: Create topics and organize Q&A pairs
- **AI conversion**: Paste raw text, AI formats it into Q&A (batched, async)
- **Reader**: Swipe up/down through questions (vertical pager)
- **Read More**: Long answers truncate with a detail page for full content

## Tech

- Expo (React Native)
- SQLite (expo-sqlite)
- AI SDK + OpenAI (gpt-4o-mini)
- Iconoir icons

## Web

Web support requires additional configuration for expo-sqlite (WASM). The app is optimized for iOS and Android.
