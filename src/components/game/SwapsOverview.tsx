import React, { useState } from 'react';
import type { Game, Player, Quarter, SwapNumber, Rotation } from '@/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EditableStatRow } from './EditableStatRow';
import { StatsService } from '@/services/stats';
import { GameService } from '@/services/game';

interface SwapsOverviewProps {
  game: Game;
  players: Player[];
  allPlayers?: Player[]; // All team players for attendance editing
  onRefresh: () => void;
}

export function SwapsOverview({ game, players, allPlayers, onRefresh }: SwapsOverviewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showRotationEditor, setShowRotationEditor] = useState(false);
  const [editingRotation, setEditingRotation] = useState<{ quarter: Quarter; swap: SwapNumber } | null>(null);

  const handleIncrementStat = (playerId: string, stat: string) => {
    StatsService.incrementStat(game.id, playerId, stat as any);
    onRefresh();
  };

  const handleDecrementStat = (playerId: string, stat: string) => {
    const currentStats = StatsService.getPlayerGameStats(game.id, playerId);
    const currentValue = currentStats[stat as keyof typeof currentStats] as number;
    if (currentValue > 0) {
      StatsService.updatePlayerGameStats(game.id, playerId, {
        [stat]: currentValue - 1,
      });
      onRefresh();
    }
  };

  const handleToggleAttendance = (playerId: string) => {
    const currentAttendance = [...game.attendance];
    const index = currentAttendance.indexOf(playerId);
    if (index >= 0) {
      currentAttendance.splice(index, 1);
    } else {
      currentAttendance.push(playerId);
    }
    GameService.setAttendance(game.id, currentAttendance);
    onRefresh();
  };

  // Get all quarter/swap combinations
  const quarterSwaps: Array<{ quarter: Quarter; swap: SwapNumber }> = [];
  for (let q = 1; q <= 4; q++) {
    for (let s = 1; s <= 2; s++) {
      quarterSwaps.push({ quarter: q as Quarter, swap: s as SwapNumber });
    }
  }

  // Get attending players for this game, sorted by number
  const attendingPlayers = players
    .filter(p => game.attendance.includes(p.id))
    .sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

  // All players sorted by number for attendance modal
  const allPlayersSorted = (allPlayers || players).slice().sort((a, b) => {
    const numA = parseInt(a.number) || 0;
    const numB = parseInt(b.number) || 0;
    return numA - numB;
  });

  // Helper to get minutes for a player in a specific quarter/swap
  const getPlayerMinutes = (playerId: string, quarter: Quarter, swap: SwapNumber): number => {
    const rotations = game.rotations.filter(
      r => r.quarter === quarter && r.swap === swap && r.playersOnCourt.includes(playerId)
    );
    return rotations.reduce((sum, r) => sum + r.minutes, 0);
  };

  // Get total minutes for a player
  const getTotalMinutes = (playerId: string): number => {
    return game.rotations
      .filter(r => r.playersOnCourt.includes(playerId))
      .reduce((sum, r) => sum + r.minutes, 0);
  };

  // Count swaps attended (out of 8)
  const getSwapsAttended = (playerId: string): number => {
    const swapsPlayed = new Set<string>();
    game.rotations.forEach(r => {
      if (r.playersOnCourt.includes(playerId)) {
        swapsPlayed.add(`${r.quarter}-${r.swap}`);
      }
    });
    return swapsPlayed.size;
  };

  // Get rotations for a specific quarter/swap
  const getRotationsForSwap = (quarter: Quarter, swap: SwapNumber): Rotation[] => {
    return game.rotations.filter(r => r.quarter === quarter && r.swap === swap);
  };

  // Handle adding a player to a specific swap
  const handleAddPlayerToSwap = (playerId: string, quarter: Quarter, swap: SwapNumber) => {
    const existingRotations = getRotationsForSwap(quarter, swap);

    if (existingRotations.length === 0) {
      // Create new rotation
      const newRotation: Rotation = {
        quarter,
        swap,
        playersOnCourt: [playerId],
        minutes: 4,
      };
      GameService.addRotation(game.id, newRotation);
    } else {
      // Add to existing rotation (if not already there and less than 5 players)
      const lastRotation = existingRotations[existingRotations.length - 1];
      if (!lastRotation.playersOnCourt.includes(playerId)) {
        const updatedPlayers = [...lastRotation.playersOnCourt, playerId].slice(0, 5);
        GameService.updateRotation(game.id, quarter, swap, { playersOnCourt: updatedPlayers });
      }
    }
    onRefresh();
  };

  // Handle removing a player from a specific swap
  const handleRemovePlayerFromSwap = (playerId: string, quarter: Quarter, swap: SwapNumber) => {
    const existingRotations = getRotationsForSwap(quarter, swap);

    existingRotations.forEach(rotation => {
      if (rotation.playersOnCourt.includes(playerId)) {
        const updatedPlayers = rotation.playersOnCourt.filter(id => id !== playerId);
        if (updatedPlayers.length > 0) {
          GameService.updateRotation(game.id, quarter, swap, { playersOnCourt: updatedPlayers });
        } else {
          // Remove the rotation entirely if no players left
          const updatedRotations = game.rotations.filter(
            r => !(r.quarter === quarter && r.swap === swap && r.playersOnCourt.includes(playerId))
          );
          GameService.updateGame(game.id, { rotations: updatedRotations });
        }
      }
    });
    onRefresh();
  };

  // Handle updating minutes for a swap
  const handleUpdateSwapMinutes = (quarter: Quarter, swap: SwapNumber, minutes: number) => {
    GameService.updateRotation(game.id, quarter, swap, { minutes: Math.max(0, Math.min(8, minutes)) });
    onRefresh();
  };

  const selectedPlayerData = selectedPlayer ? players.find(p => p.id === selectedPlayer) : null;
  const selectedPlayerStats = selectedPlayer ? StatsService.getPlayerGameStats(game.id, selectedPlayer) : null;

  return (
    <div className="space-y-4 pb-24">
      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowAttendanceModal(true)}
        >
          Edit Attendance
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowRotationEditor(!showRotationEditor)}
        >
          {showRotationEditor ? 'Hide Editor' : 'Edit Rotations'}
        </Button>
      </div>

      <Card className="p-2 sm:p-4">
        <h3 className="font-semibold text-lg mb-2">Quarter & Swap Overview</h3>
        <p className="text-xs text-gray-600 mb-3">
          Tap a player to edit stats. {showRotationEditor ? 'Click cells to toggle player in/out of swap.' : 'Minutes shown per swap.'}
        </p>

        {/* Scrollable table container */}
        <div
          className="overflow-auto border border-gray-300 rounded"
          style={{ maxHeight: '60vh' }}
        >
          <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr>
                {/* Corner cell - sticky both ways */}
                <th
                  className="bg-gray-200 border-r border-b border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap"
                  style={{
                    position: 'sticky',
                    left: 0,
                    top: 0,
                    zIndex: 20,
                    minWidth: '80px'
                  }}
                >
                  Player
                </th>
                {/* Quarter/Swap headers - sticky top */}
                {quarterSwaps.map(({ quarter, swap }) => (
                  <th
                    key={`h-q${quarter}-s${swap}`}
                    className="bg-gray-200 border-r border-b border-gray-300 px-2 py-2 text-center font-semibold whitespace-nowrap"
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      minWidth: '44px'
                    }}
                  >
                    <div className="text-xs">Q{quarter}</div>
                    <div className="text-[10px] text-gray-600">S{swap}</div>
                  </th>
                ))}
                {/* Total column header */}
                <th
                  className="bg-gray-300 border-b border-gray-400 px-2 py-2 text-center font-bold whitespace-nowrap"
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    minWidth: '44px'
                  }}
                >
                  <div className="text-xs">Tot</div>
                  <div className="text-[10px] text-gray-600">Swaps</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {attendingPlayers.map((player) => {
                const isSelected = selectedPlayer === player.id;
                const totalMins = getTotalMinutes(player.id);
                const swapsAttended = getSwapsAttended(player.id);

                return (
                  <tr
                    key={player.id}
                    className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  >
                    {/* Player name cell - sticky left */}
                    <td
                      className={`border-r border-b border-gray-300 px-2 py-1.5 font-medium whitespace-nowrap cursor-pointer ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 5
                      }}
                      onClick={() => setSelectedPlayer(player.id)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-[10px]">#{player.number}</span>
                        <span className="truncate max-w-[60px]" title={player.name}>
                          {player.name.split(' ')[0]}
                        </span>
                      </div>
                    </td>
                    {/* Minutes cells for each quarter/swap */}
                    {quarterSwaps.map(({ quarter, swap }) => {
                      const mins = getPlayerMinutes(player.id, quarter, swap);
                      const isInSwap = mins > 0;

                      return (
                        <td
                          key={`${player.id}-q${quarter}-s${swap}`}
                          className={`border-r border-b border-gray-300 px-1 py-1.5 text-center ${
                            showRotationEditor ? 'cursor-pointer hover:bg-yellow-100' : ''
                          } ${
                            isInSwap ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-300'
                          }`}
                          onClick={() => {
                            if (showRotationEditor) {
                              if (isInSwap) {
                                handleRemovePlayerFromSwap(player.id, quarter, swap);
                              } else {
                                handleAddPlayerToSwap(player.id, quarter, swap);
                              }
                            } else {
                              setSelectedPlayer(player.id);
                            }
                          }}
                        >
                          {isInSwap ? `${mins}m` : (showRotationEditor ? '+' : '-')}
                        </td>
                      );
                    })}
                    {/* Total column */}
                    <td
                      className={`border-b border-gray-400 px-1 py-1.5 text-center font-bold ${
                        totalMins > 0 ? 'bg-blue-50 text-blue-800' : 'text-gray-400'
                      }`}
                      onClick={() => setSelectedPlayer(player.id)}
                    >
                      <div>{totalMins}m</div>
                      <div className="text-[10px] font-normal">{swapsAttended}/8</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {attendingPlayers.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No players marked as attending this game.
          </p>
        )}
      </Card>

      {/* Minutes Editor for each swap */}
      {showRotationEditor && (
        <Card className="p-3">
          <h4 className="font-semibold mb-3">Adjust Swap Minutes</h4>
          <div className="grid grid-cols-4 gap-2">
            {quarterSwaps.map(({ quarter, swap }) => {
              const rotations = getRotationsForSwap(quarter, swap);
              const currentMinutes = rotations.length > 0 ? rotations[0].minutes : 4;

              return (
                <div key={`mins-q${quarter}-s${swap}`} className="text-center">
                  <div className="text-xs font-medium mb-1">Q{quarter}S{swap}</div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className="w-6 h-6 bg-gray-200 rounded text-sm font-bold"
                      onClick={() => handleUpdateSwapMinutes(quarter, swap, currentMinutes - 1)}
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm">{currentMinutes}</span>
                    <button
                      className="w-6 h-6 bg-gray-200 rounded text-sm font-bold"
                      onClick={() => handleUpdateSwapMinutes(quarter, swap, currentMinutes + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Attendance</h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Toggle players to mark them as attending or not attending this game.
            </p>
            <div className="space-y-2">
              {allPlayersSorted.map((player) => {
                const isAttending = game.attendance.includes(player.id);
                const swapsPlayed = getSwapsAttended(player.id);

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleToggleAttendance(player.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      isAttending
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isAttending
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isAttending && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">#{player.number} {player.name}</div>
                        {isAttending && swapsPlayed > 0 && (
                          <div className="text-xs text-gray-500">
                            {swapsPlayed}/8 swaps played
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setShowAttendanceModal(false)}
              className="w-full mt-4"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {selectedPlayer && selectedPlayerData && selectedPlayerStats && (() => {
        // Extract selectedPlayer to a const so TypeScript knows it's not null in callbacks
        const playerId = selectedPlayer;
        const swapsPlayed = getSwapsAttended(playerId);

        return (
          <Card className="border-2 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  {selectedPlayerData.number}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedPlayerData.name}</h3>
                  <p className="text-sm text-gray-600">
                    {getTotalMinutes(playerId)} min played ({swapsPlayed}/8 swaps)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <div className="mb-3 p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedPlayerStats.made1pt + selectedPlayerStats.made2pt * 2 + selectedPlayerStats.made3pt * 3}
                </div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>

              <EditableStatRow
                label="Steals"
                value={selectedPlayerStats.steals}
                onIncrement={() => handleIncrementStat(playerId, 'steals')}
                onDecrement={() => handleDecrementStat(playerId, 'steals')}
              />
              <EditableStatRow
                label="Rebounds"
                value={selectedPlayerStats.rebounds}
                onIncrement={() => handleIncrementStat(playerId, 'rebounds')}
                onDecrement={() => handleDecrementStat(playerId, 'rebounds')}
              />
              <EditableStatRow
                label="Made 1pt"
                value={selectedPlayerStats.made1pt}
                onIncrement={() => {
                  handleIncrementStat(playerId, 'made1pt');
                  handleIncrementStat(playerId, 'attempts1pt');
                }}
                onDecrement={() => {
                  handleDecrementStat(playerId, 'made1pt');
                  handleDecrementStat(playerId, 'attempts1pt');
                }}
              />
              <EditableStatRow
                label="Made 2pt"
                value={selectedPlayerStats.made2pt}
                onIncrement={() => {
                  handleIncrementStat(playerId, 'made2pt');
                  handleIncrementStat(playerId, 'attempts2pt');
                }}
                onDecrement={() => {
                  handleDecrementStat(playerId, 'made2pt');
                  handleDecrementStat(playerId, 'attempts2pt');
                }}
              />
              <EditableStatRow
                label="Made 3pt"
                value={selectedPlayerStats.made3pt}
                onIncrement={() => {
                  handleIncrementStat(playerId, 'made3pt');
                  handleIncrementStat(playerId, 'attempts3pt');
                }}
                onDecrement={() => {
                  handleDecrementStat(playerId, 'made3pt');
                  handleDecrementStat(playerId, 'attempts3pt');
                }}
              />
              <EditableStatRow
                label="Miss 1pt"
                value={selectedPlayerStats.attempts1pt - selectedPlayerStats.made1pt}
                onIncrement={() => handleIncrementStat(playerId, 'attempts1pt')}
                onDecrement={() => handleDecrementStat(playerId, 'attempts1pt')}
              />
              <EditableStatRow
                label="Miss 2pt"
                value={selectedPlayerStats.attempts2pt - selectedPlayerStats.made2pt}
                onIncrement={() => handleIncrementStat(playerId, 'attempts2pt')}
                onDecrement={() => handleDecrementStat(playerId, 'attempts2pt')}
              />
              <EditableStatRow
                label="Miss 3pt"
                value={selectedPlayerStats.attempts3pt - selectedPlayerStats.made3pt}
                onIncrement={() => handleIncrementStat(playerId, 'attempts3pt')}
                onDecrement={() => handleDecrementStat(playerId, 'attempts3pt')}
              />
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
