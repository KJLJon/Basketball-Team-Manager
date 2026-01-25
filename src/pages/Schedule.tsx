import React from 'react';
import { GameList } from '@/components/game/GameList';
import { useGames } from '@/hooks/useGames';
import { Loading } from '@/components/common/Loading';

export function Schedule() {
  const { games, loading, createGame, deleteGame, startGame } = useGames();

  if (loading) {
    return <Loading />;
  }

  return (
    <GameList
      games={games}
      onCreateGame={createGame}
      onDeleteGame={deleteGame}
      onStartGame={startGame}
    />
  );
}
