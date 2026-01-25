import { useState, useEffect } from 'react';
import type { Game } from '@/types';
import { GameService } from '@/services/game';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    const loadedGames = GameService.getAllGames();
    setGames(loadedGames);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const createGame = (opponent: string, date: string, location: string) => {
    const game = GameService.createGame(opponent, date, location);
    refresh();
    return game;
  };

  const updateGame = (id: string, updates: Partial<Omit<Game, 'id' | 'createdAt'>>) => {
    const game = GameService.updateGame(id, updates);
    refresh();
    return game;
  };

  const deleteGame = (id: string) => {
    GameService.deleteGame(id);
    refresh();
  };

  const startGame = (id: string) => {
    const game = GameService.startGame(id);
    refresh();
    return game;
  };

  const endGame = (id: string) => {
    const game = GameService.endGame(id);
    refresh();
    return game;
  };

  return {
    games,
    loading,
    refresh,
    createGame,
    updateGame,
    deleteGame,
    startGame,
    endGame,
  };
}
