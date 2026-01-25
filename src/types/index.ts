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
  playersOnCourt: string[]; // Array of 5 player IDs
  minutes: number; // Usually 4, but can be 2 for partial swaps
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
  createdAt: number;
}

export interface PlayerSeasonStats extends PlayerStats {
  gamesPlayed: number;
  gamesAttended: number;
  normalizedPlayTime: number; // playTimeMinutes / gamesAttended
  totalPoints: number;
  fieldGoalPercentage: number;
}

export interface AppData {
  players: Player[];
  games: Game[];
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
