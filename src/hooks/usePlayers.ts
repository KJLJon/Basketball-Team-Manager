import { useState, useEffect } from 'react';
import type { Player } from '@/types';
import { PlayerService } from '@/services/player';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    const loadedPlayers = PlayerService.getAllPlayers();
    setPlayers(loadedPlayers);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const createPlayer = (name: string, number: string) => {
    const player = PlayerService.createPlayer(name, number);
    refresh();
    return player;
  };

  const updatePlayer = (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => {
    const player = PlayerService.updatePlayer(id, updates);
    refresh();
    return player;
  };

  const deletePlayer = (id: string) => {
    PlayerService.deletePlayer(id);
    refresh();
  };

  return {
    players,
    loading,
    refresh,
    createPlayer,
    updatePlayer,
    deletePlayer,
  };
}
