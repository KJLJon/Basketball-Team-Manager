import type { Player, Game, AppData, AppSettings, RotationAlgorithm } from '@/types';

const STORAGE_KEY = 'basketball-team-manager';
const CURRENT_VERSION = 1;

export class StorageService {
  private static getDefaultData(): AppData {
    return {
      players: [],
      games: [],
      version: CURRENT_VERSION,
    };
  }

  static load(): AppData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return this.getDefaultData();
      }

      const data: AppData = JSON.parse(stored);

      // Handle data migration if version changes
      if (data.version !== CURRENT_VERSION) {
        return this.migrate(data);
      }

      return data;
    } catch (error) {
      console.error('Error loading data from storage:', error);
      return this.getDefaultData();
    }
  }

  static save(data: AppData): void {
    try {
      const toSave = {
        ...data,
        version: CURRENT_VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving data to storage:', error);
      throw new Error('Failed to save data');
    }
  }

  static getPlayers(): Player[] {
    return this.load().players;
  }

  static savePlayers(players: Player[]): void {
    const data = this.load();
    data.players = players;
    this.save(data);
  }

  static getGames(): Game[] {
    return this.load().games;
  }

  static saveGames(games: Game[]): void {
    const data = this.load();
    data.games = games;
    this.save(data);
  }

  static export(): string {
    const data = this.load();
    return JSON.stringify(data, null, 2);
  }

  static import(jsonString: string): void {
    try {
      const data: AppData = JSON.parse(jsonString);

      // Validate data structure
      if (!data.players || !Array.isArray(data.players)) {
        throw new Error('Invalid data format: missing players array');
      }
      if (!data.games || !Array.isArray(data.games)) {
        throw new Error('Invalid data format: missing games array');
      }

      // Validate player structure
      for (const player of data.players) {
        if (!player.id || !player.name || !player.number) {
          throw new Error('Invalid player data');
        }
      }

      // Validate game structure
      for (const game of data.games) {
        if (!game.id || !game.opponent || !game.date) {
          throw new Error('Invalid game data');
        }
      }

      this.save(data);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static getSettings(): AppSettings {
    const data = this.load();
    return data.settings || {
      rotationAlgorithm: 'simple', // Default to simple algorithm
    };
  }

  static saveSettings(settings: AppSettings): void {
    const data = this.load();
    data.settings = settings;
    this.save(data);
  }

  static getRotationAlgorithm(): RotationAlgorithm {
    return this.getSettings().rotationAlgorithm;
  }

  static setRotationAlgorithm(algorithm: RotationAlgorithm): void {
    const settings = this.getSettings();
    settings.rotationAlgorithm = algorithm;
    this.saveSettings(settings);
  }

  private static migrate(data: AppData): AppData {
    // Future migration logic goes here
    // For now, just return the data with updated version
    return {
      ...data,
      version: CURRENT_VERSION,
    };
  }
}
