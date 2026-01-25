import type { Game, RotationRecommendation } from '@/types';
import { StorageService } from './storage';
import { StatsService } from './stats';

export class RotationService {
  /**
   * Recommends players for the next rotation based on:
   * 1. Least normalized play time (total minutes / games attended)
   * 2. Tie-breaker: least total play time
   */
  static recommendPlayers(
    gameId: string,
    count: number = 5,
    excludePlayerIds: string[] = []
  ): RotationRecommendation[] {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const players = StorageService.getPlayers();
    const attendingPlayerIds = game.attendance;

    // Get season stats for all attending players
    const recommendations: RotationRecommendation[] = [];

    for (const playerId of attendingPlayerIds) {
      // Skip players in exclude list (e.g., currently on court)
      if (excludePlayerIds.includes(playerId)) {
        continue;
      }

      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      const seasonStats = StatsService.getPlayerSeasonStats(playerId);

      recommendations.push({
        playerId,
        playerName: player.name,
        playerNumber: player.number,
        normalizedPlayTime: seasonStats.normalizedPlayTime,
        totalPlayTime: seasonStats.playTimeMinutes,
        gamesAttended: seasonStats.gamesAttended,
        reason: this.generateReason(seasonStats.normalizedPlayTime, seasonStats.playTimeMinutes),
      });
    }

    // Sort by normalized play time (ascending), then by total play time (ascending)
    recommendations.sort((a, b) => {
      if (a.normalizedPlayTime !== b.normalizedPlayTime) {
        return a.normalizedPlayTime - b.normalizedPlayTime;
      }
      return a.totalPlayTime - b.totalPlayTime;
    });

    return recommendations.slice(0, count);
  }

  /**
   * Get current players on court for the current rotation
   */
  static getCurrentPlayersOnCourt(gameId: string): string[] {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game || !game.currentQuarter || !game.currentSwap) {
      return [];
    }

    const currentRotation = game.rotations.find(
      r => r.quarter === game.currentQuarter && r.swap === game.currentSwap
    );

    return currentRotation?.playersOnCourt || [];
  }

  /**
   * Check if a player is currently on the court
   */
  static isPlayerOnCourt(gameId: string, playerId: string): boolean {
    const playersOnCourt = this.getCurrentPlayersOnCourt(gameId);
    return playersOnCourt.includes(playerId);
  }

  /**
   * Get available players for substitution (attending but not on court)
   */
  static getAvailablePlayers(gameId: string): string[] {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      return [];
    }

    const playersOnCourt = this.getCurrentPlayersOnCourt(gameId);
    return game.attendance.filter(playerId => !playersOnCourt.includes(playerId));
  }

  /**
   * Calculate rotation number (1-8) based on quarter and swap
   */
  static getRotationNumber(quarter: number, swap: number): number {
    return (quarter - 1) * 2 + swap;
  }

  /**
   * Get next quarter and swap
   */
  static getNextQuarterSwap(quarter: number, swap: number): { quarter: number; swap: number } | null {
    if (swap === 1) {
      return { quarter, swap: 2 };
    } else if (quarter < 4) {
      return { quarter: quarter + 1, swap: 1 };
    }
    return null; // Game is over
  }

  private static generateReason(normalizedPlayTime: number, totalPlayTime: number): string {
    if (normalizedPlayTime === 0 && totalPlayTime === 0) {
      return 'Has not played yet this season';
    }
    if (normalizedPlayTime < 16) {
      return 'Below average play time per game';
    }
    if (totalPlayTime < 32) {
      return 'Low total season play time';
    }
    return 'Balanced play time';
  }
}
