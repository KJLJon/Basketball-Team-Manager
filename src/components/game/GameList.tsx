import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Game } from '@/types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { GameForm } from './GameForm';
import { formatDate } from '@/utils/date';

interface GameListProps {
  games: Game[];
  onCreateGame: (opponent: string, date: string, location: string) => void;
  onDeleteGame: (id: string) => void;
  onStartGame: (id: string) => void;
}

export function GameList({ games, onCreateGame, onDeleteGame, onStartGame }: GameListProps) {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleCreate = (opponent: string, date: string, location: string) => {
    onCreateGame(opponent, date, location);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      onDeleteGame(id);
    }
  };

  const handleGameClick = (game: Game) => {
    if (game.status === 'in-progress') {
      navigate(`/game/${game.id}`);
    } else {
      navigate(`/game/${game.id}/setup`);
    }
  };

  const handleStartGame = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    onStartGame(gameId);
    navigate(`/game/${gameId}`);
  };

  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const inProgressGame = games.find(g => g.status === 'in-progress');
  const completedGames = games.filter(g => g.status === 'completed');

  const getStatusBadge = (status: Game['status']) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      scheduled: 'Scheduled',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Games</h2>
        <Button onClick={() => setShowForm(true)}>Add Game</Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Add New Game</h3>
          <GameForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Card>
      )}

      {inProgressGame && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-green-600">Active Game</h3>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-green-500"
            onClick={() => handleGameClick(inProgressGame)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-lg">vs {inProgressGame.opponent}</h4>
                  {getStatusBadge(inProgressGame.status)}
                </div>
                <p className="text-sm text-gray-600">{formatDate(inProgressGame.date)}</p>
                <p className="text-sm text-gray-600">{inProgressGame.location}</p>
                <p className="text-sm text-blue-600 mt-2">
                  Quarter {inProgressGame.currentQuarter}, Swap {inProgressGame.currentSwap}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {upcomingGames.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Upcoming Games</h3>
          <div className="space-y-3">
            {upcomingGames.map(game => (
              <Card
                key={game.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleGameClick(game)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">vs {game.opponent}</h4>
                      {getStatusBadge(game.status)}
                    </div>
                    <p className="text-sm text-gray-600">{formatDate(game.date)}</p>
                    <p className="text-sm text-gray-600">{game.location}</p>
                    {game.attendance.length > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        {game.attendance.length} players attending
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(game.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedGames.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Past Games</h3>
          <div className="space-y-3">
            {completedGames.slice(0, 5).map(game => (
              <Card
                key={game.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleGameClick(game)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">vs {game.opponent}</h4>
                      {getStatusBadge(game.status)}
                    </div>
                    <p className="text-sm text-gray-600">{formatDate(game.date)}</p>
                    <p className="text-sm text-gray-600">{game.location}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">
            No games scheduled. Add your first game!
          </p>
        </Card>
      )}
    </div>
  );
}
