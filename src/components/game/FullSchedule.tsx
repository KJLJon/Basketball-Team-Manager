import React, { useState, useMemo } from 'react';
import type { Game, Player, Quarter, SwapNumber } from '@/types';
import { Card } from '../common/Card';
import { RotationService } from '@/services/rotation';
import { StorageService } from '@/services/storage';

interface FullScheduleProps {
  game: Game;
  players: Player[];
}

export function FullSchedule({ game, players }: FullScheduleProps) {
  const attendingPlayers = players.filter(p => game.attendance.includes(p.id));
  const [algorithm, setAlgorithm] = useState<'simple' | 'weighted' | 'preferred'>(
    StorageService.getRotationAlgorithm()
  );
  const [recalcCounter, setRecalcCounter] = useState(0); // Force recalculation trigger

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

  // Generate full schedule using optimization
  const fullSchedule = useMemo(() => {
    const attendingPlayerIds = attendingPlayers.map(p => p.id);
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
  }, [game.id, game.rotations.length, JSON.stringify(game.rotations), attendingPlayers, algorithm, recalcCounter]);

  const handleAlgorithmToggle = () => {
    const newAlgorithm = algorithm === 'simple'
      ? 'weighted'
      : algorithm === 'weighted'
      ? 'preferred'
      : 'simple';
    setAlgorithm(newAlgorithm);
    StorageService.setRotationAlgorithm(newAlgorithm);
  };

  const handleRecalculate = () => {
    setRecalcCounter(prev => prev + 1);
  };

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

        <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">Algorithm:</span>
            <button
              onClick={handleAlgorithmToggle}
              className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {algorithm === 'simple' ? 'Simple' : algorithm === 'weighted' ? 'Weighted' : 'Preferred'}
            </button>
          </div>
          <button
            onClick={handleRecalculate}
            className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1"
            title="Recalculate schedule based on current game state"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalculate
          </button>
        </div>
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
                    const bgColor = isPast
                      ? 'bg-green-100'
                      : isCurrent
                      ? 'bg-blue-100'
                      : 'bg-yellow-50';

                    return (
                      <td
                        key={`cell-${player.id}-q${quarter}s${swap}`}
                        className={`border border-gray-300 p-2 text-center ${bgColor}`}
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
        </div>
      </Card>
    </div>
  );
}
