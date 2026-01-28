export interface Player {
  id: string;
  name: string;
  number: string;
  createdAt: number;
}

export type GameStatus = 'scheduled' | 'in-progress' | 'completed';

export type Quarter = 1 | 2 | 3 | 4;
export type SwapNumber = 1 | 2;

export interface Rotation {
  quarter: Quarter;
  swap: SwapNumber;
  playersOnCourt: string[]; // Array of player IDs (usually 5, can be more for injury scenarios)
  minutes: number; // DEPRECATED: Use playerMinutes instead. Usually 4, but can be 2 for partial swaps
  playerMinutes?: Record<string, number>; // playerId -> minutes mapping for flexible time allocation
  isSubstitution?: boolean; // Flag indicating this is a mid-swap substitution
  startTime?: number; // Timestamp when rotation started
}

export interface PlayerStats {
  playerId: string;
  gameId: string;
  steals: number;
  rebounds: number;
  attempts1pt: number;
  made1pt: number;
  attempts2pt: number;
  made2pt: number;
  attempts3pt: number;
  made3pt: number;
  playTimeMinutes: number;
  swapsAttended?: number; // Number of swaps (0-8) player was present for (partial attendance)
  missedShots?: number; // Total missed shot attempts (calculated or manually tracked)
}

export interface Game {
  id: string;
  opponent: string;
  date: string; // ISO date string
  location: string;
  attendance: string[]; // Array of player IDs who attended
  rotations: Rotation[];
  stats: Record<string, Omit<PlayerStats, 'gameId' | 'playerId'>>; // Key is playerId
  status: GameStatus;
  currentQuarter?: Quarter;
  currentSwap?: SwapNumber;
  precomputedOptimization?: GameRosterOptimization; // Whole-game rotation optimization (computed at start)
  manualRotations?: ManualRotationSelection; // Manual rotation selections for "manual" algorithm
  createdAt: number;
}

export interface PlayerSeasonStats extends PlayerStats {
  gamesPlayed: number;
  gamesAttended: number;
  normalizedPlayTime: number; // playTimeMinutes / gamesAttended
  totalPoints: number;
  fieldGoalPercentage: number;
}

export type RotationAlgorithm = 'simple' | 'weighted' | 'preferred' | 'manual';

// Manual rotation selections for a game (stored per game)
export interface ManualRotationSelection {
  // Key is "Q{quarter}S{swap}", value is array of player IDs
  [rotationKey: string]: string[];
}

export interface AppSettings {
  rotationAlgorithm: RotationAlgorithm;
}

export interface AppData {
  players: Player[];
  games: Game[];
  settings?: AppSettings;
  version: number;
}

export interface RotationRecommendation {
  playerId: string;
  playerName: string;
  playerNumber: string;
  normalizedPlayTime: number;
  totalPlayTime: number;
  gamesAttended: number;
  reason: string;
}

// New types for enhanced rotation optimization

export type PriorityLevel = 'high-priority' | 'medium' | 'low-priority';

export interface PlayerRotationPriority {
  playerId: string;
  playerName: string;
  playerNumber: string;
  priorityScore: number; // Lower = higher priority to play
  factors: {
    currentGameMinutes: number; // Minutes already played in current game
    historicalNormalizedTime: number; // Average minutes per game historically
    gamesAttendedTotal: number; // Total games player has attended
    swapsAttendedCurrent: number; // Swaps attended in current game (0-8)
  };
  visualIndicator: PriorityLevel; // Visual indicator for UI
  notes: string; // Human-readable reason for priority level
}

export interface OptimizedRotation {
  quarter: Quarter;
  swap: SwapNumber;
  playerIds: string[]; // Players selected for this rotation
  minutesPerPlayer: Record<string, number>; // playerId -> minutes mapping
  reasoning: string; // Why these players were selected
}

export interface GameRosterOptimization {
  gameId: string;
  rotations: OptimizedRotation[]; // All 8 rotations precomputed
  playerSummary: Record<string, {
    totalMinutes: number; // Projected total minutes for game
    rotationsPlayed: number[]; // Array of rotation numbers (1-8) player participates in
    priorityLevel: PriorityLevel; // Overall priority for this player
    notes: string; // Explanation of player's rotation schedule
  }>;
  fairnessScore: number; // 0-100, higher = more fair distribution
  generatedAt: number; // Timestamp when optimization was computed
}
