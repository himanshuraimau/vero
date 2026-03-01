# Project Plan — Linear Knowledge Reader

> Local-first. AI-formatted. Gesture-driven reading.

---

## Vision

 . You paste raw content under a topic. AI converts it into clean question/answer pairs. You read them one by one in a distraction-free environment.

Not flashcards. Not gamified. Controlled linear immersion.

---

## Architecture Overview

| Layer       | Choice                        |
|-------------|-------------------------------|
| Frontend    | Expo (React Native)           |
| Local DB    | SQLite (`expo-sqlite`)        |
| AI          | Direct SDK call (no backend)  |
| Storage     | Topic → Questions → Meta      |

No auth. No sync. Local-first.

---

## Data Model (SQLite)

```sql
topics(
  id TEXT PRIMARY KEY,
  name TEXT,
  created_at INTEGER
)

questions(
  id TEXT PRIMARY KEY,
  topic_id TEXT,
  question TEXT,
  answer TEXT,
  difficulty INTEGER DEFAULT 0,
  confidence INTEGER DEFAULT 0,
  created_at INTEGER
)
```

**Flat. No nesting. No joins.**

Optional additions later:
- `last_reviewed`
- `review_count`

---

## App Flow

### 1. Home Screen
- List of all Topics
- `+ Create Topic` button

### 2. Topic Screen
- List of Questions under the topic
- `Start Reading` button → enters Reader

### 3. Reading Screen
- Full-screen vertical scroll
- One question per screen
- Swipe up / down to navigate
- Minimal chrome

---

## AI Role

AI is a **formatter only**. It does not add, interpret, or reason.

**Input:** Raw text pasted under a topic.

**Prompt:**
```
You are a formatter.
Do not add information.
Convert input into strict JSON array:

[
  {
    "question": "...",
    "answer": "..."
  }
]
```

- Temperature: low
- Output: deterministic JSON
- Stored locally immediately after parsing

No embeddings. No semantic reasoning. No backend.

---

## Read More — Long Content Handling

If an answer exceeds a defined character threshold (suggested: **400–600 chars**), the Reading Screen truncates it with a **"Read More"** affordance.

### Behavior

- Answer is trimmed in the main reader view with a fade or ellipsis
- A subtle `Read More →` tap target appears below the truncated text
- Tapping opens a **dedicated Detail Page** for that question

### Detail Page

- Full-screen layout, scrollable
- Displays:
  - Question (large, top)
  - Full untruncated answer (scrollable body)
- Back gesture / back button returns to the exact position in the reader
- No extra UI — clean reading surface matching the main design system

### Data

No additional DB columns needed. Truncation is UI-only. Full answer is always stored and always available.

### Navigation

```
Reader.tsx  →  (tap "Read More")  →  DetailPage.tsx
```

Add to navigation stack:

```
/screens
  DetailPage.tsx    ← new
```

---

## Reading Screen Layout

```
┌─────────────────────────────┐
│  Topic Name          3 / 40 │  ← small, top
├─────────────────────────────┤
│                             │
│   Question text here        │  ← large, bold, 90% width
│                             │
│  ─────────────────────────  │  ← divider
│                             │
│   Answer text here...       │  ← scrollable container
│   truncated if long         │
│                             │
│   Read More →               │  ← only if content is long
│                             │
└─────────────────────────────┘
         ↑ swipe hint (minimal or absent)
```

No buttons if possible. Gesture-driven.

---

## Navigation Stack

```
/screens
  Home.tsx
  Topic.tsx
  Reader.tsx
  DetailPage.tsx      ← for long-form answer reading
/components
  QuestionCard.tsx
  VerticalPager.tsx
```

**Dependencies:**
- `react-native-reanimated`
- `react-native-gesture-handler`
- or `react-native-pager-view`

---

## UI Design System — Dark Mode

| Token           | Value                      |
|-----------------|----------------------------|
| Background      | `#0E0E11`                  |
| Primary Text    | `#EDEDED`                  |
| Secondary Text  | `#A1A1AA`                  |
| Accent          | `#7C3AED` or `#22D3EE`     |
| Card            | `#1A1A1F`                  |
| Divider         | `rgba(255,255,255,0.06)`   |

- No gradients
- No shadows
- Flat hierarchy

---

## Cognitive Model

| State         | Description                       |
|---------------|-----------------------------------|
| Read          | Default flow, swipe through       |
| Mark Weak     | Flag for later revisit            |
| Revisit Later | Queued for next session           |

**Add later:**
- Auto-sort weak questions to top
- Session-based review mode

**Never add:**
- Gamification
- Leaderboards
- Streaks

---

## Why SQLite is Correct

- Zero infrastructure
- Fast local reads
- No network latency
- Fully offline

**Future escape hatches:**
- Export as JSON
- Optional cloud sync

---

## Version 1 Scope — Ship This Only

1. Create a topic
2. Paste raw text
3. AI parses into Q&A JSON
4. Store locally in SQLite
5. Read sequentially in Reader
6. Long answers → truncate + Read More → Detail Page

**Nothing else.**

Iterate after ship.

---

## File Structure

```
/app
  /screens
    Home.tsx
    Topic.tsx
    Reader.tsx
    DetailPage.tsx
  /components
    QuestionCard.tsx
    VerticalPager.tsx
  /db
    schema.ts
    queries.ts
  /ai
    formatter.ts
  /constants
    theme.ts
```

---

## Status

- [ ] SQLite schema setup
- [ ] Home screen (topic list + create)
- [ ] Topic screen (question list + start reading)
- [ ] AI formatter integration
- [ ] Reading screen (pager + gesture)
- [ ] Long answer truncation logic
- [ ] Detail Page for full answer reading
- [ ] Theme constants applied globally