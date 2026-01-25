import React from 'react';
import { PlayerList } from '@/components/player/PlayerList';
import { usePlayers } from '@/hooks/usePlayers';
import { Loading } from '@/components/common/Loading';

export function Players() {
  const { players, loading, createPlayer, updatePlayer, deletePlayer } = usePlayers();

  if (loading) {
    return <Loading />;
  }

  const handleUpdatePlayer = (id: string, name: string, number: string) => {
    updatePlayer(id, { name, number });
  };

  return (
    <PlayerList
      players={players}
      onCreatePlayer={createPlayer}
      onUpdatePlayer={handleUpdatePlayer}
      onDeletePlayer={deletePlayer}
    />
  );
}
