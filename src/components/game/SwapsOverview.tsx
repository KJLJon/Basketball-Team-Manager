import React, { useState } from 'react';
import type { Game, Player, Quarter, SwapNumber } from '@/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EditableStatRow } from './EditableStatRow';
import { StatsService } from '@/services/stats';

interface SwapsOverviewProps {
  game: Game;
  players: Player[];
  onRefresh: () => void;
}

export function SwapsOverview({ game, players, onRefresh }: SwapsOverviewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const getPlayerNumber = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.number : '?';
  };

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

  // Get all unique quarter/swap combinations from rotations
  const quarterSwaps: Array<{ quarter: Quarter; swap: SwapNumber }> = [];
  for (let q = 1; q <= 4; q++) {
    for (let s = 1; s <= 2; s++) {
      quarterSwaps.push({ quarter: q as Quarter, swap: s as SwapNumber });
    }
  }

  const selectedPlayerData = selectedPlayer ? players.find(p => p.id === selectedPlayer) : null;
  const selectedPlayerStats = selectedPlayer ? StatsService.getPlayerGameStats(game.id, selectedPlayer) : null;

  return (
    <div className="space-y-4 pb-24">
      <Card>
        <h3 className="font-semibold text-lg mb-2">Quarter & Swap Overview</h3>
        <p className="text-sm text-gray-600 mb-4">
          View all rotations for this game. Click on a player to see and edit their stats.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Quarter</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Swap</th>
                <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Players on Court</th>
              </tr>
            </thead>
            <tbody>
              {quarterSwaps.map(({ quarter, swap }) => {
                const rotations = game.rotations.filter(
                  r => r.quarter === quarter && r.swap === swap
                );

                // Get unique players from all rotations for this quarter/swap
                const playersOnCourt = new Set<string>();
                rotations.forEach(r => {
                  r.playersOnCourt.forEach(pid => playersOnCourt.add(pid));
                });

                const hasRotation = playersOnCourt.size > 0;

                return (
                  <tr key={`q${quarter}-s${swap}`} className={!hasRotation ? 'bg-gray-50' : ''}>
                    <td className="border border-gray-300 px-2 py-2 font-medium">Q{quarter}</td>
                    <td className="border border-gray-300 px-2 py-2 font-medium">Swap {swap}</td>
                    <td className="border border-gray-300 px-2 py-2">
                      {hasRotation ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(playersOnCourt).map(playerId => {
                            const player = players.find(p => p.id === playerId);
                            if (!player) return null;

                            const playTime = rotations
                              .filter(r => r.playersOnCourt.includes(playerId))
                              .reduce((sum, r) => sum + r.minutes, 0);

                            return (
                              <button
                                key={playerId}
                                onClick={() => setSelectedPlayer(playerId)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  selectedPlayer === playerId
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                              >
                                <span className="font-bold">#{player.number}</span>
                                <span>{player.name}</span>
                                <span className="text-xs opacity-75">({playTime}m)</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No rotation set</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedPlayer && selectedPlayerData && selectedPlayerStats && (() => {
        // Extract selectedPlayer to a const so TypeScript knows it's not null in callbacks
        const playerId = selectedPlayer;

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
                    {StatsService.calculatePlayTime(game.id, playerId)} minutes played
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
