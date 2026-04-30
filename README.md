# Bible Trivia Game Management System v2

Offline-first, sync-ready Bible Trivia admin control app for live youth church sessions.

## Quick Start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand + persist middleware |
| Storage | localStorage (via Zustand) |
| Future sync | Supabase (stubbed) |

## Architecture

### Local Data Layer (Primary)
All gameplay runs 100% offline via Zustand's persist middleware writing to localStorage.

**Normalized store shape:**
```ts
{
  sessions:   Record<string, Session>
  teams:      Record<string, Team>
  rounds:     Record<string, Round>
  activities: Record<string, Activity>
}
```

### Sync-Ready Fields
Every entity includes:
```ts
id:        string   // uid() — prefixed nanoid
createdAt: number   // Unix ms
updatedAt: number   // Updated on every mutation
synced?:   boolean  // false = dirty, needs Supabase upload
deletedAt?: number  // Soft-delete support
```

### Cloud Sync Layer (Future — Supabase)
Stubbed in `src/lib/engine.ts` via `markDirty()`. When ready:
1. Create Supabase tables matching the entity schemas
2. Query `WHERE synced = false` for dirty records
3. Upsert and flip `synced = true`

## Routes

| Route | Description |
|---|---|
| `/` | Session list + create |
| `/session/[sessionId]` | Session dashboard — rounds, leaderboard, team management |
| `/session/[sessionId]/game/[roundId]` | Live gameplay screen |

## Game Flow

```
1. Create Session
2. Add Teams (via 👥 button)
3. Add Round (category + difficulty + optional limit)
4. Start Round → gameplay screen
5. Admin marks: Correct / Wrong / Pass / Steal
6. System: applies scoring rules, advances turn, loads next question
7. End Round → back to dashboard
8. Repeat for more rounds
9. View leaderboard
```

## Categories & Scoring

| Category | Correct | Wrong | Steal | Pass | Turn Mode |
|---|---|---|---|---|---|
| Quote / Verse | +15 | -5 | +10 | ✅ | Rotation |
| General Knowledge | +10 | -3 | +7 | ✅ | Rotation |
| Identify Character | +10 | -3 | +7 | ✅ | Rotation |
| Hot Seat | +5 | 0 | ❌ | ❌ | Continuous (30s timer) |
| Open the Verse | +20 | -10 | +15 | ❌ | Rotation |
| True or False | +8 | -4 | ❌ | ❌ | Rotation |

## Scoring Engine

Scores are **never stored directly**. All scoring is derived:

```ts
score = sum(activities.filter(teamId).map(a => a.points))
```

The `processAnswer()` function in `gameStore.ts`:
1. Applies scoring rules from the category's `ScoringMode`
2. Logs an `Activity` record
3. Handles turn rotation (per-question or continuous)
4. Never mutates score fields

## Adding Questions

Edit `src/lib/data.ts`:

```ts
{
  id: 'q_unique',           // prefix with category: q_gk_, q_qt_, etc.
  categoryId: 'general',    // quote | general | character | hotseat | openverse | truefalse
  difficulty: 'medium',     // easy | medium | hard
  question: 'Your question?',
  answer: 'The answer',
}
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                              # Home — session list
│   ├── session/[sessionId]/
│   │   ├── page.tsx                          # Session dashboard
│   │   └── game/[roundId]/page.tsx           # Live gameplay
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── game/
│   │   ├── QuestionPanel.tsx
│   │   ├── ActionButtons.tsx
│   │   ├── Scoreboard.tsx
│   │   └── ActivityFeed.tsx
│   ├── dashboard/
│   │   ├── AddRoundModal.tsx
│   │   ├── TeamManager.tsx
│   │   └── Leaderboard.tsx
│   └── shared/
│       └── Toast.tsx
├── store/
│   └── gameStore.ts          # Zustand store + game engine
├── lib/
│   ├── data.ts               # Categories, scoring modes, questions
│   └── engine.ts             # Fisher-Yates, score derivation, uid, markDirty
└── types/
    └── index.ts              # All TypeScript types (sync-ready)
```

## Future Extensions

The architecture is explicitly designed for:

- **Supabase sync**: `markDirty()` flags every mutation; sync layer reads `synced: false` records
- **AI question generation**: Add to `data.ts` with `aiGenerated: true` flag
- **PDF upload**: Parse into `Question[]` and push to local store
- **New categories**: Add to `CATEGORIES` + `SCORING_MODES` in `data.ts`
- **New scoring rules**: Add a `ScoringMode` and reference it from a category


TO DO
1. Add sounds
3. Create the pdf upload
4. Implement backend (AI extraction and database integration)

