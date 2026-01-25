import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayerDetail } from '@/components/stats/PlayerDetail';
import { usePlayers } from '@/hooks/usePlayers';
import { useGames } from '@/hooks/useGames';
import { Loading } from '@/components/common/Loading';

export function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { players, loading: playersLoading } = usePlayers();
  const { games, loading: gamesLoading } = useGames();

  const player = players.find(p => p.id === playerId);

  if (playersLoading || gamesLoading) {
    return <Loading />;
  }

  if (!player) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">Player not found</p>
          <button
            onClick={() => navigate('/stats')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Return to stats
          </button>
        </div>
      </div>
    );
  }

  return <PlayerDetail player={player} games={games} />;
}
