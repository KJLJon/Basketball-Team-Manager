import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StatsService } from '../src/services/stats';
import { PlayerService } from '../src/services/player';
import { GameService } from '../src/services/game';
import { StorageService } from '../src/services/storage';
import type { Rotation } from '../src/types';

describe('StatsService', () => {
  let playerId: string;
  let gameId: string;

  beforeEach(() => {
    StorageService.clear();
    const player = PlayerService.createPlayer('John Doe', '23');
    playerId = player.id;

    const game = GameService.createGame('Test Opponent', '2024-01-15', 'Test Location');
    gameId = game.id;
  });

  afterEach(() => {
    StorageService.clear();
  });

  describe('incrementStat', () => {
    it('should increment a stat value', () => {
      StatsService.incrementStat(gameId, playerId, 'steals');
      const stats = StatsService.getPlayerGameStats(gameId, playerId);

      expect(stats.steals).toBe(1);
    });

    it('should increment multiple times', () => {
      StatsService.incrementStat(gameId, playerId, 'rebounds');
      StatsService.incrementStat(gameId, playerId, 'rebounds');
      StatsService.incrementStat(gameId, playerId, 'rebounds');

      const stats = StatsService.getPlayerGameStats(gameId, playerId);
      expect(stats.rebounds).toBe(3);
    });
  });

  describe('calculatePlayTime', () => {
    it('should return 0 for player not in rotations', () => {
      const playTime = StatsService.calculatePlayTime(gameId, playerId);
      expect(playTime).toBe(0);
    });

    it('should calculate play time from rotations', () => {
      const rotation1: Rotation = {
        quarter: 1,
        swap: 1,
        playersOnCourt: [playerId],
        minutes: 4,
      };

      const rotation2: Rotation = {
        quarter: 1,
        swap: 2,
        playersOnCourt: [playerId],
        minutes: 4,
      };

      GameService.addRotation(gameId, rotation1);
      GameService.addRotation(gameId, rotation2);

      const playTime = StatsService.calculatePlayTime(gameId, playerId);
      expect(playTime).toBe(8);
    });

    it('should handle partial swaps (2 minute rotations)', () => {
      const rotation: Rotation = {
        quarter: 1,
        swap: 1,
        playersOnCourt: [playerId],
        minutes: 2, // Partial swap
      };

      GameService.addRotation(gameId, rotation);

      const playTime = StatsService.calculatePlayTime(gameId, playerId);
      expect(playTime).toBe(2);
    });
  });

  describe('getPlayerSeasonStats', () => {
    it('should return zero stats for player with no games', () => {
      const stats = StatsService.getPlayerSeasonStats(playerId);

      expect(stats).toMatchObject({
        playerId,
        gamesPlayed: 0,
        gamesAttended: 0,
        playTimeMinutes: 0,
        normalizedPlayTime: 0,
        totalPoints: 0,
        steals: 0,
        rebounds: 0,
      });
    });

    it('should calculate season stats correctly', () => {
      // Set attendance
      GameService.setAttendance(gameId, [playerId]);

      // Add rotation
      const rotation: Rotation = {
        quarter: 1,
        swap: 1,
        playersOnCourt: [playerId],
        minutes: 4,
      };
      GameService.addRotation(gameId, rotation);

      // Add stats
      StatsService.incrementStat(gameId, playerId, 'steals');
      StatsService.incrementStat(gameId, playerId, 'rebounds');
      StatsService.incrementStat(gameId, playerId, 'made2pt');
      StatsService.incrementStat(gameId, playerId, 'attempts2pt');

      // Update play time
      StatsService.updatePlayTimeForGame(gameId);

      const stats = StatsService.getPlayerSeasonStats(playerId);

      expect(stats.gamesAttended).toBe(1);
      expect(stats.gamesPlayed).toBe(1);
      expect(stats.playTimeMinutes).toBe(4);
      expect(stats.normalizedPlayTime).toBe(4);
      expect(stats.steals).toBe(1);
      expect(stats.rebounds).toBe(1);
      expect(stats.made2pt).toBe(1);
      expect(stats.totalPoints).toBe(2);
    });

    it('should calculate field goal percentage correctly', () => {
      GameService.setAttendance(gameId, [playerId]);

      // 2 made out of 5 attempts = 40%
      for (let i = 0; i < 5; i++) {
        StatsService.incrementStat(gameId, playerId, 'attempts2pt');
      }
      for (let i = 0; i < 2; i++) {
        StatsService.incrementStat(gameId, playerId, 'made2pt');
      }

      const stats = StatsService.getPlayerSeasonStats(playerId);
      expect(stats.fieldGoalPercentage).toBe(40);
    });

    it('should handle 0 attempts for field goal percentage', () => {
      const stats = StatsService.getPlayerSeasonStats(playerId);
      expect(stats.fieldGoalPercentage).toBe(0);
    });
  });
});
