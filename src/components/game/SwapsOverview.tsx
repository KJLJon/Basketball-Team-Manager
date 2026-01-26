import React, { useState } from 'react';
import type { Game, Player, Quarter, SwapNumber } from '@/types';
import { Card } from '../common/Card';
import { EditableStatRow } from './EditableStatRow';
import { StatsService } from '@/services/stats';

interface SwapsOverviewProps {
  game: Game;
  players: Player[];
  onRefresh: () => void;
}

export function SwapsOverview({ game, players, onRefresh }: SwapsOverviewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

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

  const selectedPlayerData = selectedPlayer ? players.find(p => p.id === selectedPlayer) : null;
  const selectedPlayerStats = selectedPlayer ? StatsService.getPlayerGameStats(game.id, selectedPlayer) : null;

  return (
    <div className="space-y-4 pb-24">
      <Card className="p-2 sm:p-4">
        <h3 className="font-semibold text-lg mb-2">Quarter & Swap Overview</h3>
        <p className="text-xs text-gray-600 mb-3">
          Tap a player to edit stats. Minutes shown per swap.
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
                </th>
              </tr>
            </thead>
            <tbody>
              {attendingPlayers.map((player) => {
                const isSelected = selectedPlayer === player.id;
                const totalMins = getTotalMinutes(player.id);

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
                      return (
                        <td
                          key={`${player.id}-q${quarter}-s${swap}`}
                          className={`border-r border-b border-gray-300 px-1 py-1.5 text-center ${
                            mins > 0 ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-300'
                          }`}
                          onClick={() => setSelectedPlayer(player.id)}
                        >
                          {mins > 0 ? `${mins}m` : '-'}
                        </td>
                      );
                    })}
                    {/* Total minutes cell */}
                    <td
                      className={`border-b border-gray-400 px-1 py-1.5 text-center font-bold ${
                        totalMins > 0 ? 'bg-blue-50 text-blue-800' : 'text-gray-400'
                      }`}
                      onClick={() => setSelectedPlayer(player.id)}
                    >
                      {totalMins > 0 ? `${totalMins}` : '0'}
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
