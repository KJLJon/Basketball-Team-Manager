import type {
  Game,
  RotationRecommendation,
  PlayerRotationPriority,
  GameRosterOptimization,
  OptimizedRotation,
  PriorityLevel,
  Quarter,
  SwapNumber
} from '@/types';
import { StorageService } from './storage';
import { StatsService } from './stats';

export class RotationService {
  /**
   * Recommends players for the next rotation based on:
   * 1. Normalized play time (total minutes including current game / total attendance including current)
   * 2. Tie-breaker 1: Fewer games attended = higher priority
   * 3. Tie-breaker 2: Earlier createdAt (older players) = higher priority
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

    // Calculate current rotation number for fractional attendance
    const currentRotationNumber = game.currentQuarter && game.currentSwap
      ? ((game.currentQuarter - 1) * 2) + game.currentSwap
      : 1;

    // Get all games for historical data
    const allGames = StorageService.getGames();

    // Calculate recommendations with current game included
    const recommendations: RotationRecommendation[] = [];

    for (const playerId of attendingPlayerIds) {
      // Skip players in exclude list (e.g., currently on court)
      if (excludePlayerIds.includes(playerId)) {
        continue;
      }

      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      // Get historical stats
      const seasonStats = StatsService.getPlayerSeasonStats(playerId);

      // Calculate current game stats
      const currentGameMinutes = StatsService.calculatePlayTime(gameId, playerId);
      const currentGameSwapsAttended = game.stats[playerId]?.swapsAttended ?? 8;
      const currentGameAttendance = currentGameSwapsAttended / 8; // Fractional

      // Total including current game
      const totalMinutes = seasonStats.playTimeMinutes + currentGameMinutes;
      const totalAttendance = seasonStats.gamesAttended + currentGameAttendance;
      const normalizedPlayTime = totalAttendance > 0 ? totalMinutes / totalAttendance : 0;

      recommendations.push({
        playerId,
        playerName: player.name,
        playerNumber: player.number,
        normalizedPlayTime,
        totalPlayTime: totalMinutes,
        gamesAttended: Math.floor(totalAttendance), // Show as integer
        reason: this.generateReason(normalizedPlayTime, totalMinutes),
      });
    }

    // Sort by: normalized time -> attendance -> createdAt
    recommendations.sort((a, b) => {
      // 1. Primary: Normalized play time (ascending)
      if (Math.abs(a.normalizedPlayTime - b.normalizedPlayTime) > 0.01) {
        return a.normalizedPlayTime - b.normalizedPlayTime;
      }

      // 2. Tie-breaker 1: Fewer games attended = higher priority
      if (a.gamesAttended !== b.gamesAttended) {
        return a.gamesAttended - b.gamesAttended;
      }

      // 3. Tie-breaker 2: Earlier createdAt
      const playerA = players.find(p => p.id === a.playerId);
      const playerB = players.find(p => p.id === b.playerId);
      if (playerA && playerB) {
        return playerA.createdAt - playerB.createdAt;
      }

      return 0;
    });

    return recommendations.slice(0, count);
  }

  /**
   * Recommends players using the "preferred" algorithm based on:
   * 1. Current game time (shortest first)
   * 2. Normalized time per swap in previous games (lowest first)
   * 3. Total previous swaps (most first)
   * 4. Combined normalized time (current + previous)
   * 5. Jersey number (lowest first)
   */
  static recommendPlayersPreferred(
    gameId: string,
    count: number = 5,
    excludePlayerIds: string[] = []
  ): RotationRecommendation[] {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const players = StorageService.getPlayers();
    const allGames = StorageService.getGames();
    const attendingPlayerIds = game.attendance;

    interface PlayerPreferredData {
      playerId: string;
      playerName: string;
      playerNumber: string;
      currentGameTime: number;
      currentGameSwaps: number;
      previousGames: Array<{ time: number; swaps: number }>;
      jerseyNumber: number;
    }

    const playerDataList: PlayerPreferredData[] = [];

    for (const playerId of attendingPlayerIds) {
      // Skip players in exclude list
      if (excludePlayerIds.includes(playerId)) {
        continue;
      }

      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      // Current game data
      const currentGameTime = StatsService.calculatePlayTime(gameId, playerId);
      const currentGameSwaps = game.stats[playerId]?.swapsAttended ?? 8;

      // Previous games data (all games except current)
      const previousGames: Array<{ time: number; swaps: number }> = [];
      for (const g of allGames) {
        // Skip current game
        if (g.id === gameId) continue;

        // Only include games where player attended
        if (g.attendance.includes(playerId)) {
          const time = StatsService.calculatePlayTime(g.id, playerId);
          const swaps = g.stats[playerId]?.swapsAttended ?? 8;
          previousGames.push({ time, swaps });
        }
      }

      // Parse jersey number as integer
      const jerseyNumber = parseInt(player.number) || 999;

      playerDataList.push({
        playerId,
        playerName: player.name,
        playerNumber: player.number,
        currentGameTime,
        currentGameSwaps,
        previousGames,
        jerseyNumber,
      });
    }

    // Sort according to preferred algorithm
    playerDataList.sort((a, b) => {
      // 1. Compare current game time (shortest first)
      if (a.currentGameTime !== b.currentGameTime) {
        return a.currentGameTime - b.currentGameTime;
      }

      // 2. Compare normalized time per swap in previous games (lowest first)
      const aPrevSwaps = a.previousGames.reduce((sum, game) => sum + game.swaps, 0);
      const bPrevSwaps = b.previousGames.reduce((sum, game) => sum + game.swaps, 0);
      const aPrevTime = a.previousGames.reduce((sum, game) => sum + game.time, 0);
      const bPrevTime = b.previousGames.reduce((sum, game) => sum + game.time, 0);

      const aNormalized = aPrevSwaps > 0 ? aPrevTime / aPrevSwaps : Infinity;
      const bNormalized = bPrevSwaps > 0 ? bPrevTime / bPrevSwaps : Infinity;

      if (aNormalized !== bNormalized) {
        return aNormalized - bNormalized;
      }

      // 3. Compare total previous swaps (most first)
      if (aPrevSwaps !== bPrevSwaps) {
        return bPrevSwaps - aPrevSwaps;
      }

      // 4. Compare combined normalized time
      const aTotalSwaps = aPrevSwaps + a.currentGameSwaps;
      const bTotalSwaps = bPrevSwaps + b.currentGameSwaps;
      const aTotalTime = aPrevTime + a.currentGameTime;
      const bTotalTime = bPrevTime + b.currentGameTime;

      const aCombinedNormalized = aTotalSwaps > 0 ? aTotalTime / aTotalSwaps : Infinity;
      const bCombinedNormalized = bTotalSwaps > 0 ? bTotalTime / bTotalSwaps : Infinity;

      if (aCombinedNormalized !== bCombinedNormalized) {
        return aCombinedNormalized - bCombinedNormalized;
      }

      // 5. Compare jersey numbers (lowest first)
      return a.jerseyNumber - b.jerseyNumber;
    });

    // Convert to RotationRecommendation format
    const recommendations: RotationRecommendation[] = playerDataList.map(data => {
      const prevSwaps = data.previousGames.reduce((sum, g) => sum + g.swaps, 0);
      const prevTime = data.previousGames.reduce((sum, g) => sum + g.time, 0);
      const totalSwaps = prevSwaps + data.currentGameSwaps;
      const totalTime = prevTime + data.currentGameTime;
      const normalizedTime = totalSwaps > 0 ? totalTime / totalSwaps : 0;

      let reason = '';
      if (data.currentGameTime === 0 && prevTime === 0) {
        reason = 'Has not played yet';
      } else if (data.currentGameTime < 8) {
        reason = `Current: ${data.currentGameTime} min (${normalizedTime.toFixed(1)} min/swap avg)`;
      } else {
        reason = `${normalizedTime.toFixed(1)} min/swap average`;
      }

      return {
        playerId: data.playerId,
        playerName: data.playerName,
        playerNumber: data.playerNumber,
        normalizedPlayTime: normalizedTime,
        totalPlayTime: totalTime,
        gamesAttended: data.previousGames.length + (data.currentGameSwaps > 0 ? 1 : 0),
        reason,
      };
    });

    return recommendations.slice(0, count);
  }

  /**
   * Get rotation recommendations based on currently selected algorithm.
   * Checks settings to determine whether to use simple, weighted, preferred, or manual algorithm.
   */
  static getRecommendations(
    gameId: string,
    count: number = 5,
    excludePlayerIds: string[] = []
  ): RotationRecommendation[] {
    const algorithm = StorageService.getRotationAlgorithm();

    if (algorithm === 'manual') {
      // Use manual selections for the current/next rotation
      return this.getManualRecommendations(gameId, count, excludePlayerIds);
    }

    if (algorithm === 'weighted') {
      // Use weighted priority algorithm
      const game = StorageService.getGames().find(g => g.id === gameId);
      if (!game || !game.currentQuarter || !game.currentSwap) {
        // Fall back to simple if no current rotation
        return this.recommendPlayers(gameId, count, excludePlayerIds);
      }

      const rotationNumber = (game.currentQuarter - 1) * 2 + game.currentSwap;
      const priorities = this.recommendPlayersWithPriority(gameId, rotationNumber, excludePlayerIds);

      // Convert to RotationRecommendation format
      return priorities.slice(0, count).map(p => ({
        playerId: p.playerId,
        playerName: p.playerName,
        playerNumber: p.playerNumber,
        normalizedPlayTime: p.factors.historicalNormalizedTime,
        totalPlayTime: p.factors.currentGameMinutes,
        gamesAttended: p.factors.gamesAttendedTotal,
        reason: p.notes,
      }));
    }

    if (algorithm === 'preferred') {
      // Use preferred algorithm
      return this.recommendPlayersPreferred(gameId, count, excludePlayerIds);
    }

    // Default: use simple algorithm
    return this.recommendPlayers(gameId, count, excludePlayerIds);
  }

  /**
   * Get recommendations from manual selections for the current rotation.
   * Falls back to preferred algorithm if no manual selections exist.
   */
  static getManualRecommendations(
    gameId: string,
    count: number = 5,
    excludePlayerIds: string[] = []
  ): RotationRecommendation[] {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const players = StorageService.getPlayers();

    // Get current quarter and swap
    const quarter = game.currentQuarter || 1;
    const swap = game.currentSwap || 1;
    const key = `Q${quarter}S${swap}`;

    // Check if we have manual selections for this rotation
    const manualPlayers = game.manualRotations?.[key];

    if (!manualPlayers || manualPlayers.length === 0) {
      // Fall back to preferred algorithm if no manual selections
      return this.recommendPlayersPreferred(gameId, count, excludePlayerIds);
    }

    // Filter out excluded players and return as recommendations
    const recommendations: RotationRecommendation[] = [];

    for (const playerId of manualPlayers) {
      if (excludePlayerIds.includes(playerId)) continue;

      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      const seasonStats = StatsService.getPlayerSeasonStats(playerId);
      const currentGameMinutes = StatsService.calculatePlayTime(gameId, playerId);

      recommendations.push({
        playerId,
        playerName: player.name,
        playerNumber: player.number,
        normalizedPlayTime: seasonStats.normalizedPlayTime,
        totalPlayTime: currentGameMinutes,
        gamesAttended: seasonStats.gamesAttended,
        reason: 'Manual selection',
      });
    }

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

  /**
   * Calculate multi-factor priority score for a player in a specific game context.
   * Lower score = higher priority to play.
   *
   * Weights:
   * - 50% current game fairness (minutes already played vs target)
   * - 30% historical fairness (normalized play time vs average)
   * - 15% games attended bonus (fewer games attended = higher priority)
   * - 5% current swaps attended (tie-breaker)
   */
  static calculatePlayerPriority(
    playerId: string,
    gameContext: {
      gameId: string;
      currentGameMinutes: number;
      targetMinutes: number;
      allGames: Game[];
    }
  ): PlayerRotationPriority {
    const player = StorageService.getPlayers().find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const seasonStats = StatsService.getPlayerSeasonStats(playerId);
    const game = gameContext.allGames.find(g => g.id === gameContext.gameId);

    if (!game) {
      throw new Error('Game not found');
    }

    const playerGameStats = game.stats[playerId];
    const swapsAttendedCurrent = playerGameStats?.swapsAttended ?? 8;

    // Calculate average normalized time across all attending players for this game
    const attendingPlayerStats = game.attendance
      .map(pid => StatsService.getPlayerSeasonStats(pid))
      .filter(s => s.playTimeMinutes > 0 || s.gamesAttended > 0);

    const avgNormalizedTime = attendingPlayerStats.length > 0
      ? attendingPlayerStats.reduce((sum, s) => sum + s.normalizedPlayTime, 0) / attendingPlayerStats.length
      : 16; // Default to 16 minutes (half game) if no data

    // Find max games attended for normalization
    const maxGamesAttended = Math.max(
      ...attendingPlayerStats.map(s => s.gamesAttended),
      1 // Avoid division by zero
    );

    // Calculate priority score components (0-1 normalized)
    const currentGameFairness = gameContext.targetMinutes > 0
      ? gameContext.currentGameMinutes / gameContext.targetMinutes
      : 0;

    const historicalFairness = avgNormalizedTime > 0
      ? seasonStats.normalizedPlayTime / avgNormalizedTime
      : 0;

    const gamesAttendedPenalty = maxGamesAttended > 0
      ? seasonStats.gamesAttended / maxGamesAttended
      : 0;

    const swapsPenalty = swapsAttendedCurrent / 8;

    // Weights (total = 1.0)
    const w1 = 0.50; // Current game is most important
    const w2 = 0.30; // Historical fairness
    const w3 = -0.15; // Fewer games attended = higher priority (negative weight)
    const w4 = 0.05; // Current swaps attended

    const priorityScore =
      (w1 * currentGameFairness) +
      (w2 * historicalFairness) +
      (w3 * gamesAttendedPenalty) +
      (w4 * swapsPenalty);

    // Determine visual indicator based on deviation from target
    const minutesDeviation = gameContext.currentGameMinutes - gameContext.targetMinutes;
    const deviationPercent = gameContext.targetMinutes > 0
      ? (minutesDeviation / gameContext.targetMinutes) * 100
      : 0;

    let visualIndicator: PriorityLevel;
    let notes: string;

    if (deviationPercent < -20) {
      visualIndicator = 'high-priority';
      notes = `Needs ${Math.abs(Math.round(minutesDeviation))} more minutes to reach target`;
    } else if (deviationPercent > 20) {
      visualIndicator = 'low-priority';
      notes = `Has ${Math.round(minutesDeviation)} extra minutes above target`;
    } else {
      visualIndicator = 'medium';
      notes = 'Playing time is balanced';
    }

    // Add historical context to notes
    if (seasonStats.gamesAttended < maxGamesAttended * 0.7) {
      notes += ` (missed ${maxGamesAttended - seasonStats.gamesAttended} games)`;
    }

    return {
      playerId,
      playerName: player.name,
      playerNumber: player.number,
      priorityScore,
      factors: {
        currentGameMinutes: gameContext.currentGameMinutes,
        historicalNormalizedTime: seasonStats.normalizedPlayTime,
        gamesAttendedTotal: seasonStats.gamesAttended,
        swapsAttendedCurrent,
      },
      visualIndicator,
      notes,
    };
  }

  /**
   * Recommend players with priority-based scoring for more informed rotation decisions.
   * Returns players sorted by priority score (lowest = highest priority).
   */
  static recommendPlayersWithPriority(
    gameId: string,
    currentRotationNumber: number,
    excludePlayerIds: string[] = []
  ): PlayerRotationPriority[] {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const allGames = StorageService.getGames();
    const attendingPlayers = game.attendance.filter(
      playerId => !excludePlayerIds.includes(playerId)
    );

    // Calculate target minutes (32 total game minutes / number of attending players)
    const targetMinutes = game.attendance.length > 0
      ? 32 / game.attendance.length
      : 16;

    // Calculate current game minutes for each player
    const priorities: PlayerRotationPriority[] = [];

    for (const playerId of attendingPlayers) {
      const currentGameMinutes = StatsService.calculatePlayTime(gameId, playerId);

      const priority = this.calculatePlayerPriority(playerId, {
        gameId,
        currentGameMinutes,
        targetMinutes,
        allGames,
      });

      priorities.push(priority);
    }

    // Sort by priority score (ascending = higher priority first)
    return priorities.sort((a, b) => a.priorityScore - b.priorityScore);
  }

  /**
   * Optimize entire game roster by precomputing all 8 rotations using simple algorithm.
   * Simulates game progression to account for accumulated minutes after each swap.
   * This helps avoid injury scenarios where someone sits multiple swaps then must play all remaining.
   */
  static optimizeGameRoster(
    gameId: string,
    attendingPlayerIds: string[]
  ): GameRosterOptimization {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const players = StorageService.getPlayers();

    // Calculate target minutes per player
    const totalGameMinutes = 32; // 4 quarters × 8 minutes average per quarter
    const targetMinutes = attendingPlayerIds.length > 0
      ? totalGameMinutes / attendingPlayerIds.length
      : 0;

    // Initialize tracking for simulated minutes and attendance
    // Start with actual data from completed rotations
    const simulatedMinutes: Record<string, number> = {};
    const simulatedAttendance: Record<string, number> = {}; // Fractional (0-1)

    attendingPlayerIds.forEach(playerId => {
      // Initialize with actual play time from this game
      simulatedMinutes[playerId] = StatsService.calculatePlayTime(gameId, playerId);

      // Calculate actual attendance (fractional) based on rotations played
      let rotationsPlayed = 0;
      for (const rotation of game.rotations) {
        if (rotation.playersOnCourt.includes(playerId)) {
          rotationsPlayed++;
        }
      }
      simulatedAttendance[playerId] = rotationsPlayed / 8; // Convert to fractional (0-1)
    });

    // Generate all 8 rotations
    const rotations: OptimizedRotation[] = [];

    for (let rotationNum = 1; rotationNum <= 8; rotationNum++) {
      const quarter = Math.ceil(rotationNum / 2) as Quarter;
      const swap = ((rotationNum - 1) % 2 + 1) as SwapNumber;

      // Check if this rotation has already been played
      const existingRotation = game.rotations.find(
        r => r.quarter === quarter && r.swap === swap
      );

      if (existingRotation) {
        // Use actual rotation data - don't simulate
        const minutesPerPlayer: Record<string, number> = {};
        existingRotation.playersOnCourt.forEach(playerId => {
          const minutes = existingRotation.playerMinutes?.[playerId] ?? existingRotation.minutes ?? 4;
          minutesPerPlayer[playerId] = minutes;
        });

        rotations.push({
          quarter,
          swap,
          playerIds: existingRotation.playersOnCourt,
          minutesPerPlayer,
          reasoning: 'Actual rotation (played)',
        });

        // Note: simulated stats were already initialized with actual data at the start
        continue;
      }

      // This rotation hasn't been played yet - simulate it
      // Calculate normalized time for each player with simulated stats
      const playerPriorities: Array<{
        playerId: string;
        normalizedTime: number;
        totalAttendance: number;
        createdAt: number;
      }> = [];

      for (const playerId of attendingPlayerIds) {
        const player = players.find(p => p.id === playerId);
        if (!player) continue;

        // Get historical stats (not including current game)
        const seasonStats = StatsService.getPlayerSeasonStats(playerId);

        // Simulated current game stats (includes actual + projected)
        const currentGameMinutes = simulatedMinutes[playerId];
        const currentGameAttendance = simulatedAttendance[playerId];

        // Total including simulated current game
        const totalMinutes = seasonStats.playTimeMinutes + currentGameMinutes;
        const totalAttendance = seasonStats.gamesAttended + currentGameAttendance;
        const normalizedTime = totalAttendance > 0 ? totalMinutes / totalAttendance : 0;

        playerPriorities.push({
          playerId,
          normalizedTime,
          totalAttendance,
          createdAt: player.createdAt,
        });
      }

      // Sort by: normalized time → attendance → createdAt
      playerPriorities.sort((a, b) => {
        // 1. Primary: Normalized play time (ascending)
        if (Math.abs(a.normalizedTime - b.normalizedTime) > 0.01) {
          return a.normalizedTime - b.normalizedTime;
        }

        // 2. Tie-breaker 1: Fewer games attended = higher priority
        if (Math.abs(a.totalAttendance - b.totalAttendance) > 0.01) {
          return a.totalAttendance - b.totalAttendance;
        }

        // 3. Tie-breaker 2: Earlier createdAt
        return a.createdAt - b.createdAt;
      });

      // Select top 5 players
      const selectedPlayers = playerPriorities.slice(0, Math.min(5, attendingPlayerIds.length));
      const playerIds = selectedPlayers.map(p => p.playerId);
      const minutesPerPlayer: Record<string, number> = {};

      // Assign 4 minutes to each selected player and update simulated stats
      playerIds.forEach(playerId => {
        minutesPerPlayer[playerId] = 4;
        simulatedMinutes[playerId] += 4;
        simulatedAttendance[playerId] += 1 / 8; // Increment fractional attendance
      });

      // Generate reasoning
      const topPlayer = selectedPlayers[0];
      const topPlayerObj = players.find(p => p.id === topPlayer.playerId);
      const reasoning = topPlayer
        ? `${topPlayerObj?.name || 'Player'} has ${topPlayer.normalizedTime.toFixed(1)} min/game (lowest)`
        : 'No players available';

      rotations.push({
        quarter,
        swap,
        playerIds,
        minutesPerPlayer,
        reasoning,
      });
    }

    // Generate player summary
    const playerSummary: GameRosterOptimization['playerSummary'] = {};

    for (const playerId of attendingPlayerIds) {
      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      const totalMinutes = simulatedMinutes[playerId];
      const rotationsPlayed = rotations
        .map((r, index) => r.playerIds.includes(playerId) ? index + 1 : -1)
        .filter(i => i !== -1);

      const minutesDeviation = totalMinutes - targetMinutes;
      const deviationPercent = targetMinutes > 0
        ? (minutesDeviation / targetMinutes) * 100
        : 0;

      let priorityLevel: PriorityLevel;
      let notes: string;

      if (deviationPercent < -10) {
        priorityLevel = 'high-priority';
        notes = `Scheduled ${Math.round(totalMinutes)} min (${Math.round(deviationPercent)}% below target)`;
      } else if (deviationPercent > 10) {
        priorityLevel = 'low-priority';
        notes = `Scheduled ${Math.round(totalMinutes)} min (${Math.round(deviationPercent)}% above target)`;
      } else {
        priorityLevel = 'medium';
        notes = `Scheduled ${Math.round(totalMinutes)} min (balanced)`;
      }

      playerSummary[playerId] = {
        totalMinutes,
        rotationsPlayed,
        priorityLevel,
        notes,
      };
    }

    // Calculate fairness score (0-100, higher = more fair)
    const minutesArray = Object.values(simulatedMinutes);
    const avgMinutes = minutesArray.reduce((sum, m) => sum + m, 0) / minutesArray.length;
    const variance = minutesArray.reduce((sum, m) => sum + Math.pow(m - avgMinutes, 2), 0) / minutesArray.length;
    const stdDev = Math.sqrt(variance);

    // Fairness score: 100 = perfect (stdDev=0), decreases as stdDev increases
    const fairnessScore = Math.max(0, Math.min(100, 100 - (stdDev / 8) * 100));

    return {
      gameId,
      rotations,
      playerSummary,
      fairnessScore: Math.round(fairnessScore),
      generatedAt: Date.now(),
    };
  }

  /**
   * Optimize entire game roster using weighted priority algorithm.
   * Similar to optimizeGameRoster but uses the weighted scoring approach.
   */
  static optimizeGameRosterWeighted(
    gameId: string,
    attendingPlayerIds: string[]
  ): GameRosterOptimization {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const players = StorageService.getPlayers();
    const allGames = StorageService.getGames();

    // Calculate target minutes per player
    const totalGameMinutes = 32;
    const targetMinutes = attendingPlayerIds.length > 0
      ? totalGameMinutes / attendingPlayerIds.length
      : 0;

    // Initialize tracking for simulated minutes
    // Start with actual data from completed rotations
    const simulatedMinutes: Record<string, number> = {};
    attendingPlayerIds.forEach(playerId => {
      // Initialize with actual play time from this game
      simulatedMinutes[playerId] = StatsService.calculatePlayTime(gameId, playerId);
    });

    // Generate all 8 rotations
    const rotations: OptimizedRotation[] = [];

    for (let rotationNum = 1; rotationNum <= 8; rotationNum++) {
      const quarter = Math.ceil(rotationNum / 2) as Quarter;
      const swap = ((rotationNum - 1) % 2 + 1) as SwapNumber;

      // Check if this rotation has already been played
      const existingRotation = game.rotations.find(
        r => r.quarter === quarter && r.swap === swap
      );

      if (existingRotation) {
        // Use actual rotation data - don't simulate
        const minutesPerPlayer: Record<string, number> = {};
        existingRotation.playersOnCourt.forEach(playerId => {
          const minutes = existingRotation.playerMinutes?.[playerId] ?? existingRotation.minutes ?? 4;
          minutesPerPlayer[playerId] = minutes;
        });

        rotations.push({
          quarter,
          swap,
          playerIds: existingRotation.playersOnCourt,
          minutesPerPlayer,
          reasoning: 'Actual rotation (played)',
        });

        // Note: simulated stats were already initialized with actual data at the start
        continue;
      }

      // This rotation hasn't been played yet - simulate it
      // Calculate priority scores for each player
      const priorities: PlayerRotationPriority[] = [];

      for (const playerId of attendingPlayerIds) {
        const player = players.find(p => p.id === playerId);
        if (!player) continue;

        const seasonStats = StatsService.getPlayerSeasonStats(playerId);
        const currentGameMinutes = simulatedMinutes[playerId];

        // Calculate priority using weighted algorithm
        const swapsAttendedCurrent = Math.min(8, Math.ceil((currentGameMinutes / 4) * 8));

        // Calculate average normalized time
        const attendingPlayerStats = attendingPlayerIds
          .map(pid => StatsService.getPlayerSeasonStats(pid))
          .filter(s => s.playTimeMinutes > 0 || s.gamesAttended > 0);

        const avgNormalizedTime = attendingPlayerStats.length > 0
          ? attendingPlayerStats.reduce((sum, s) => sum + s.normalizedPlayTime, 0) / attendingPlayerStats.length
          : 16;

        const maxGamesAttended = Math.max(
          ...attendingPlayerStats.map(s => s.gamesAttended),
          1
        );

        // Calculate priority components
        const currentGameFairness = targetMinutes > 0
          ? currentGameMinutes / targetMinutes
          : 0;

        const historicalFairness = avgNormalizedTime > 0
          ? seasonStats.normalizedPlayTime / avgNormalizedTime
          : 0;

        const gamesAttendedPenalty = maxGamesAttended > 0
          ? seasonStats.gamesAttended / maxGamesAttended
          : 0;

        const swapsPenalty = swapsAttendedCurrent / 8;

        // Weighted priority score
        const priorityScore =
          (0.50 * currentGameFairness) +
          (0.30 * historicalFairness) +
          (-0.15 * gamesAttendedPenalty) +
          (0.05 * swapsPenalty);

        const minutesDeviation = currentGameMinutes - targetMinutes;
        let notes = '';
        if (minutesDeviation < -1) {
          notes = `Needs ${Math.abs(Math.round(minutesDeviation))} more minutes`;
        } else if (minutesDeviation > 1) {
          notes = `Has ${Math.round(minutesDeviation)} extra minutes`;
        } else {
          notes = 'Balanced';
        }

        priorities.push({
          playerId,
          playerName: player.name,
          playerNumber: player.number,
          priorityScore,
          factors: {
            currentGameMinutes,
            historicalNormalizedTime: seasonStats.normalizedPlayTime,
            gamesAttendedTotal: seasonStats.gamesAttended,
            swapsAttendedCurrent,
          },
          visualIndicator: this.visualizePriorityLevel(priorityScore),
          notes,
        });
      }

      // Sort by priority score (ascending = higher priority first)
      priorities.sort((a, b) => a.priorityScore - b.priorityScore);

      // Select top 5 players
      const selectedPlayers = priorities.slice(0, Math.min(5, attendingPlayerIds.length));
      const playerIds = selectedPlayers.map(p => p.playerId);
      const minutesPerPlayer: Record<string, number> = {};

      // Assign 4 minutes to each selected player
      playerIds.forEach(playerId => {
        minutesPerPlayer[playerId] = 4;
        simulatedMinutes[playerId] += 4;
      });

      const topPlayer = selectedPlayers[0];
      const reasoning = topPlayer
        ? `${topPlayer.playerName} (Priority: ${topPlayer.priorityScore.toFixed(2)})`
        : 'No players available';

      rotations.push({
        quarter,
        swap,
        playerIds,
        minutesPerPlayer,
        reasoning,
      });
    }

    // Generate player summary
    const playerSummary: GameRosterOptimization['playerSummary'] = {};

    for (const playerId of attendingPlayerIds) {
      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      const totalMinutes = simulatedMinutes[playerId];
      const rotationsPlayed = rotations
        .map((r, index) => r.playerIds.includes(playerId) ? index + 1 : -1)
        .filter(i => i !== -1);

      const minutesDeviation = totalMinutes - targetMinutes;
      const deviationPercent = targetMinutes > 0
        ? (minutesDeviation / targetMinutes) * 100
        : 0;

      let priorityLevel: PriorityLevel;
      let notes: string;

      if (deviationPercent < -10) {
        priorityLevel = 'high-priority';
        notes = `Scheduled ${Math.round(totalMinutes)} min (${Math.round(deviationPercent)}% below target)`;
      } else if (deviationPercent > 10) {
        priorityLevel = 'low-priority';
        notes = `Scheduled ${Math.round(totalMinutes)} min (${Math.round(deviationPercent)}% above target)`;
      } else {
        priorityLevel = 'medium';
        notes = `Scheduled ${Math.round(totalMinutes)} min (balanced)`;
      }

      playerSummary[playerId] = {
        totalMinutes,
        rotationsPlayed,
        priorityLevel,
        notes,
      };
    }

    // Calculate fairness score
    const minutesArray = Object.values(simulatedMinutes);
    const avgMinutes = minutesArray.reduce((sum, m) => sum + m, 0) / minutesArray.length;
    const variance = minutesArray.reduce((sum, m) => sum + Math.pow(m - avgMinutes, 2), 0) / minutesArray.length;
    const stdDev = Math.sqrt(variance);
    const fairnessScore = Math.max(0, Math.min(100, 100 - (stdDev / 8) * 100));

    return {
      gameId,
      rotations,
      playerSummary,
      fairnessScore: Math.round(fairnessScore),
      generatedAt: Date.now(),
    };
  }

  /**
   * Optimize entire game roster using preferred algorithm.
   * Simulates game progression to account for accumulated minutes after each swap.
   * Accounts for actual rotations that have already been played.
   */
  static optimizeGameRosterPreferred(
    gameId: string,
    attendingPlayerIds: string[]
  ): GameRosterOptimization {
    const game = StorageService.getGames().find(g => g.id === gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const players = StorageService.getPlayers();
    const allGames = StorageService.getGames();

    // Calculate target minutes per player
    const totalGameMinutes = 32;
    const targetMinutes = attendingPlayerIds.length > 0
      ? totalGameMinutes / attendingPlayerIds.length
      : 0;

    // Initialize tracking for simulated minutes and swaps
    // Start with actual data from completed rotations
    const simulatedMinutes: Record<string, number> = {};
    const simulatedSwaps: Record<string, number> = {};

    attendingPlayerIds.forEach(playerId => {
      // Initialize with actual play time from this game
      simulatedMinutes[playerId] = StatsService.calculatePlayTime(gameId, playerId);

      // Calculate actual swaps attended so far
      let swapsAttended = 0;
      for (const rotation of game.rotations) {
        if (rotation.playersOnCourt.includes(playerId)) {
          swapsAttended++;
        }
      }
      simulatedSwaps[playerId] = swapsAttended;
    });

    // Generate all 8 rotations
    const rotations: OptimizedRotation[] = [];

    for (let rotationNum = 1; rotationNum <= 8; rotationNum++) {
      const quarter = Math.ceil(rotationNum / 2) as Quarter;
      const swap = ((rotationNum - 1) % 2 + 1) as SwapNumber;

      // Check if this rotation has already been played
      const existingRotation = game.rotations.find(
        r => r.quarter === quarter && r.swap === swap
      );

      if (existingRotation) {
        // Use actual rotation data - don't simulate
        const minutesPerPlayer: Record<string, number> = {};
        existingRotation.playersOnCourt.forEach(playerId => {
          const minutes = existingRotation.playerMinutes?.[playerId] ?? existingRotation.minutes ?? 4;
          minutesPerPlayer[playerId] = minutes;
        });

        rotations.push({
          quarter,
          swap,
          playerIds: existingRotation.playersOnCourt,
          minutesPerPlayer,
          reasoning: 'Actual rotation (played)',
        });

        // Note: simulated stats were already initialized with actual data at the start
        continue;
      }

      // This rotation hasn't been played yet - simulate it
      // Build player data for sorting
      interface PlayerPreferredData {
        playerId: string;
        playerName: string;
        currentGameTime: number;
        currentGameSwaps: number;
        previousGames: Array<{ time: number; swaps: number }>;
        jerseyNumber: number;
        createdAt: number;
      }

      const playerDataList: PlayerPreferredData[] = [];

      for (const playerId of attendingPlayerIds) {
        const player = players.find(p => p.id === playerId);
        if (!player) continue;

        // Current game data (includes actual + simulated)
        const currentGameTime = simulatedMinutes[playerId];
        const currentGameSwaps = simulatedSwaps[playerId];

        // Previous games data (all games except current)
        const previousGames: Array<{ time: number; swaps: number }> = [];
        for (const g of allGames) {
          // Skip current game
          if (g.id === gameId) continue;

          // Only include games where player attended
          if (g.attendance.includes(playerId)) {
            const time = StatsService.calculatePlayTime(g.id, playerId);
            const swaps = g.stats[playerId]?.swapsAttended ?? 8;
            previousGames.push({ time, swaps });
          }
        }

        // Parse jersey number as integer
        const jerseyNumber = parseInt(player.number) || 999;

        playerDataList.push({
          playerId,
          playerName: player.name,
          currentGameTime,
          currentGameSwaps,
          previousGames,
          jerseyNumber,
          createdAt: player.createdAt,
        });
      }

      // Sort according to preferred algorithm
      playerDataList.sort((a, b) => {
        // 1. Compare current game time (shortest first)
        if (a.currentGameTime !== b.currentGameTime) {
          return a.currentGameTime - b.currentGameTime;
        }

        // 2. Compare normalized time per swap in previous games (lowest first)
        const aPrevSwaps = a.previousGames.reduce((sum, game) => sum + game.swaps, 0);
        const bPrevSwaps = b.previousGames.reduce((sum, game) => sum + game.swaps, 0);
        const aPrevTime = a.previousGames.reduce((sum, game) => sum + game.time, 0);
        const bPrevTime = b.previousGames.reduce((sum, game) => sum + game.time, 0);

        const aNormalized = aPrevSwaps > 0 ? aPrevTime / aPrevSwaps : Infinity;
        const bNormalized = bPrevSwaps > 0 ? bPrevTime / bPrevSwaps : Infinity;

        if (aNormalized !== bNormalized) {
          return aNormalized - bNormalized;
        }

        // 3. Compare total previous swaps (most first)
        if (aPrevSwaps !== bPrevSwaps) {
          return bPrevSwaps - aPrevSwaps;
        }

        // 4. Compare combined normalized time
        const aTotalSwaps = aPrevSwaps + a.currentGameSwaps;
        const bTotalSwaps = bPrevSwaps + b.currentGameSwaps;
        const aTotalTime = aPrevTime + a.currentGameTime;
        const bTotalTime = bPrevTime + b.currentGameTime;

        const aCombinedNormalized = aTotalSwaps > 0 ? aTotalTime / aTotalSwaps : Infinity;
        const bCombinedNormalized = bTotalSwaps > 0 ? bTotalTime / bTotalSwaps : Infinity;

        if (aCombinedNormalized !== bCombinedNormalized) {
          return aCombinedNormalized - bCombinedNormalized;
        }

        // 5. Compare jersey numbers (lowest first)
        return a.jerseyNumber - b.jerseyNumber;
      });

      // Select top 5 players
      const selectedPlayers = playerDataList.slice(0, Math.min(5, attendingPlayerIds.length));
      const playerIds = selectedPlayers.map(p => p.playerId);
      const minutesPerPlayer: Record<string, number> = {};

      // Assign 4 minutes to each selected player and update simulated stats
      playerIds.forEach(playerId => {
        minutesPerPlayer[playerId] = 4;
        simulatedMinutes[playerId] += 4;
        simulatedSwaps[playerId] += 1;
      });

      // Generate reasoning
      const topPlayer = selectedPlayers[0];
      const reasoning = topPlayer
        ? `${topPlayer.playerName} (${topPlayer.currentGameTime} min current)`
        : 'No players available';

      rotations.push({
        quarter,
        swap,
        playerIds,
        minutesPerPlayer,
        reasoning,
      });
    }

    // Generate player summary
    const playerSummary: GameRosterOptimization['playerSummary'] = {};

    for (const playerId of attendingPlayerIds) {
      const player = players.find(p => p.id === playerId);
      if (!player) continue;

      const totalMinutes = simulatedMinutes[playerId];
      const rotationsPlayed = rotations
        .map((r, index) => r.playerIds.includes(playerId) ? index + 1 : -1)
        .filter(i => i !== -1);

      const minutesDeviation = totalMinutes - targetMinutes;
      const deviationPercent = targetMinutes > 0
        ? (minutesDeviation / targetMinutes) * 100
        : 0;

      let priorityLevel: PriorityLevel;
      let notes: string;

      if (deviationPercent < -10) {
        priorityLevel = 'high-priority';
        notes = `Scheduled ${Math.round(totalMinutes)} min (${Math.round(deviationPercent)}% below target)`;
      } else if (deviationPercent > 10) {
        priorityLevel = 'low-priority';
        notes = `Scheduled ${Math.round(totalMinutes)} min (${Math.round(deviationPercent)}% above target)`;
      } else {
        priorityLevel = 'medium';
        notes = `Scheduled ${Math.round(totalMinutes)} min (balanced)`;
      }

      playerSummary[playerId] = {
        totalMinutes,
        rotationsPlayed,
        priorityLevel,
        notes,
      };
    }

    // Calculate fairness score
    const minutesArray = Object.values(simulatedMinutes);
    const avgMinutes = minutesArray.reduce((sum, m) => sum + m, 0) / minutesArray.length;
    const variance = minutesArray.reduce((sum, m) => sum + Math.pow(m - avgMinutes, 2), 0) / minutesArray.length;
    const stdDev = Math.sqrt(variance);
    const fairnessScore = Math.max(0, Math.min(100, 100 - (stdDev / 8) * 100));

    return {
      gameId,
      rotations,
      playerSummary,
      fairnessScore: Math.round(fairnessScore),
      generatedAt: Date.now(),
    };
  }

  /**
   * Determine visual priority level based on priority score.
   * Used for UI color indicators.
   */
  static visualizePriorityLevel(priorityScore: number): PriorityLevel {
    // Lower scores = higher priority
    if (priorityScore < 0.4) {
      return 'high-priority';
    } else if (priorityScore < 0.7) {
      return 'medium';
    } else {
      return 'low-priority';
    }
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
