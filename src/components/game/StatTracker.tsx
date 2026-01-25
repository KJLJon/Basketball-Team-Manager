import React from 'react';
import type { Game, Player } from '@/types';
import { Card } from '../common/Card';
import { StatsService } from '@/services/stats';

interface StatTrackerProps {
  game: Game;
  players: Player[];
  playersOnCourt: string[];
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string | null) => void;
  onRefresh: () => void;
}

export function StatTracker({
  game,
  players,
  playersOnCourt,
  selectedPlayerId,
  onSelectPlayer,
  onRefresh,
}: StatTrackerProps) {
  const handleStatClick = (playerId: string, stat: string) => {
    StatsService.incrementStat(game.id, playerId, stat as any);
    onRefresh();
  };

  const getPlayerGameStats = (playerId: string) => {
    return StatsService.getPlayerGameStats(game.id, playerId);
  };

  const selectedPlayer = selectedPlayerId
    ? players.find(p => p.id === selectedPlayerId)
    : null;

  const selectedStats = selectedPlayerId
    ? getPlayerGameStats(selectedPlayerId)
    : null;

  return (
    <div className="space-y-4">
      {/* Player Selection */}
      <Card>
        <h3 className="font-semibold mb-3">Select Player</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Show players on court first */}
          {players
            .filter(p => playersOnCourt.includes(p.id))
            .map(player => (
              <button
                key={player.id}
                type="button"
                onClick={() => onSelectPlayer(player.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPlayerId === player.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="player-badge text-xs">{player.number}</div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">{player.name}</div>
                    <div className="text-xs text-green-700">On Court</div>
                  </div>
                </div>
              </button>
            ))}

          {/* Then show other attending players */}
          {players
            .filter(p => !playersOnCourt.includes(p.id))
            .map(player => (
              <button
                key={player.id}
                type="button"
                onClick={() => onSelectPlayer(player.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPlayerId === player.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="player-badge text-xs bg-gray-400">{player.number}</div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">{player.name}</div>
                    <div className="text-xs text-gray-500">Bench</div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </Card>

      {/* Stat Buttons */}
      {selectedPlayer && selectedStats && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {selectedPlayer.name} #{selectedPlayer.number}
            </h3>
            <button
              type="button"
              onClick={() => onSelectPlayer(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => handleStatClick(selectedPlayer.id, 'steals')}
              className="stat-button bg-yellow-50 border-yellow-300 active:bg-yellow-100"
            >
              <div className="text-2xl font-bold text-yellow-700">{selectedStats.steals}</div>
              <div className="text-sm font-medium text-yellow-900">Steals</div>
            </button>

            <button
              type="button"
              onClick={() => handleStatClick(selectedPlayer.id, 'rebounds')}
              className="stat-button bg-purple-50 border-purple-300 active:bg-purple-100"
            >
              <div className="text-2xl font-bold text-purple-700">{selectedStats.rebounds}</div>
              <div className="text-sm font-medium text-purple-900">Rebounds</div>
            </button>
          </div>

          {/* Shooting Stats */}
          <div className="space-y-3">
            {/* 1-Point */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold mb-2">1-Point Free Throws</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStatClick(selectedPlayer.id, 'attempts1pt')}
                  className="flex-1 py-3 bg-red-100 border-2 border-red-300 rounded active:bg-red-200"
                >
                  <div className="text-xs text-red-700">Miss</div>
                  <div className="font-bold text-red-900">
                    {selectedStats.attempts1pt - selectedStats.made1pt}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatClick(selectedPlayer.id, 'attempts1pt');
                    handleStatClick(selectedPlayer.id, 'made1pt');
                  }}
                  className="flex-1 py-3 bg-green-100 border-2 border-green-300 rounded active:bg-green-200"
                >
                  <div className="text-xs text-green-700">Made</div>
                  <div className="font-bold text-green-900">{selectedStats.made1pt}</div>
                </button>
              </div>
            </div>

            {/* 2-Point */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold mb-2">2-Point Field Goals</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStatClick(selectedPlayer.id, 'attempts2pt')}
                  className="flex-1 py-3 bg-red-100 border-2 border-red-300 rounded active:bg-red-200"
                >
                  <div className="text-xs text-red-700">Miss</div>
                  <div className="font-bold text-red-900">
                    {selectedStats.attempts2pt - selectedStats.made2pt}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatClick(selectedPlayer.id, 'attempts2pt');
                    handleStatClick(selectedPlayer.id, 'made2pt');
                  }}
                  className="flex-1 py-3 bg-green-100 border-2 border-green-300 rounded active:bg-green-200"
                >
                  <div className="text-xs text-green-700">Made</div>
                  <div className="font-bold text-green-900">{selectedStats.made2pt}</div>
                </button>
              </div>
            </div>

            {/* 3-Point */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold mb-2">3-Point Field Goals</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStatClick(selectedPlayer.id, 'attempts3pt')}
                  className="flex-1 py-3 bg-red-100 border-2 border-red-300 rounded active:bg-red-200"
                >
                  <div className="text-xs text-red-700">Miss</div>
                  <div className="font-bold text-red-900">
                    {selectedStats.attempts3pt - selectedStats.made3pt}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatClick(selectedPlayer.id, 'attempts3pt');
                    handleStatClick(selectedPlayer.id, 'made3pt');
                  }}
                  className="flex-1 py-3 bg-green-100 border-2 border-green-300 rounded active:bg-green-200"
                >
                  <div className="text-xs text-green-700">Made</div>
                  <div className="font-bold text-green-900">{selectedStats.made3pt}</div>
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-semibold text-blue-900 mb-2">Game Summary</div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="font-bold text-blue-700">
                  {selectedStats.made1pt + selectedStats.made2pt * 2 + selectedStats.made3pt * 3}
                </div>
                <div className="text-xs text-blue-600">Points</div>
              </div>
              <div>
                <div className="font-bold text-blue-700">{selectedStats.rebounds}</div>
                <div className="text-xs text-blue-600">Rebounds</div>
              </div>
              <div>
                <div className="font-bold text-blue-700">{selectedStats.steals}</div>
                <div className="text-xs text-blue-600">Steals</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!selectedPlayer && (
        <Card>
          <p className="text-center text-gray-500 py-8">
            Select a player above to track their stats
          </p>
        </Card>
      )}
    </div>
  );
}
