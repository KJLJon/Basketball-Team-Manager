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
  const [editingCell, setEditingCell] = useState<{
    playerId: string;
    quarter: Quarter;
    swap: SwapNumber;
    currentMinutes: number;
  } | null>(null);
  const [editingSwapsAttended, setEditingSwapsAttended] = useState<Record<string, number>>({});

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

  const handleSwapsAttendedChange = (playerId: string, swaps: number) => {
    setEditingSwapsAttended(prev => ({
      ...prev,
      [playerId]: swaps
    }));
  };

  const handleSaveAttendanceChanges = () => {
    // Update swaps attended for all modified players
    Object.entries(editingSwapsAttended).forEach(([playerId, swaps]) => {
      GameService.updatePlayerSwapsAttended(game.id, playerId, swaps);
    });

    // Reset editing state
    setEditingSwapsAttended({});
    setShowAttendanceModal(false);
    onRefresh();
  };

  const handleOpenAttendanceModal = () => {
    // Initialize editing state with current swaps attended values
    const initialSwapsAttended: Record<string, number> = {};
    allPlayersSorted.forEach(player => {
      const playerStats = game.stats[player.id];
      initialSwapsAttended[player.id] = playerStats?.swapsAttended ?? (game.attendance.includes(player.id) ? 8 : 0);
    });
    setEditingSwapsAttended(initialSwapsAttended);
    setShowAttendanceModal(true);
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
    return rotations.reduce((sum, r) => {
      // Use NEW playerMinutes if available, fallback to OLD minutes
      if (r.playerMinutes && r.playerMinutes[playerId] !== undefined) {
        return sum + r.playerMinutes[playerId];
      }
      return sum + r.minutes;
    }, 0);
  };

  // Get total minutes for a player
  const getTotalMinutes = (playerId: string): number => {
    return game.rotations
      .filter(r => r.playersOnCourt.includes(playerId))
      .reduce((sum, r) => {
        // Use NEW playerMinutes if available, fallback to OLD minutes
        if (r.playerMinutes && r.playerMinutes[playerId] !== undefined) {
          return sum + r.playerMinutes[playerId];
        }
        return sum + r.minutes;
      }, 0);
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
      // Create new rotation with playerMinutes
      const newRotation: Rotation = {
        quarter,
        swap,
        playersOnCourt: [playerId],
        minutes: 4, // DEPRECATED: kept for backward compatibility
        playerMinutes: { [playerId]: 4 }, // NEW: per-player minutes
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

  // Handle updating custom minutes for a specific player in a rotation
  const handleUpdatePlayerMinutes = (
    playerId: string,
    quarter: Quarter,
    swap: SwapNumber,
    minutes: number
  ) => {
    GameService.updatePlayerMinutesInRotation(game.id, quarter, swap, playerId, minutes);
    setEditingCell(null);
    onRefresh();
  };

  // Handle cell click for custom minutes editing
  const handleCellClick = (
    playerId: string,
    quarter: Quarter,
    swap: SwapNumber,
    currentMinutes: number
  ) => {
    if (showRotationEditor) {
      // Start editing this cell
      setEditingCell({ playerId, quarter, swap, currentMinutes });
    } else {
      setSelectedPlayer(playerId);
    }
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
          onClick={handleOpenAttendanceModal}
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
          Tap a player to edit stats. {showRotationEditor ? 'Click cells to edit individual player minutes (0-8). Enter to save, Escape to cancel. Set to 0 to remove from rotation.' : 'Minutes shown per swap. Click "Edit Rotations" to modify.'}
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
                      const isEditing = editingCell?.playerId === player.id &&
                                       editingCell?.quarter === quarter &&
                                       editingCell?.swap === swap;

                      return (
                        <td
                          key={`${player.id}-q${quarter}-s${swap}`}
                          className={`border-r border-b border-gray-300 px-1 py-1.5 text-center ${
                            showRotationEditor ? 'cursor-pointer hover:bg-yellow-100' : ''
                          } ${
                            isInSwap ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-300'
                          }`}
                          onClick={() => handleCellClick(player.id, quarter, swap, mins)}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              max={8}
                              step={1}
                              defaultValue={mins > 0 ? mins : ''}
                              placeholder="0"
                              autoFocus
                              className="w-full text-center border rounded px-1"
                              style={{ maxWidth: '40px' }}
                              onBlur={(e) => {
                                const value = e.target.value.trim();
                                const newMinutes = value === '' ? 0 : parseInt(value);
                                if (!isNaN(newMinutes)) {
                                  handleUpdatePlayerMinutes(
                                    player.id,
                                    quarter,
                                    swap,
                                    Math.max(0, Math.min(8, newMinutes))
                                  );
                                } else {
                                  setEditingCell(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const value = (e.target as HTMLInputElement).value.trim();
                                  const newMinutes = value === '' ? 0 : parseInt(value);
                                  if (!isNaN(newMinutes)) {
                                    handleUpdatePlayerMinutes(
                                      player.id,
                                      quarter,
                                      swap,
                                      Math.max(0, Math.min(8, newMinutes))
                                    );
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            isInSwap ? `${mins}m` : (showRotationEditor ? '+' : '-')
                          )}
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
              Edit swaps attended (0-8) for each player. This is separate from minutes played.
            </p>
            <div className="space-y-3">
              {allPlayersSorted.map((player) => {
                const swapsAttended = editingSwapsAttended[player.id] ?? 0;
                const minutesPlayed = getTotalMinutes(player.id);
                const swapsPlayed = getSwapsAttended(player.id);

                // Validation warnings
                const hasInconsistency = (swapsAttended > 0 && minutesPlayed === 0) ||
                                        (swapsAttended === 0 && minutesPlayed > 0);
                const maxMinutes = swapsAttended * 4; // Max possible minutes based on swaps
                const hasExcessMinutes = minutesPlayed > maxMinutes && swapsAttended > 0;

                return (
                  <div
                    key={player.id}
                    className="p-3 rounded-lg border-2 border-gray-200 bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="font-semibold mb-2">#{player.number} {player.name}</div>

                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">
                              Swaps Attended:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={8}
                              value={swapsAttended}
                              onChange={(e) => handleSwapsAttendedChange(
                                player.id,
                                Math.max(0, Math.min(8, parseInt(e.target.value) || 0))
                              )}
                              className="w-20 px-2 py-1 border rounded text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs text-gray-500 ml-2">/ 8</span>
                          </div>

                          <div className="text-sm text-gray-600">
                            <div className="text-xs text-gray-500 mb-1">Minutes Played:</div>
                            <div className="font-medium">{minutesPlayed} min</div>
                          </div>
                        </div>

                        {/* Warning indicators */}
                        {swapsAttended > 0 && minutesPlayed === 0 && (
                          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                            ⚠️ Present but didn't play
                          </div>
                        )}

                        {swapsAttended === 0 && minutesPlayed > 0 && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            ⚠️ Played but marked absent
                          </div>
                        )}

                        {hasExcessMinutes && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            ⚠️ {minutesPlayed} min exceeds {maxMinutes} max for {swapsAttended} swaps
                          </div>
                        )}

                        {swapsAttended > 0 && !hasInconsistency && !hasExcessMinutes && (
                          <div className="text-xs text-green-600">
                            ✓ Valid ({swapsPlayed} swaps played)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingSwapsAttended({});
                  setShowAttendanceModal(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAttendanceChanges}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
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
