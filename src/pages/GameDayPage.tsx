import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameDay } from '@/components/game/GameDay';
import { usePlayers } from '@/hooks/usePlayers';
import { useGames } from '@/hooks/useGames';
import { Loading } from '@/components/common/Loading';

export function GameDayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { players, loading: playersLoading } = usePlayers();
  const { games, loading: gamesLoading, refresh } = useGames();

  const game = games.find(g => g.id === gameId);

  if (playersLoading || gamesLoading) {
    return <Loading />;
  }

  if (!game) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">Game not found</p>
          <button
            onClick={() => navigate('/schedule')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Return to schedule
          </button>
        </div>
      </div>
    );
  }

  if (game.status === 'scheduled') {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">This game hasn't started yet</p>
          <button
            onClick={() => navigate(`/game/${gameId}/setup`)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go to game setup
          </button>
        </div>
      </div>
    );
  }

  return <GameDay game={game} players={players} onRefresh={refresh} />;
}
