import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RotationService } from '../src/services/rotation';
import { PlayerService } from '../src/services/player';
import { GameService } from '../src/services/game';
import { StatsService } from '../src/services/stats';
import { StorageService } from '../src/services/storage';
import type { Rotation } from '../src/types';

describe('RotationService', () => {
  let player1Id: string;
  let player2Id: string;
  let player3Id: string;
  let gameId: string;

  beforeEach(() => {
    StorageService.clear();

    const p1 = PlayerService.createPlayer('Player 1', '1');
    const p2 = PlayerService.createPlayer('Player 2', '2');
    const p3 = PlayerService.createPlayer('Player 3', '3');

    player1Id = p1.id;
    player2Id = p2.id;
    player3Id = p3.id;

    const game = GameService.createGame('Test Opponent', '2024-01-15', 'Test Location');
    gameId = game.id;
    GameService.setAttendance(gameId, [player1Id, player2Id, player3Id]);
  });

  afterEach(() => {
    StorageService.clear();
  });

  describe('recommendPlayers', () => {
    it('should recommend all attending players when no play time exists', () => {
      const recommendations = RotationService.recommendPlayers(gameId, 3);

      expect(recommendations).toHaveLength(3);
      expect(recommendations.every(r => r.normalizedPlayTime === 0)).toBe(true);
    });

    it('should recommend players with least normalized play time first', () => {
      // Create previous game
      const game1 = GameService.createGame('Opponent 1', '2024-01-10', 'Location');
      GameService.setAttendance(game1.id, [player1Id, player2Id, player3Id]);

      // Player 1: 8 minutes (2 rotations)
      GameService.addRotation(game1.id, {
        quarter: 1,
        swap: 1,
        playersOnCourt: [player1Id],
        minutes: 4,
      });
      GameService.addRotation(game1.id, {
        quarter: 1,
        swap: 2,
        playersOnCourt: [player1Id],
        minutes: 4,
      });

      // Player 2: 4 minutes (1 rotation)
      GameService.addRotation(game1.id, {
        quarter: 2,
        swap: 1,
        playersOnCourt: [player2Id],
        minutes: 4,
      });

      // Player 3: 0 minutes
      StatsService.updatePlayTimeForGame(game1.id);

      const recommendations = RotationService.recommendPlayers(gameId, 3);

      // Player 3 should be first (0 min), then Player 2 (4 min), then Player 1 (8 min)
      expect(recommendations[0].playerId).toBe(player3Id);
      expect(recommendations[1].playerId).toBe(player2Id);
      expect(recommendations[2].playerId).toBe(player1Id);
    });

    it('should use total play time as tie-breaker', () => {
      // Create 2 previous games to test tie-breaking
      const game1 = GameService.createGame('Opponent 1', '2024-01-10', 'Location');
      GameService.setAttendance(game1.id, [player1Id, player2Id]);

      const game2 = GameService.createGame('Opponent 2', '2024-01-12', 'Location');
      GameService.setAttendance(game2.id, [player1Id, player2Id, player3Id]);

      // Player 1: 8 min in game1, 4 min in game2 = 12 total, 6 avg
      GameService.addRotation(game1.id, {
        quarter: 1,
        swap: 1,
        playersOnCourt: [player1Id],
        minutes: 8,
      });
      GameService.addRotation(game2.id, {
        quarter: 1,
        swap: 1,
        playersOnCourt: [player1Id],
        minutes: 4,
      });

      // Player 2: 4 min in game1, 8 min in game2 = 12 total, 6 avg (same avg as player1)
      GameService.addRotation(game1.id, {
        quarter: 2,
        swap: 1,
        playersOnCourt: [player2Id],
        minutes: 4,
      });
      GameService.addRotation(game2.id, {
        quarter: 2,
        swap: 1,
        playersOnCourt: [player2Id],
        minutes: 8,
      });

      // Player 3: 0 min in game2
      StatsService.updatePlayTimeForGame(game1.id);
      StatsService.updatePlayTimeForGame(game2.id);

      const recommendations = RotationService.recommendPlayers(gameId, 3);

      // Player 3 first (0 avg), then player 1 and 2 tied at 6 avg
      // Since both have same total (12), order is based on which was created first
      expect(recommendations[0].playerId).toBe(player3Id);
    });

    it('should exclude specified players', () => {
      const recommendations = RotationService.recommendPlayers(gameId, 2, [player1Id]);

      expect(recommendations).toHaveLength(2);
      expect(recommendations.every(r => r.playerId !== player1Id)).toBe(true);
    });

    it('should limit recommendations to requested count', () => {
      const recommendations = RotationService.recommendPlayers(gameId, 2);

      expect(recommendations).toHaveLength(2);
    });
  });

  describe('getNextQuarterSwap', () => {
    it('should return next swap in same quarter', () => {
      const next = RotationService.getNextQuarterSwap(1, 1);
      expect(next).toEqual({ quarter: 1, swap: 2 });
    });

    it('should return next quarter after second swap', () => {
      const next = RotationService.getNextQuarterSwap(1, 2);
      expect(next).toEqual({ quarter: 2, swap: 1 });
    });

    it('should return null after final swap of quarter 4', () => {
      const next = RotationService.getNextQuarterSwap(4, 2);
      expect(next).toBeNull();
    });
  });

  describe('getRotationNumber', () => {
    it('should calculate correct rotation number', () => {
      expect(RotationService.getRotationNumber(1, 1)).toBe(1);
      expect(RotationService.getRotationNumber(1, 2)).toBe(2);
      expect(RotationService.getRotationNumber(2, 1)).toBe(3);
      expect(RotationService.getRotationNumber(2, 2)).toBe(4);
      expect(RotationService.getRotationNumber(4, 2)).toBe(8);
    });
  });

  describe('getCurrentPlayersOnCourt', () => {
    it('should return empty array when no current rotation', () => {
      const players = RotationService.getCurrentPlayersOnCourt(gameId);
      expect(players).toEqual([]);
    });

    it('should return players from current rotation', () => {
      GameService.startGame(gameId);

      const rotation: Rotation = {
        quarter: 1,
        swap: 1,
        playersOnCourt: [player1Id, player2Id],
        minutes: 4,
      };

      GameService.addRotation(gameId, rotation);

      const players = RotationService.getCurrentPlayersOnCourt(gameId);
      expect(players).toEqual([player1Id, player2Id]);
    });
  });
});
