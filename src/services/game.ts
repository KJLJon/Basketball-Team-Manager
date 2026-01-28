import type { Game, GameStatus, Quarter, SwapNumber, Rotation, ManualRotationSelection } from '@/types';
import { StorageService } from './storage';
import { PlayerService } from './player';

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
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Calculate current rotation number (1-8) for partial attendance tracking
    const currentRotationNumber = game.currentQuarter && game.currentSwap
      ? ((game.currentQuarter - 1) * 2) + game.currentSwap
      : 0;

    // Initialize stats for all players if not present
    const stats = { ...game.stats };

    // Track partial attendance for players being added or removed mid-game
    playerIds.forEach(playerId => {
      if (!game.attendance.includes(playerId)) {
        // Player being added mid-game (late arrival)
        stats[playerId] = stats[playerId] || {
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
        // Set swaps attended = remaining swaps (8 - current + 1)
        stats[playerId].swapsAttended = currentRotationNumber > 0
          ? Math.max(0, 8 - currentRotationNumber + 1)
          : 8;
      }
    });

    // Players being removed mid-game (early departure)
    game.attendance.forEach(playerId => {
      if (!playerIds.includes(playerId) && stats[playerId]) {
        // Set swaps attended = rotations already played
        stats[playerId].swapsAttended = currentRotationNumber > 0
          ? currentRotationNumber - 1
          : 0;
      }
    });

    return this.updateGame(gameId, {
      attendance: playerIds,
      stats
    });
  }

  static startGame(gameId: string): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Get all players and assume they're all attending initially
    const allPlayers = PlayerService.getAllPlayers();

    // If attendance is empty, set all players as attending
    const attendance = game.attendance.length > 0
      ? game.attendance
      : allPlayers.map(p => p.id);

    if (attendance.length === 0) {
      throw new Error('Cannot start game without any players on the team');
    }

    // Initialize stats for all attending players
    const stats = { ...game.stats };
    attendance.forEach(playerId => {
      if (!stats[playerId]) {
        stats[playerId] = {
          steals: 0,
          rebounds: 0,
          attempts1pt: 0,
          made1pt: 0,
          attempts2pt: 0,
          made2pt: 0,
          attempts3pt: 0,
          made3pt: 0,
          playTimeMinutes: 0,
          swapsAttended: 8, // Assume full attendance initially
        };
      } else if (stats[playerId].swapsAttended === undefined) {
        stats[playerId].swapsAttended = 8;
      }
    });

    return this.updateGame(gameId, {
      status: 'in-progress',
      currentQuarter: 1,
      currentSwap: 1,
      attendance,
      stats,
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

    if (rotation.playersOnCourt.length < 1) {
      throw new Error('Rotation must have at least 1 player on court');
    }

    // Note: Allowing more than 5 players for injury scenarios where players share minutes

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
    minutesForEach: number = 2 // Deprecated parameter, kept for backward compatibility
  ): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Find the rotation for this quarter/swap
    const rotationIndex = game.rotations.findIndex(
      r => r.quarter === quarter && r.swap === swap
    );

    if (rotationIndex === -1) {
      throw new Error('Rotation not found');
    }

    const oldRotation = game.rotations[rotationIndex];

    if (!oldRotation.playersOnCourt.includes(playerOutId)) {
      throw new Error('Player to substitute out is not on court');
    }

    // Initialize playerMinutes if not present (migration from old format)
    let currentPlayerMinutes = oldRotation.playerMinutes;
    if (!currentPlayerMinutes) {
      currentPlayerMinutes = {};
      oldRotation.playersOnCourt.forEach(pid => {
        currentPlayerMinutes![pid] = oldRotation.minutes || 4;
      });
    }

    // Get current player's time
    const currentPlayerTime = currentPlayerMinutes[playerOutId] || 0;

    // Calculate time exchanged: floor(currentPlayerTime / 2), clamped between 1-4
    const timeExchanged = Math.max(1, Math.min(4, Math.floor(currentPlayerTime / 2)));

    // Update times for both players
    const newPlayerOutTime = currentPlayerTime - timeExchanged;
    const newPlayerInTime = (currentPlayerMinutes[playerInId] || 0) + timeExchanged;

    // Cap the new player's time at 4 minutes max
    const cappedPlayerInTime = Math.min(4, newPlayerInTime);

    // Create new playerMinutes object with updated times
    const newPlayerMinutes = { ...currentPlayerMinutes };

    // Update or remove player out's time
    if (newPlayerOutTime > 0) {
      // Keep their time tracked (they're on bench with remaining time)
      newPlayerMinutes[playerOutId] = newPlayerOutTime;
    } else {
      // Remove completely if 0 minutes
      delete newPlayerMinutes[playerOutId];
    }

    // Update player in's time
    newPlayerMinutes[playerInId] = cappedPlayerInTime;

    // Create new playersOnCourt array
    // ALWAYS remove player out from court (they go to bench)
    let newPlayersOnCourt = oldRotation.playersOnCourt.filter(pid => pid !== playerOutId);

    // Add player in to court if not already there
    if (!newPlayersOnCourt.includes(playerInId)) {
      newPlayersOnCourt.push(playerInId);
    }

    // Create new rotation object (immutable update)
    const newRotation = {
      ...oldRotation,
      playersOnCourt: newPlayersOnCourt,
      playerMinutes: newPlayerMinutes,
    };

    // Update the game with new rotation
    const rotations = [...game.rotations];
    rotations[rotationIndex] = newRotation;

    return this.updateGame(gameId, { rotations });
  }

  /**
   * Update individual player minutes in a specific rotation.
   * Supports custom minutes per player and >5 players for injury scenarios.
   */
  static updatePlayerMinutesInRotation(
    gameId: string,
    quarter: Quarter,
    swap: SwapNumber,
    playerId: string,
    minutes: number
  ): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (minutes < 0 || minutes > 8) {
      throw new Error('Minutes must be between 0 and 8');
    }

    // Find rotations for this quarter/swap
    const rotationIndices: number[] = [];
    game.rotations.forEach((r, index) => {
      if (r.quarter === quarter && r.swap === swap) {
        rotationIndices.push(index);
      }
    });

    const rotations = [...game.rotations];

    if (rotationIndices.length === 0) {
      // Create new rotation if none exists
      const newRotation: Rotation = {
        quarter,
        swap,
        playersOnCourt: [playerId],
        minutes: 4, // DEPRECATED field
        playerMinutes: { [playerId]: minutes },
      };
      rotations.push(newRotation);
    } else {
      // Find rotation containing this player, or use the first one
      let targetIndex = rotationIndices[0];
      for (const idx of rotationIndices) {
        if (rotations[idx].playersOnCourt.includes(playerId)) {
          targetIndex = idx;
          break;
        }
      }

      const rotation = rotations[targetIndex];

      if (minutes === 0) {
        // Remove player if minutes set to 0
        rotation.playersOnCourt = rotation.playersOnCourt.filter(
          id => id !== playerId
        );
        if (rotation.playerMinutes) {
          delete rotation.playerMinutes[playerId];
        }

        // Remove rotation if no players left
        if (rotation.playersOnCourt.length === 0) {
          rotations.splice(targetIndex, 1);
        }
      } else {
        // Add or update player
        if (!rotation.playersOnCourt.includes(playerId)) {
          rotation.playersOnCourt.push(playerId);
        }

        // Initialize playerMinutes if using old format
        if (!rotation.playerMinutes) {
          rotation.playerMinutes = {};
          rotation.playersOnCourt.forEach(pid => {
            rotation.playerMinutes![pid] = rotation.minutes || 4;
          });
        }

        rotation.playerMinutes[playerId] = minutes;
      }
    }

    return this.updateGame(gameId, { rotations });
  }

  /**
   * Update the number of swaps a player attended (0-8) for partial attendance tracking.
   * This is separate from play time minutes.
   */
  static updatePlayerSwapsAttended(
    gameId: string,
    playerId: string,
    swapsAttended: number
  ): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (swapsAttended < 0 || swapsAttended > 8) {
      throw new Error('Swaps attended must be between 0 and 8');
    }

    const stats = { ...game.stats };

    // Initialize stats if not present
    if (!stats[playerId]) {
      stats[playerId] = {
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

    stats[playerId].swapsAttended = swapsAttended;

    // Update attendance array based on swaps attended
    const attendance = [...game.attendance];
    if (swapsAttended > 0 && !attendance.includes(playerId)) {
      attendance.push(playerId);
    } else if (swapsAttended === 0 && attendance.includes(playerId)) {
      const index = attendance.indexOf(playerId);
      attendance.splice(index, 1);
    }

    return this.updateGame(gameId, {
      stats,
      attendance
    });
  }

  /**
   * Migrate all games from old minutes format to new playerMinutes format.
   * This converts rotation.minutes to rotation.playerMinutes for each player.
   */
  static migrateToPlayerMinutes(): void {
    const games = StorageService.getGames();
    let migrationNeeded = false;

    games.forEach(game => {
      game.rotations.forEach(rotation => {
        // Check if this rotation needs migration (has minutes but no playerMinutes)
        if (rotation.minutes !== undefined && !rotation.playerMinutes) {
          migrationNeeded = true;

          // Create playerMinutes mapping
          rotation.playerMinutes = {};
          rotation.playersOnCourt.forEach(playerId => {
            rotation.playerMinutes![playerId] = rotation.minutes;
          });
        }
      });
    });

    if (migrationNeeded) {
      StorageService.saveGames(games);
      console.log('Migrated games from old minutes format to playerMinutes format');
    }
  }

  /**
   * Get manual rotation selections for a game.
   */
  static getManualRotations(gameId: string): ManualRotationSelection {
    const game = this.getGameById(gameId);
    return game?.manualRotations || {};
  }

  /**
   * Set manual rotation selections for a game.
   */
  static setManualRotations(gameId: string, manualRotations: ManualRotationSelection): Game {
    return this.updateGame(gameId, { manualRotations });
  }

  /**
   * Toggle a player in a manual rotation slot.
   * If player is in the rotation, remove them. If not, add them.
   */
  static toggleManualRotationPlayer(
    gameId: string,
    quarter: Quarter,
    swap: SwapNumber,
    playerId: string
  ): Game {
    const game = this.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const key = `Q${quarter}S${swap}`;
    const manualRotations = { ...(game.manualRotations || {}) };
    const currentPlayers = manualRotations[key] || [];

    if (currentPlayers.includes(playerId)) {
      // Remove player
      manualRotations[key] = currentPlayers.filter(id => id !== playerId);
    } else {
      // Add player
      manualRotations[key] = [...currentPlayers, playerId];
    }

    return this.updateGame(gameId, { manualRotations });
  }

  /**
   * Clear all manual rotation selections for a game.
   */
  static clearManualRotations(gameId: string): Game {
    return this.updateGame(gameId, { manualRotations: {} });
  }
}
