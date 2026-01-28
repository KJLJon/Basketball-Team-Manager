import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Game, Player, Quarter, SwapNumber, RotationAlgorithm, ManualRotationSelection } from '@/types';
import { Card } from '../common/Card';
import { RotationService } from '@/services/rotation';
import { StorageService } from '@/services/storage';
import { StatsService } from '@/services/stats';
import { GameService } from '@/services/game';

interface FullScheduleProps {
  game: Game;
  players: Player[];
  onGameUpdate?: () => void; // Callback to refresh game data after manual changes
}

export function FullSchedule({ game, players, onGameUpdate }: FullScheduleProps) {
  const attendingPlayers = players.filter(p => game.attendance.includes(p.id));
  const [algorithm, setAlgorithm] = useState<RotationAlgorithm>(
    StorageService.getRotationAlgorithm()
  );
  const [recalcCounter, setRecalcCounter] = useState(0); // Force recalculation trigger

  // Local state for manual selections (synced with game.manualRotations)
  const [manualSelections, setManualSelections] = useState<ManualRotationSelection>(
    game.manualRotations || {}
  );

  // Track if manual mode has been initialized with preferred algorithm
  const [manualInitialized, setManualInitialized] = useState(
    Object.keys(game.manualRotations || {}).length > 0
  );

  // Get all quarter/swap combinations
  const quarterSwaps: Array<{ quarter: Quarter; swap: SwapNumber; rotationNum: number }> = [];
  for (let q = 1; q <= 4; q++) {
    for (let s = 1; s <= 2; s++) {
      quarterSwaps.push({
        quarter: q as Quarter,
        swap: s as SwapNumber,
        rotationNum: (q - 1) * 2 + s,
      });
    }
  }

  // Current rotation number (1-8)
  const currentRotationNum = game.currentQuarter && game.currentSwap
    ? (game.currentQuarter - 1) * 2 + game.currentSwap
    : 0;

  // Generate the "preferred" schedule (used as baseline for manual mode)
  const preferredSchedule = useMemo(() => {
    const attendingPlayerIds = attendingPlayers.map(p => p.id);
    return RotationService.optimizeGameRosterPreferred(game.id, attendingPlayerIds);
  }, [game.id, attendingPlayers]);

  // Initialize manual selections from preferred when switching to manual mode
  useEffect(() => {
    if (algorithm === 'manual' && !manualInitialized) {
      const newManualSelections: ManualRotationSelection = {};

      quarterSwaps.forEach(({ quarter, swap, rotationNum }) => {
        const key = `Q${quarter}S${swap}`;
        // Check if this rotation already exists in the game (actual)
        const existingRotation = game.rotations.find(
          r => r.quarter === quarter && r.swap === swap
        );

        if (existingRotation) {
          // Use actual rotation
          newManualSelections[key] = existingRotation.playersOnCourt;
        } else {
          // Use preferred algorithm's recommendation
          const preferredRotation = preferredSchedule.rotations.find(
            r => r.quarter === quarter && r.swap === swap
          );
          newManualSelections[key] = preferredRotation?.playerIds || [];
        }
      });

      setManualSelections(newManualSelections);
      setManualInitialized(true);

      // Persist to game storage
      GameService.setManualRotations(game.id, newManualSelections);
      onGameUpdate?.();
    }
  }, [algorithm, manualInitialized, preferredSchedule, game.rotations, game.id, quarterSwaps, onGameUpdate]);

  // Sync manual selections when game.manualRotations changes externally
  useEffect(() => {
    if (game.manualRotations && Object.keys(game.manualRotations).length > 0) {
      setManualSelections(game.manualRotations);
      setManualInitialized(true);
    }
  }, [game.manualRotations]);

  // Generate full schedule using optimization
  const fullSchedule = useMemo(() => {
    const attendingPlayerIds = attendingPlayers.map(p => p.id);

    // For manual mode, use the manual selections
    if (algorithm === 'manual') {
      return quarterSwaps.map(({ quarter, swap, rotationNum }) => {
        const key = `Q${quarter}S${swap}`;
        // Check if this rotation already exists in the game (actual played rotation)
        const existingRotation = game.rotations.find(
          r => r.quarter === quarter && r.swap === swap
        );

        if (existingRotation) {
          // Use actual rotation from game (can't change past rotations)
          return {
            quarter,
            swap,
            rotationNum,
            playerIds: existingRotation.playersOnCourt,
            isActual: true,
          };
        } else {
          // Use manual selection
          return {
            quarter,
            swap,
            rotationNum,
            playerIds: manualSelections[key] || [],
            isActual: false,
          };
        }
      });
    }

    // For other algorithms, use optimization
    const optimization = algorithm === 'weighted'
      ? RotationService.optimizeGameRosterWeighted(game.id, attendingPlayerIds)
      : algorithm === 'preferred'
      ? RotationService.optimizeGameRosterPreferred(game.id, attendingPlayerIds)
      : RotationService.optimizeGameRoster(game.id, attendingPlayerIds);

    // Merge with existing rotations from the game
    return quarterSwaps.map(({ quarter, swap, rotationNum }) => {
      // Check if this rotation already exists in the game
      const existingRotation = game.rotations.find(
        r => r.quarter === quarter && r.swap === swap
      );

      if (existingRotation) {
        // Use actual rotation from game
        return {
          quarter,
          swap,
          rotationNum,
          playerIds: existingRotation.playersOnCourt,
          isActual: true,
        };
      } else {
        // Use optimized recommendation
        const optimizedRotation = optimization.rotations.find(
          r => r.quarter === quarter && r.swap === swap
        );
        return {
          quarter,
          swap,
          rotationNum,
          playerIds: optimizedRotation?.playerIds || [],
          isActual: false,
        };
      }
    });
  }, [game.id, game.rotations.length, JSON.stringify(game.rotations), attendingPlayers, algorithm, recalcCounter, manualSelections]);

  // Calculate player stats with projections including current scheduled game
  const playerProjectedStats = useMemo(() => {
    const statsMap: Record<string, {
      historicalPlayTime: number;
      historicalSwaps: number;
      currentGameSwaps: number;
      projectedTotalTime: number;
      projectedTotalSwaps: number;
      projectedNormalizedTime: number;
    }> = {};

    for (const player of attendingPlayers) {
      // Get historical stats (excluding current game if it's in progress)
      const seasonStats = StatsService.getPlayerSeasonStats(player.id);

      // Calculate current game's projected swaps from fullSchedule
      const currentGameSwaps = fullSchedule.filter(r => r.playerIds.includes(player.id)).length;
      const currentGameMinutes = currentGameSwaps * 4; // Each swap is 4 minutes

      // For historical stats, we need to subtract current game if it's already counted
      const currentGameStats = game.stats[player.id];
      const existingPlayTime = currentGameStats?.playTimeMinutes || 0;
      const existingSwapsAttended = currentGameStats?.swapsAttended || 0;

      // Historical values (without current game's existing recorded data)
      const historicalPlayTime = seasonStats.playTimeMinutes - existingPlayTime;
      const historicalSwaps = (seasonStats.gamesAttended * 8) - existingSwapsAttended;

      // Projected totals (historical + full projected current game)
      const projectedTotalTime = historicalPlayTime + currentGameMinutes;
      const projectedTotalSwaps = historicalSwaps + 8; // Full game = 8 swaps attended

      const projectedNormalizedTime = projectedTotalSwaps > 0
        ? projectedTotalTime / (projectedTotalSwaps / 8) // Normalize by games (swaps/8)
        : 0;

      statsMap[player.id] = {
        historicalPlayTime,
        historicalSwaps,
        currentGameSwaps,
        projectedTotalTime,
        projectedTotalSwaps,
        projectedNormalizedTime,
      };
    }

    return statsMap;
  }, [attendingPlayers, fullSchedule, game.stats]);

  const handleAlgorithmToggle = () => {
    const newAlgorithm: RotationAlgorithm = algorithm === 'simple'
      ? 'weighted'
      : algorithm === 'weighted'
      ? 'preferred'
      : algorithm === 'preferred'
      ? 'manual'
      : 'simple';
    setAlgorithm(newAlgorithm);
    StorageService.setRotationAlgorithm(newAlgorithm);

    // Reset manual initialization when switching away from manual
    if (algorithm === 'manual' && newAlgorithm !== 'manual') {
      // Keep the manual selections stored in case user switches back
    }
  };

  const handleRecalculate = () => {
    // Don't recalculate in manual mode
    if (algorithm === 'manual') return;
    setRecalcCounter(prev => prev + 1);
  };

  // Handle clicking a cell in manual mode to toggle a player
  const handleCellClick = useCallback((quarter: Quarter, swap: SwapNumber, playerId: string, isActual: boolean, rotationNum: number) => {
    // Only allow editing in manual mode
    if (algorithm !== 'manual') return;
    if (isActual) return; // Can't edit actual/started rotations
    // Allow editing current rotation if not started, or any future rotation
    if (rotationNum < currentRotationNum) return; // Can't edit past rotations

    const key = `Q${quarter}S${swap}`;
    const currentPlayers = manualSelections[key] || [];

    let newPlayers: string[];
    if (currentPlayers.includes(playerId)) {
      // Remove player
      newPlayers = currentPlayers.filter(id => id !== playerId);
    } else {
      // Add player
      newPlayers = [...currentPlayers, playerId];
    }

    const newSelections = {
      ...manualSelections,
      [key]: newPlayers,
    };

    setManualSelections(newSelections);

    // Persist to game storage
    GameService.setManualRotations(game.id, newSelections);
    onGameUpdate?.();
  }, [algorithm, currentRotationNum, manualSelections, game.id, onGameUpdate]);

  // Sort players by name
  const sortedPlayers = [...attendingPlayers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4 pb-24">
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2 mb-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800">Full Game Schedule</h3>
            <p className="text-sm text-blue-700">
              Complete rotation schedule for all 8 swaps. Green = completed, Yellow = upcoming.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">Algorithm:</span>
            <button
              onClick={handleAlgorithmToggle}
              className={`px-3 py-1 text-sm rounded text-white transition-colors ${
                algorithm === 'manual'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {algorithm === 'simple' ? 'Simple' : algorithm === 'weighted' ? 'Weighted' : algorithm === 'preferred' ? 'Preferred' : 'Manual'}
            </button>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={algorithm === 'manual'}
            className={`px-3 py-1 text-sm rounded text-white transition-colors flex items-center gap-1 ${
              algorithm === 'manual'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            title={algorithm === 'manual' ? 'Recalculate disabled in manual mode' : 'Recalculate schedule based on current game state'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalculate
          </button>
        </div>

        {algorithm === 'manual' && (
          <div className="mt-3 pt-2 border-t border-orange-200 bg-orange-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
            <p className="text-xs text-orange-800">
              <strong>Manual Mode:</strong> Click cells to toggle players in/out for upcoming rotations.
              Changes are saved automatically.
            </p>
          </div>
        )}
      </Card>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2 text-left font-semibold sticky left-0 z-10">
                Player
              </th>
              {quarterSwaps.map(({ quarter, swap, rotationNum }) => {
                const isPast = rotationNum < currentRotationNum;
                const isCurrent = rotationNum === currentRotationNum;
                const bgColor = isPast
                  ? 'bg-green-100'
                  : isCurrent
                  ? 'bg-blue-100'
                  : 'bg-yellow-50';

                return (
                  <th
                    key={`header-q${quarter}s${swap}`}
                    className={`border border-gray-300 p-2 text-center font-semibold ${bgColor}`}
                  >
                    <div className="text-xs">Q{quarter}</div>
                    <div className="text-xs">S{swap}</div>
                  </th>
                );
              })}
              <th className="border border-gray-300 bg-gray-100 p-2 text-center font-semibold">
                Total
              </th>
              <th className="border border-gray-300 bg-purple-100 p-2 text-center font-semibold" title="Total game time across all games (including this scheduled game)">
                <div className="text-xs">Total</div>
                <div className="text-xs">Time</div>
              </th>
              <th className="border border-gray-300 bg-purple-100 p-2 text-center font-semibold" title="Normalized game time (total time / games attended)">
                <div className="text-xs">Norm</div>
                <div className="text-xs">Time</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map(player => {
              let totalSwaps = 0;

              return (
                <tr key={player.id}>
                  <td className="border border-gray-300 p-2 font-medium sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {player.number}
                      </div>
                      <span className="text-sm">{player.name}</span>
                    </div>
                  </td>
                  {fullSchedule.map(({ quarter, swap, rotationNum, playerIds, isActual }) => {
                    const isInSwap = playerIds.includes(player.id);
                    if (isInSwap) totalSwaps++;

                    const isPast = rotationNum < currentRotationNum;
                    const isCurrent = rotationNum === currentRotationNum;
                    const isFuture = rotationNum > currentRotationNum;
                    // Editable if: manual mode AND (future rotation OR current rotation that hasn't started yet)
                    const isEditable = algorithm === 'manual' && !isActual && (isFuture || isCurrent);

                    const bgColor = isPast
                      ? 'bg-green-100'
                      : isCurrent
                      ? 'bg-blue-100'
                      : 'bg-yellow-50';

                    return (
                      <td
                        key={`cell-${player.id}-q${quarter}s${swap}`}
                        onClick={() => handleCellClick(quarter, swap, player.id, isActual, rotationNum)}
                        className={`border border-gray-300 p-2 text-center ${bgColor} ${
                          isEditable
                            ? 'cursor-pointer hover:bg-orange-100 active:bg-orange-200'
                            : ''
                        }`}
                      >
                        {isInSwap && (
                          <span className="text-lg font-bold text-gray-800">✓</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 p-2 text-center font-semibold bg-gray-50">
                    {totalSwaps}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold bg-purple-50">
                    {playerProjectedStats[player.id]?.projectedTotalTime || 0}m
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold bg-purple-50">
                    {(playerProjectedStats[player.id]?.projectedNormalizedTime || 0).toFixed(1)}m
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <Card className="bg-gray-50">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border border-gray-300 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 border border-gray-300 rounded"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-50 border border-gray-300 rounded"></div>
            <span>Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">✓</span>
            <span>Player scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 border border-gray-300 rounded"></div>
            <span>Projected stats (includes this game)</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          <strong>Total Time:</strong> All games play time including projected time from this game's schedule.
          <strong> Norm Time:</strong> Total time normalized by games attended.
        </p>
      </Card>
    </div>
  );
}
