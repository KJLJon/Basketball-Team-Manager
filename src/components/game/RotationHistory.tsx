import React, { useState } from 'react';
import type { Game, Player, Quarter, SwapNumber } from '@/types';
import { Card } from '../common/Card';
import { GameService } from '@/services/game';
import { StatsService } from '@/services/stats';

interface RotationHistoryProps {
  game: Game;
  players: Player[];
  onRefresh: () => void;
}

export function RotationHistory({ game, players, onRefresh }: RotationHistoryProps) {
  const [editingRotation, setEditingRotation] = useState<{ quarter: Quarter; swap: SwapNumber } | null>(null);
  const [editingMinutes, setEditingMinutes] = useState<Record<string, number>>({});

  // Group rotations by quarter and swap
  const rotationsByQuarter = game.rotations.reduce((acc, rotation) => {
    const key = `Q${rotation.quarter}-S${rotation.swap}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(rotation);
    return acc;
  }, {} as Record<string, typeof game.rotations>);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.name} (#${player.number})` : 'Unknown';
  };

  const handleEditMinutes = (quarter: Quarter, swap: SwapNumber) => {
    setEditingRotation({ quarter, swap });
    const rotations = game.rotations.filter(r => r.quarter === quarter && r.swap === swap);
    const minutes: Record<string, number> = {};
    rotations.forEach(r => {
      r.playersOnCourt.forEach(playerId => {
        minutes[playerId] = r.minutes;
      });
    });
    setEditingMinutes(minutes);
  };

  const handleSaveMinutes = () => {
    if (!editingRotation) return;

    // Update the rotation minutes
    const { quarter, swap } = editingRotation;
    const rotations = game.rotations.filter(r => r.quarter === quarter && r.swap === swap);

    // For each rotation in this quarter/swap, update the minutes
    rotations.forEach(rotation => {
      const newMinutes = editingMinutes[rotation.playersOnCourt[0]] || rotation.minutes;
      GameService.updateRotation(game.id, quarter, swap, { minutes: newMinutes });
    });

    // Recalculate play time
    StatsService.updatePlayTimeForGame(game.id);

    setEditingRotation(null);
    setEditingMinutes({});
    onRefresh();
  };

  return (
    <div className="space-y-4 pb-24">
      <Card>
        <h3 className="font-semibold text-lg mb-2">Rotation History</h3>
        <p className="text-sm text-gray-600">
          View all rotations from this game. Click on a rotation to edit play times.
        </p>
      </Card>

      {Object.keys(rotationsByQuarter).length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            No rotations recorded for this game.
          </p>
        </Card>
      ) : (
        Object.entries(rotationsByQuarter).map(([key, rotations]) => {
          const [quarterStr, swapStr] = key.split('-');
          const quarter = parseInt(quarterStr.substring(1)) as Quarter;
          const swap = parseInt(swapStr.substring(1)) as SwapNumber;
          const isEditing = editingRotation?.quarter === quarter && editingRotation?.swap === swap;

          return (
            <Card key={key}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">
                  Quarter {quarter} - Swap {swap}
                </h4>
                {!isEditing ? (
                  <button
                    onClick={() => handleEditMinutes(quarter, swap)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit Times
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveMinutes}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingRotation(null);
                        setEditingMinutes({});
                      }}
                      className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {rotations.map((rotation, index) => (
                  <div key={index} className="bg-gray-50 rounded p-3">
                    <div className="text-sm font-medium mb-2">
                      Rotation {index + 1}
                    </div>
                    <div className="space-y-1">
                      {rotation.playersOnCourt.map(playerId => {
                        const playerPlayTime = StatsService.calculatePlayTime(game.id, playerId);
                        return (
                          <div key={playerId} className="flex items-center justify-between text-sm">
                            <span>{getPlayerName(playerId)}</span>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  max="8"
                                  value={editingMinutes[playerId] || rotation.minutes}
                                  onChange={(e) => setEditingMinutes({
                                    ...editingMinutes,
                                    [playerId]: parseInt(e.target.value) || 0
                                  })}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                              ) : (
                                <span className="text-gray-600">{rotation.minutes} min</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  Total time in this swap: {rotations.reduce((sum, r) => sum + r.minutes, 0)} minutes
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
