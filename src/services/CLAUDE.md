# Services Guide

## GameService (game.ts)
Game lifecycle and rotation management.

**Static Methods**:
```typescript
// CRUD
getAllGames(): Game[]
getGameById(id: string): Game | undefined
createGame(opponent, date, location): Game
updateGame(id, updates): Game
deleteGame(id): void

// Game State
getUpcomingGames(): Game[]
getCompletedGames(): Game[]
getInProgressGame(): Game | undefined
startGame(gameId): Game        // Sets status='in-progress', Q1S1
endGame(gameId): Game          // Sets status='completed'

// Attendance & Rotations
setAttendance(gameId, playerIds[]): Game
addRotation(gameId, rotation): Game
updateRotation(gameId, quarter, swap, updates): Game
setCurrentQuarterSwap(gameId, quarter, swap): Game

// Substitution (mid-swap)
substitutePlayer(gameId, quarter, swap, outId, inId, minutesEach=2): Game
// Creates two rotations: original with reduced minutes, new with swapped player
```

## RotationService (rotation.ts)
Smart player recommendations and rotation calculations.

**Static Methods**:
```typescript
// Recommendations (sorted by lowest normalized play time)
recommendPlayers(gameId, count=5, excludeIds=[]): RotationRecommendation[]
// Returns: { playerId, playerName, playerNumber, normalizedPlayTime, totalPlayTime, gamesAttended, reason }

// Current State
getCurrentPlayersOnCourt(gameId): string[]
isPlayerOnCourt(gameId, playerId): boolean
getAvailablePlayers(gameId): string[]  // Attending but not on court

// Calculations
getRotationNumber(quarter, swap): number  // 1-8
getNextQuarterSwap(quarter, swap): { quarter, swap } | null
```

## StatsService (stats.ts)
Player statistics tracking and aggregation.

**Static Methods**:
```typescript
// Game Stats
getPlayerGameStats(gameId, playerId): PlayerStats
updatePlayerGameStats(gameId, playerId, updates): void
incrementStat(gameId, playerId, stat): void

// Season Stats
getPlayerSeasonStats(playerId): PlayerSeasonStats
getAllPlayerSeasonStats(): PlayerSeasonStats[]

// Play Time
calculatePlayTime(gameId, playerId): number
updatePlayTimeForGame(gameId): void  // Syncs rotation minutes to stats
```

## StorageService (storage.ts)
localStorage abstraction with JSON serialization.

```typescript
getPlayers(): Player[]
savePlayers(players): void
getGames(): Game[]
saveGames(games): void
```

## Key Algorithms

### Fair Play Time Calculation
`normalizedPlayTime = totalPlayTimeMinutes / gamesAttended`

Recommendations sorted by:
1. Lowest normalized play time (primary)
2. Lowest total play time (tie-breaker)

### Rotation Number Formula
`rotationNumber = (quarter - 1) * 2 + swap`
- Q1S1 = 1, Q1S2 = 2, Q2S1 = 3, ... Q4S2 = 8
