import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameSetup } from '@/components/game/GameSetup';
import { usePlayers } from '@/hooks/usePlayers';
import { useGames } from '@/hooks/useGames';
import { GameService } from '@/services/game';
import { Loading } from '@/components/common/Loading';

export function GameSetupPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { players, loading: playersLoading } = usePlayers();
  const { games, loading: gamesLoading, refresh, startGame } = useGames();

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

  const handleUpdateAttendance = (attendance: string[]) => {
    GameService.setAttendance(game.id, attendance);
    refresh();
  };

  const handleStartGame = () => {
    startGame(game.id);
  };

  return (
    <GameSetup
      game={game}
      players={players}
      onUpdateAttendance={handleUpdateAttendance}
      onStartGame={handleStartGame}
    />
  );
}
