import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlayerService } from '../src/services/player';
import { StorageService } from '../src/services/storage';

describe('PlayerService', () => {
  beforeEach(() => {
    StorageService.clear();
  });

  afterEach(() => {
    StorageService.clear();
  });

  describe('createPlayer', () => {
    it('should create a new player', () => {
      const player = PlayerService.createPlayer('John Doe', '23');

      expect(player).toMatchObject({
        name: 'John Doe',
        number: '23',
      });
      expect(player.id).toBeDefined();
      expect(player.createdAt).toBeDefined();
    });

    it('should throw error for duplicate player number', () => {
      PlayerService.createPlayer('John Doe', '23');

      expect(() => {
        PlayerService.createPlayer('Jane Smith', '23');
      }).toThrow('Player number 23 is already taken');
    });

    it('should trim whitespace from name and number', () => {
      const player = PlayerService.createPlayer('  John Doe  ', '  23  ');

      expect(player.name).toBe('John Doe');
      expect(player.number).toBe('23');
    });
  });

  describe('getAllPlayers', () => {
    it('should return empty array when no players exist', () => {
      const players = PlayerService.getAllPlayers();
      expect(players).toEqual([]);
    });

    it('should return all players', () => {
      PlayerService.createPlayer('John Doe', '23');
      PlayerService.createPlayer('Jane Smith', '42');

      const players = PlayerService.getAllPlayers();
      expect(players).toHaveLength(2);
    });
  });

  describe('updatePlayer', () => {
    it('should update player name', () => {
      const player = PlayerService.createPlayer('John Doe', '23');
      const updated = PlayerService.updatePlayer(player.id, { name: 'Johnny Doe' });

      expect(updated.name).toBe('Johnny Doe');
      expect(updated.number).toBe('23');
    });

    it('should update player number', () => {
      const player = PlayerService.createPlayer('John Doe', '23');
      const updated = PlayerService.updatePlayer(player.id, { number: '24' });

      expect(updated.number).toBe('24');
    });

    it('should throw error when updating to duplicate number', () => {
      const player1 = PlayerService.createPlayer('John Doe', '23');
      PlayerService.createPlayer('Jane Smith', '42');

      expect(() => {
        PlayerService.updatePlayer(player1.id, { number: '42' });
      }).toThrow('Player number 42 is already taken');
    });

    it('should throw error for non-existent player', () => {
      expect(() => {
        PlayerService.updatePlayer('non-existent-id', { name: 'Test' });
      }).toThrow('Player not found');
    });
  });

  describe('deletePlayer', () => {
    it('should delete a player', () => {
      const player = PlayerService.createPlayer('John Doe', '23');
      PlayerService.deletePlayer(player.id);

      const players = PlayerService.getAllPlayers();
      expect(players).toHaveLength(0);
    });

    it('should throw error for non-existent player', () => {
      expect(() => {
        PlayerService.deletePlayer('non-existent-id');
      }).toThrow('Player not found');
    });
  });

  describe('searchPlayers', () => {
    beforeEach(() => {
      PlayerService.createPlayer('John Doe', '23');
      PlayerService.createPlayer('Jane Smith', '42');
      PlayerService.createPlayer('Bob Johnson', '15');
    });

    it('should return all players for empty query', () => {
      const results = PlayerService.searchPlayers('');
      expect(results).toHaveLength(3);
    });

    it('should search by name (case insensitive)', () => {
      const results = PlayerService.searchPlayers('john');
      expect(results).toHaveLength(2); // John Doe and Bob Johnson
    });

    it('should search by number', () => {
      const results = PlayerService.searchPlayers('23');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Doe');
    });
  });
});
