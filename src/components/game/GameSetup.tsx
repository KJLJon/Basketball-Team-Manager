import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Game, Player } from '@/types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { formatDate } from '@/utils/date';

interface GameSetupProps {
  game: Game;
  players: Player[];
  onUpdateAttendance: (attendance: string[]) => void;
  onStartGame: () => void;
}

export function GameSetup({ game, players, onUpdateAttendance, onStartGame }: GameSetupProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(game.attendance);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedPlayers(game.attendance);
  }, [game.attendance]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSaveAndStart = () => {
    if (selectedPlayers.length === 0) {
      alert('Please select at least one player');
      return;
    }

    if (selectedPlayers.length < 5) {
      if (!confirm(`You have selected ${selectedPlayers.length} players, which is less than 5. Continue?`)) {
        return;
      }
    }

    onUpdateAttendance(selectedPlayers);
    onStartGame();
    navigate(`/game/${game.id}`);
  };

  const handleSave = () => {
    onUpdateAttendance(selectedPlayers);
  };

  // Sort players alphabetically by name
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 space-y-4 pb-40">
      <Card>
        <h2 className="text-xl font-bold mb-2">Game Setup</h2>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Opponent:</strong> {game.opponent}</p>
          <p><strong>Date:</strong> {formatDate(game.date)}</p>
          <p><strong>Location:</strong> {game.location}</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">
          Select Players Attending ({selectedPlayers.length} selected)
        </h3>

        <div className="space-y-2">
          {sortedPlayers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No players available. Add players first.
            </p>
          ) : (
            sortedPlayers.map(player => (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedPlayers.includes(player.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPlayers.includes(player.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedPlayers.includes(player.id) && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="player-badge">{player.number}</div>
                  <div className="text-left">
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-gray-500">#{player.number}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div className="fixed bottom-20 left-0 right-0 p-4 pb-6 bg-white border-t space-y-3">
        <Button
          onClick={handleSaveAndStart}
          variant="success"
          size="lg"
          className="w-full"
          disabled={selectedPlayers.length === 0}
        >
          Save & Start Game
        </Button>
        <Button onClick={handleSave} variant="secondary" className="w-full">
          Save Attendance
        </Button>
      </div>
    </div>
  );
}
