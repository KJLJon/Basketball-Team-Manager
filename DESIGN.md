# Basketball Team Manager - Design Document

## Project Overview
A browser-based youth basketball team management app for tracking players, games, rotations, and statistics.

## Technology Stack
- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (mobile-first responsive design)
- **Data Storage**: localStorage (with architecture for future API integration)
- **Testing**: Vitest + React Testing Library
- **Deployment**: GitHub Pages

## Data Models

### Player
```typescript
{
  id: string;
  name: string;
  number: string;
  createdAt: number;
}
```

### Game
```typescript
{
  id: string;
  opponent: string;
  date: string;
  location: string;
  attendance: string[]; // player IDs
  rotations: Rotation[];
  stats: GameStats;
  status: 'scheduled' | 'in-progress' | 'completed';
}
```

### Rotation
```typescript
{
  quarter: 1 | 2 | 3 | 4;
  swap: 1 | 2; // first or second swap in quarter
  playersOnCourt: string[]; // 5 player IDs
  minutes: number; // 4 or custom (2 for partial swap)
}
```

### PlayerStats
```typescript
{
  playerId: string;
  gameId: string;
  steals: number;
  rebounds: number;
  attempts1pt: number;
  made1pt: number;
  attempts2pt: number;
  made2pt: number;
  attempts3pt: number;
  made3pt: number;
  playTimeMinutes: number;
}
```

## Core Features

### Phase 1: Foundation
- Project setup with React + TypeScript + Vite
- Data models and localStorage service
- Basic routing structure
- Player CRUD operations
- Game CRUD operations

### Phase 2: Game Day Experience
- Game detail view with attendance tracking
- Live rotation interface (8 swaps per game)
- Quick-access stat tracking buttons
- Timer/quarter management
- Substitution tracking with time splits

### Phase 3: Analytics & Insights
- Player stats dashboard
- Season-wide play time tracking
- Per-game statistics
- Individual player detail view
- Smart rotation recommendations based on:
  1. Least play time normalized by games attended
  2. Tie-breaker: least total play time

### Phase 4: Data Management
- Export data to JSON
- Import data from JSON
- Data validation and migration

### Phase 5: Polish
- Mobile-optimized UI/UX
- Responsive design for tablet/phone
- Loading states and error handling
- Unit tests for business logic
- GitHub Pages deployment

## UI Structure

### Navigation
- Home / Dashboard
- Players
- Schedule
- Game Day (active game)
- Stats

### Key Screens

#### Players List
- Add/edit/delete players
- Quick view of player numbers
- Search/filter

#### Schedule
- List of games (past/upcoming)
- Add new game
- Mark attendance
- Start game

#### Game Day Interface
- Current quarter and swap indicator
- 5-player rotation selector
- Quick stat buttons (large touch targets)
- Swap management
- Emergency substitution (2-min splits)

#### Stats Dashboard
- Table view of all players
- Sortable columns: play time, points, rebounds, steals
- Visual indicators for players falling behind
- Quick navigation to player details

#### Player Detail
- Individual statistics
- Game-by-game breakdown
- Play time trends

## Business Logic

### Play Time Calculation
- Each full swap = 4 minutes
- Partial swap = 2 minutes
- Season total = sum of all minutes
- Normalized play time = total minutes / games attended

### Rotation Recommendations
```
Algorithm:
1. Get all players marked as attending current game
2. Calculate normalized play time for each (total minutes / games attended)
3. Sort by normalized play time (ascending)
4. For ties, sort by total play time (ascending)
5. Return top 5 players not currently on court
```

### Stat Tracking
- Increment counters per player per game
- Aggregate across season
- Calculate shooting percentages

## File Structure
```
/src
  /components
    /player (Player list, form, card)
    /game (Game list, form, game day interface)
    /stats (Stats dashboard, player detail)
    /common (Buttons, inputs, layouts)
  /services
    storage.ts (localStorage abstraction)
    player.ts (Player business logic)
    game.ts (Game business logic)
    stats.ts (Statistics calculations)
    rotation.ts (Rotation recommendations)
  /types
    index.ts (TypeScript interfaces)
  /utils
    export.ts (Data export/import)
    date.ts (Date helpers)
  /hooks
    useLocalStorage.ts
    usePlayers.ts
    useGames.ts
  App.tsx
  main.tsx
/tests
  player.test.ts
  game.test.ts
  stats.test.ts
  rotation.test.ts
```

## Testing Strategy
- Unit tests for all business logic services
- Test rotation recommendation algorithm
- Test play time calculations
- Test stat aggregations
- Test export/import functionality

## Deployment
- GitHub Actions workflow to build and deploy to GitHub Pages
- Automatic deployment on push to main branch
- Vite base path configuration for GitHub Pages

## Future Enhancements (Out of Scope)
- Remote API integration
- Multi-team support
- Historical season archives
- Advanced analytics and charts
- Print-friendly game reports
