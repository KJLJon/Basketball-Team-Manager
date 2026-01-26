import type { Game, Player, PlayerStats, PlayerSeasonStats } from '@/types';
import { StorageService } from './storage';

export class StatsService {
  static getPlayerGameStats(gameId: string, playerId: string): PlayerStats {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const stats = game.stats[playerId];
    if (!stats) {
      return this.createEmptyStats(playerId, gameId);
    }

    return {
      playerId,
      gameId,
      ...stats,
    };
  }

  static updatePlayerGameStats(
    gameId: string,
    playerId: string,
    updates: Partial<Omit<PlayerStats, 'playerId' | 'gameId'>>
  ): void {
    const games = StorageService.getGames();
    const gameIndex = games.findIndex(g => g.id === gameId);

    if (gameIndex === -1) {
      throw new Error('Game not found');
    }

    const game = games[gameIndex];
    const currentStats = game.stats[playerId] || this.createEmptyStats(playerId, gameId);

    game.stats[playerId] = {
      ...currentStats,
      ...updates,
    };

    StorageService.saveGames(games);
  }

  static incrementStat(
    gameId: string,
    playerId: string,
    stat: keyof Omit<PlayerStats, 'playerId' | 'gameId'>
  ): void {
    const currentStats = this.getPlayerGameStats(gameId, playerId);
    this.updatePlayerGameStats(gameId, playerId, {
      [stat]: (currentStats[stat] as number) + 1,
    });
  }

  static calculatePlayTime(gameId: string, playerId: string): number {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      return 0;
    }

    let totalMinutes = 0;
    for (const rotation of game.rotations) {
      if (rotation.playersOnCourt.includes(playerId)) {
        totalMinutes += rotation.minutes;
      }
    }

    return totalMinutes;
  }

  static updatePlayTimeForGame(gameId: string): void {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      return;
    }

    // Calculate play time for each player in attendance
    for (const playerId of game.attendance) {
      const playTime = this.calculatePlayTime(gameId, playerId);
      this.updatePlayerGameStats(gameId, playerId, {
        playTimeMinutes: playTime,
      });
    }
  }

  static getPlayerSeasonStats(playerId: string): PlayerSeasonStats {
    const games = StorageService.getGames();
    const player = StorageService.getPlayers().find(p => p.id === playerId);

    if (!player) {
      throw new Error('Player not found');
    }

    let gamesPlayed = 0;
    let gamesAttended = 0;
    let effectiveGamesAttended = 0; // Accounts for partial attendance
    let totalPlayTime = 0;
    let totalStats = {
      steals: 0,
      rebounds: 0,
      attempts1pt: 0,
      made1pt: 0,
      attempts2pt: 0,
      made2pt: 0,
      attempts3pt: 0,
      made3pt: 0,
    };

    for (const game of games) {
      if (game.attendance.includes(playerId)) {
        gamesAttended++;

        // Calculate effective attendance based on swaps attended (X/8 swaps = X/8 of a game)
        const stats = game.stats[playerId];
        const swapsAttended = stats?.swapsAttended ?? 8; // Default to 8 if not set (full attendance)
        effectiveGamesAttended += swapsAttended / 8;

        const playTime = this.calculatePlayTime(game.id, playerId);
        if (playTime > 0) {
          gamesPlayed++;
        }
        totalPlayTime += playTime;

        if (stats) {
          totalStats.steals += stats.steals;
          totalStats.rebounds += stats.rebounds;
          totalStats.attempts1pt += stats.attempts1pt;
          totalStats.made1pt += stats.made1pt;
          totalStats.attempts2pt += stats.attempts2pt;
          totalStats.made2pt += stats.made2pt;
          totalStats.attempts3pt += stats.attempts3pt;
          totalStats.made3pt += stats.made3pt;
        }
      }
    }

    const totalAttempts = totalStats.attempts1pt + totalStats.attempts2pt + totalStats.attempts3pt;
    const totalMade = totalStats.made1pt + totalStats.made2pt + totalStats.made3pt;
    const fieldGoalPercentage = totalAttempts > 0 ? (totalMade / totalAttempts) * 100 : 0;

    const totalPoints =
      totalStats.made1pt * 1 +
      totalStats.made2pt * 2 +
      totalStats.made3pt * 3;

    // Use effectiveGamesAttended for normalized play time to account for partial attendance
    const normalizedPlayTime = effectiveGamesAttended > 0 ? totalPlayTime / effectiveGamesAttended : 0;

    return {
      playerId,
      gameId: '', // Not applicable for season stats
      gamesPlayed,
      gamesAttended,
      playTimeMinutes: totalPlayTime,
      normalizedPlayTime,
      totalPoints,
      fieldGoalPercentage,
      ...totalStats,
    };
  }

  static getAllPlayerSeasonStats(): PlayerSeasonStats[] {
    const players = StorageService.getPlayers();
    return players.map(p => this.getPlayerSeasonStats(p.id));
  }

  private static createEmptyStats(playerId: string, gameId: string): PlayerStats {
    return {
      playerId,
      gameId,
      steals: 0,
      rebounds: 0,
      attempts1pt: 0,
      made1pt: 0,
      attempts2pt: 0,
      made2pt: 0,
      attempts3pt: 0,
      made3pt: 0,
      playTimeMinutes: 0,
    };
  }
}
