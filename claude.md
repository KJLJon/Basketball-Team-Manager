# Basketball Team Manager - Claude Context

## Project Overview
Youth basketball team management app built with React + TypeScript + Vite. Hosted on GitHub Pages. All data stored in localStorage.

## Tech Stack
- React 18, TypeScript, Vite, Tailwind CSS, React Router
- Testing: Vitest + React Testing Library
- Deployment: GitHub Actions → GitHub Pages

## Architecture

### Core Services (`src/services/`)
- **storage.ts**: localStorage wrapper, handles data persistence
- **player.ts**: CRUD operations for players
- **game.ts**: Game management, rotations, attendance
- **stats.ts**: Calculate player statistics, season totals
- **rotation.ts**: Smart player recommendations based on play time

### Data Models (`src/types/index.ts`)
Key interfaces: `Player`, `Game`, `Rotation`, `PlayerStats`, `PlayerSeasonStats`

### Components Structure
```
components/
├── common/      # Button, Input, Card, Layout, Loading
├── player/      # PlayerList, PlayerForm
├── game/        # GameList, GameForm, GameSetup, GameDay, RotationSelector, StatTracker
└── stats/       # StatsDashboard, PlayerDetail
```

### Pages (`src/pages/`)
Home, Players, Schedule, Stats, GameSetupPage, GameDayPage, PlayerDetailPage

## Key Features

### Rotation Recommendations
Algorithm sorts players by:
1. Normalized play time (total minutes / games attended)
2. Tie-breaker: total play time
Returns players with least time first.

### Play Time Tracking
- 8 swaps per game (2 per quarter × 4 quarters)
- Each swap = 4 minutes (can be 2 for substitutions)
- Updates on rotation save and game end

### Stat Tracking
Quick-tap buttons for steals, rebounds, shooting (1pt/2pt/3pt with miss/made)

## Development

### Run Locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
npm test         # Run tests
```

### File Locations
- Tests: `/tests/*.test.ts`
- Styles: `src/index.css` (Tailwind)
- Config: `vite.config.ts`, `tailwind.config.js`
- Deploy: `.github/workflows/deploy.yml`

## Common Tasks

### Add New Stat Type
1. Update `PlayerStats` interface in `src/types/index.ts`
2. Add to `StatsService.createEmptyStats()`
3. Add UI in `StatTracker.tsx`
4. Update aggregation in `StatsService.getPlayerSeasonStats()`

### Modify Rotation Logic
Edit `RotationService.recommendPlayers()` in `src/services/rotation.ts`

### Add New Page
1. Create in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation in `Layout.tsx` if needed

## Design Decisions

- **Mobile-first**: Large touch targets (60px min), bottom navigation
- **No backend**: localStorage only, export/import for backups
- **Fair play time**: Normalized by games attended (accounts for absences)
- **Real-time**: Stats update immediately on tap
- **8 swaps/game**: 2 per quarter at 4-minute mark (youth league standard)

## Reference Files
- Design doc: `DESIGN.md`
- Full README: `README.md`
- Type definitions: `src/types/index.ts`
