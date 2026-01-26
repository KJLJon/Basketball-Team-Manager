# Types Quick Reference

All types defined in `/src/types/index.ts`.

## Core Types

```typescript
interface Player {
  id: string;
  name: string;
  number: string;
  createdAt: number;
}

type GameStatus = 'scheduled' | 'in-progress' | 'completed';
type Quarter = 1 | 2 | 3 | 4;
type SwapNumber = 1 | 2;

interface Rotation {
  quarter: Quarter;
  swap: SwapNumber;
  playersOnCourt: string[];  // 5 player IDs
  minutes: number;           // Usually 4, or 2 for partial swaps
  startTime?: number;
}

interface PlayerStats {
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

interface Game {
  id: string;
  opponent: string;
  date: string;              // ISO date
  location: string;
  attendance: string[];      // Player IDs who attended
  rotations: Rotation[];
  stats: Record<string, Omit<PlayerStats, 'gameId' | 'playerId'>>;
  status: GameStatus;
  currentQuarter?: Quarter;
  currentSwap?: SwapNumber;
  createdAt: number;
}
```

## Derived Types

```typescript
interface PlayerSeasonStats extends PlayerStats {
  gamesPlayed: number;
  gamesAttended: number;
  normalizedPlayTime: number;  // playTimeMinutes / gamesAttended
  totalPoints: number;
  fieldGoalPercentage: number;
}

interface RotationRecommendation {
  playerId: string;
  playerName: string;
  playerNumber: string;
  normalizedPlayTime: number;
  totalPlayTime: number;
  gamesAttended: number;
  reason: string;
}

interface AppData {
  players: Player[];
  games: Game[];
  version: number;
}
```

## Common Patterns

**Points Calculation**:
```typescript
totalPoints = made1pt + (made2pt * 2) + (made3pt * 3)
```

**Attending Players Filter**:
```typescript
const attending = players.filter(p => game.attendance.includes(p.id))
```

**On-Court Check**:
```typescript
const isOnCourt = rotation.playersOnCourt.includes(playerId)
```
