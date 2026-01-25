import type { Game, GameStatus, Quarter, SwapNumber, Rotation } from '@/types';
import { StorageService } from './storage';

export class GameService {
  static getAllGames(): Game[] {
    return StorageService.getGames().sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  static getGameById(id: string): Game | undefined {
    const games = StorageService.getGames();
    return games.find(g => g.id === id);
  }

  static getUpcomingGames(): Game[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return this.getAllGames().filter(
      g => new Date(g.date) >= now && g.status === 'scheduled'
    );
  }

  static getCompletedGames(): Game[] {
    return this.getAllGames().filter(g => g.status === 'completed');
  }

  static getInProgressGame(): Game | undefined {
    const games = StorageService.getGames();
    return games.find(g => g.status === 'in-progress');
  }

  static createGame(opponent: string, date: string, location: string): Game {
    const games = StorageService.getGames();

    const newGame: Game = {
      id: crypto.randomUUID(),
      opponent: opponent.trim(),
      date,
      location: location.trim(),
      attendance: [],
      rotations: [],
      stats: {},
      status: 'scheduled',
      createdAt: Date.now(),
    };

    games.push(newGame);
    StorageService.saveGames(games);

    return newGame;
  }

  static updateGame(
    id: string,
    updates: Partial<Omit<Game, 'id' | 'createdAt'>>
  ): Game {
    const games = StorageService.getGames();
    const index = games.findIndex(g => g.id === id);

    if (index === -1) {
      throw new Error('Game not found');
    }

    const updatedGame: Game = {
      ...games[index],
      ...updates,
    };

    games[index] = updatedGame;
    StorageService.saveGames(games);

    return updatedGame;
  }

  static deleteGame(id: string): void {
    const games = StorageService.getGames();
    const filtered = games.filter(g => g.id !== id);

    if (filtered.length === games.length) {
      throw new Error('Game not found');
    }

    StorageService.saveGames(filtered);
  }

  static setAttendance(gameId: string, playerIds: string[]): Game {
    return this.updateGame(gameId, { attendance: playerIds });
  }

  static startGame(gameId: string): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.attendance.length === 0) {
      throw new Error('Cannot start game without players in attendance');
    }

    return this.updateGame(gameId, {
      status: 'in-progress',
      currentQuarter: 1,
      currentSwap: 1,
    });
  }

  static endGame(gameId: string): Game {
    return this.updateGame(gameId, {
      status: 'completed',
    });
  }

  static addRotation(gameId: string, rotation: Rotation): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (rotation.playersOnCourt.length < 1 || rotation.playersOnCourt.length > 5) {
      throw new Error('Rotation must have between 1 and 5 players on court');
    }

    const rotations = [...game.rotations, rotation];
    return this.updateGame(gameId, { rotations });
  }

  static updateRotation(
    gameId: string,
    quarter: Quarter,
    swap: SwapNumber,
    updates: Partial<Rotation>
  ): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const rotations = game.rotations.map(r => {
      if (r.quarter === quarter && r.swap === swap) {
        return { ...r, ...updates };
      }
      return r;
    });

    return this.updateGame(gameId, { rotations });
  }

  static setCurrentQuarterSwap(
    gameId: string,
    quarter: Quarter,
    swap: SwapNumber
  ): Game {
    return this.updateGame(gameId, {
      currentQuarter: quarter,
      currentSwap: swap,
    });
  }

  static substitutePlayer(
    gameId: string,
    quarter: Quarter,
    swap: SwapNumber,
    playerOutId: string,
    playerInId: string,
    minutesForEach: number = 2
  ): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Find the rotation to split
    const rotationIndex = game.rotations.findIndex(
      r => r.quarter === quarter && r.swap === swap
    );

    if (rotationIndex === -1) {
      throw new Error('Rotation not found');
    }

    const originalRotation = game.rotations[rotationIndex];
    const playersOnCourt = [...originalRotation.playersOnCourt];

    if (!playersOnCourt.includes(playerOutId)) {
      throw new Error('Player to substitute out is not on court');
    }

    // Replace the player
    const playerIndex = playersOnCourt.indexOf(playerOutId);
    playersOnCourt[playerIndex] = playerInId;

    // Update the rotation with reduced minutes
    const rotations = [...game.rotations];
    rotations[rotationIndex] = {
      ...originalRotation,
      minutes: minutesForEach,
    };

    // Add a new rotation for the substituted players
    rotations.push({
      quarter,
      swap,
      playersOnCourt,
      minutes: minutesForEach,
    });

    return this.updateGame(gameId, { rotations });
  }
}
