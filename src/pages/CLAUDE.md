# Pages Guide

## Routing (App.tsx)
```
/                  → Home.tsx
/players           → Players.tsx (list + add form)
/schedule          → Schedule.tsx (game list + add form)
/game/:id/setup    → GameSetupPage.tsx (attendance selection)
/game/:id          → GameDayPage.tsx (live game management)
/training          → Training.tsx (5-out offense diagrams)
/stats             → Stats.tsx → StatsDashboard
```

## Page Components

### Home.tsx
- Team logo display
- Quick stats (player count, game count)
- Active game banner (if in-progress)
- Upcoming games list
- Quick action buttons
- Data import/export

### Players.tsx
- PlayerList component
- PlayerForm for adding new players
- Edit/delete functionality

### Schedule.tsx
- Game list with status indicators
- Add game form (opponent, date, location)
- Links to setup/game pages

### GameSetupPage.tsx
- Select attending players (checkboxes)
- Start game button
- Navigates to GameDayPage on start

### GameDayPage.tsx
- Wrapper that loads game data
- Renders GameDay component
- Handles refresh/navigation

### Training.tsx
- Play selector (6 plays)
- BasketballCourt diagram
- Step controls (prev/next/play/reset)
- Coaching tips section

Contains `fiveOutPlays` array with all play definitions.

### Stats.tsx
- Simple wrapper for StatsDashboard
- Shows season stats for all players
- Color-coded play time fairness

## Hooks Used

```typescript
// Player management
const { players, loading, refresh } = usePlayers();

// Game management
const { games, loading, refresh } = useGames();

// LocalStorage abstraction
const [value, setValue] = useLocalStorage<T>(key, defaultValue);
```

## Navigation Patterns

**Game Flow**:
1. `/schedule` → Create/select game
2. `/game/:id/setup` → Mark attendance
3. `/game/:id` → Manage rotations, track stats
4. Game ends → Redirects to `/schedule`

**Bottom Nav** (in Layout.tsx):
Home | Players | Games | Training | Stats
