import type { Player } from '@/types';
import { StorageService } from './storage';

export class PlayerService {
  static getAllPlayers(): Player[] {
    return StorageService.getPlayers();
  }

  static getPlayerById(id: string): Player | undefined {
    const players = StorageService.getPlayers();
    return players.find(p => p.id === id);
  }

  static createPlayer(name: string, number: string): Player {
    const players = StorageService.getPlayers();

    // Validate unique number
    if (players.some(p => p.number === number)) {
      throw new Error(`Player number ${number} is already taken`);
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      number: number.trim(),
      createdAt: Date.now(),
    };

    players.push(newPlayer);
    StorageService.savePlayers(players);

    return newPlayer;
  }

  static updatePlayer(id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>): Player {
    const players = StorageService.getPlayers();
    const index = players.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Player not found');
    }

    // If updating number, check it's unique
    if (updates.number && updates.number !== players[index].number) {
      if (players.some(p => p.id !== id && p.number === updates.number)) {
        throw new Error(`Player number ${updates.number} is already taken`);
      }
    }

    const updatedPlayer: Player = {
      ...players[index],
      ...(updates.name && { name: updates.name.trim() }),
      ...(updates.number && { number: updates.number.trim() }),
    };

    players[index] = updatedPlayer;
    StorageService.savePlayers(players);

    return updatedPlayer;
  }

  static deletePlayer(id: string): void {
    const players = StorageService.getPlayers();
    const filtered = players.filter(p => p.id !== id);

    if (filtered.length === players.length) {
      throw new Error('Player not found');
    }

    StorageService.savePlayers(filtered);

    // Also remove player from all games
    const games = StorageService.getGames();
    const updatedGames = games.map(game => ({
      ...game,
      attendance: game.attendance.filter(pId => pId !== id),
      rotations: game.rotations.map(rotation => ({
        ...rotation,
        playersOnCourt: rotation.playersOnCourt.filter(pId => pId !== id),
      })),
      stats: Object.fromEntries(
        Object.entries(game.stats).filter(([playerId]) => playerId !== id)
      ),
    }));
    StorageService.saveGames(updatedGames);
  }

  static searchPlayers(query: string): Player[] {
    const players = StorageService.getPlayers();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return players;
    }

    return players.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.number.includes(lowerQuery)
    );
  }
}
