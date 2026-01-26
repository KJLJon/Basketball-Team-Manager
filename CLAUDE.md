# Basketball Team Manager - Claude Code Guide

## Project Overview
Youth basketball team management app for the **Bucket Ducks** team. Tracks players, games, rotations, and statistics with fair play time distribution.

## Tech Stack
- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS v3.4
- **Router**: React Router DOM v7.13
- **Storage**: Browser localStorage (no backend)
- **Testing**: Vitest

## Key Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production (tsc && vite build)
npm run preview  # Preview production build
npm run test     # Run tests
```

## Directory Structure
```
/src
  /components
    /common        # Button, Card, Input, Layout, Loading
    /game          # GameDay, RotationSelector, SwapsOverview, CurrentPlayerCard
    /player        # PlayerForm, PlayerList
    /stats         # StatsDashboard, PlayerDetail
    /training      # BasketballCourt (5-out offense diagrams)
  /pages           # Home, Training, Stats, GameDayPage, GameSetupPage, Players, Schedule
  /services        # game.ts, stats.ts, rotation.ts, player.ts, storage.ts
  /hooks           # usePlayers, useGames, useLocalStorage
  /types           # index.ts (all TypeScript interfaces)
  /utils           # export.ts, date.ts
/public            # team-logo.svg, 404.html
```

## Game Structure
- **4 quarters × 2 swaps = 8 total rotations** per game
- Standard swap = 4 minutes (2 minutes each for mid-swap substitutions)
- 5 players on court at a time
- Attendance tracked per game

## Key Data Models
See `/src/types/index.ts` for full definitions:
- `Player`: id, name, number
- `Game`: opponent, date, attendance[], rotations[], stats, status
- `Rotation`: quarter (1-4), swap (1-2), playersOnCourt[], minutes
- `PlayerStats`: steals, rebounds, attempts/made for 1pt/2pt/3pt

## Services Quick Reference
| Service | Purpose |
|---------|---------|
| `GameService` | CRUD games, rotations, attendance, substitutions |
| `RotationService` | Player recommendations, rotation calculations |
| `StatsService` | Player stats, season aggregation, play time |
| `StorageService` | localStorage abstraction |

## Component Documentation
For detailed component info, read these files as needed:
- `/src/components/game/CLAUDE.md` - Game day components
- `/src/components/training/CLAUDE.md` - Training/court diagram
- `/src/services/CLAUDE.md` - Service layer details

## Branding
- Team: **Bucket Ducks**
- Logo: `/public/team-logo.svg`
- Colors: Blue-600 primary, orange accents
