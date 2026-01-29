# Basketball Team Manager

Youth basketball app for **Bucket Ducks** - tracks players, games, rotations, stats.

**Stack**: Vite + React 19 + TypeScript, Tailwind CSS, React Router, localStorage, PWA

**Commands**: `npm run dev` | `npm run build` | `npm run preview` | `npm run test`

**Structure**:
- `/src/components`: common, game, player, stats, training
- `/src/pages`: Home, GameDayPage, GameSetupPage, Players, Schedule, Stats, Training
- `/src/services`: game.ts, stats.ts, rotation.ts, player.ts, storage.ts
- `/src/hooks`: usePlayers, useGames, useServiceWorker
- `/src/types/index.ts`: All TypeScript interfaces

**Game**: 4 quarters × 2 swaps = 8 rotations. 5 players on court. Attendance tracked.

**Data**: Player (id, name, number), Game (opponent, date, attendance, rotations, stats, status), Rotation (quarter, swap, playersOnCourt, minutes), PlayerStats (steals, rebounds, 1pt/2pt/3pt)

**Services**: GameService (CRUD), RotationService (recommendations), StatsService (aggregation), StorageService (localStorage)

**PWA**: Offline support via service worker. Update banner shows when new version available. Build timestamp shown on home page.

**Branding**: Bucket Ducks, `/public/logo.jpeg`, Blue-600 + orange
