# Types

All in `/src/types/index.ts`

**Player**: id, name, number, createdAt

**Game**: id, opponent, date, location, attendance (player IDs), rotations, stats (Record<playerId, PlayerStats>), status (scheduled/in-progress/completed), currentQuarter?, currentSwap?

**Rotation**: quarter (1-4), swap (1-2), playersOnCourt (5 IDs), minutes (4 or 2 for partial)

**PlayerStats**: playerId, gameId, steals, rebounds, attempts/made for 1pt/2pt/3pt, playTimeMinutes

**PlayerSeasonStats**: extends PlayerStats + gamesPlayed, gamesAttended, normalizedPlayTime (playTime/gamesAttended), totalPoints, fieldGoalPercentage

**RotationRecommendation**: playerId, playerName, playerNumber, normalizedPlayTime, totalPlayTime, gamesAttended, reason

**Points**: `made1pt + (made2pt*2) + (made3pt*3)`
