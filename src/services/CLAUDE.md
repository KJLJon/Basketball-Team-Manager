# Services

**GameService** (game.ts): CRUD games, startGame, endGame, setAttendance, addRotation, updateRotation, setCurrentQuarterSwap, substitutePlayer (mid-swap, minutesEach=2)

**RotationService** (rotation.ts): recommendPlayers (sorted by normalized play time), getCurrentPlayersOnCourt, isPlayerOnCourt, getAvailablePlayers, getRotationNumber (1-8)

**StatsService** (stats.ts): getPlayerGameStats, updatePlayerGameStats, incrementStat, getPlayerSeasonStats, getAllPlayerSeasonStats, calculatePlayTime, updatePlayTimeForGame

**StorageService** (storage.ts): getPlayers, savePlayers, getGames, saveGames

**Fair Play**: `normalizedPlayTime = totalPlayTime / gamesAttended`. Recommendations sort by lowest normalized time.

**Rotation #**: `(quarter-1)*2 + swap` (Q1S1=1, Q4S2=8)
