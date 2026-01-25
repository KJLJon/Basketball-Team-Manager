import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player, PlayerSeasonStats } from '@/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatsService } from '@/services/stats';

interface StatsDashboardProps {
  players: Player[];
}

export function StatsDashboard({ players }: StatsDashboardProps) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<keyof PlayerSeasonStats>('normalizedPlayTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const allStats = StatsService.getAllPlayerSeasonStats();

  const sortedStats = [...allStats].sort((a, b) => {
    const aVal = a[sortBy] as number;
    const bVal = b[sortBy] as number;
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: keyof PlayerSeasonStats) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getPlayer = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  const getSortIcon = (field: keyof PlayerSeasonStats) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getPlayTimeColor = (stats: PlayerSeasonStats) => {
    if (stats.gamesAttended === 0) return 'text-gray-500';
    const avgPlayTime = allStats.reduce((sum, s) => sum + s.normalizedPlayTime, 0) / allStats.length;
    if (stats.normalizedPlayTime < avgPlayTime * 0.75) return 'text-red-600';
    if (stats.normalizedPlayTime < avgPlayTime * 0.9) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Statistics</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{players.length}</div>
          <div className="text-sm text-gray-600">Total Players</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {allStats.reduce((sum, s) => sum + s.gamesPlayed, 0)}
          </div>
          <div className="text-sm text-gray-600">Games Played</div>
        </Card>
      </div>

      {/* Sort Options */}
      <Card>
        <div className="text-sm font-semibold mb-2">Sort by:</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSort('normalizedPlayTime')}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
              sortBy === 'normalizedPlayTime' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            Play Time/Game {getSortIcon('normalizedPlayTime')}
          </button>
          <button
            onClick={() => handleSort('totalPoints')}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
              sortBy === 'totalPoints' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            Points {getSortIcon('totalPoints')}
          </button>
          <button
            onClick={() => handleSort('rebounds')}
            className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
              sortBy === 'rebounds' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            Rebounds {getSortIcon('rebounds')}
          </button>
        </div>
      </Card>

      {/* Players List */}
      <div className="space-y-3">
        {sortedStats.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No statistics yet. Play some games to see stats!
            </p>
          </Card>
        ) : (
          sortedStats.map(stats => {
            const player = getPlayer(stats.playerId);
            if (!player) return null;

            return (
              <Card
                key={stats.playerId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/stats/player/${player.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="player-badge">{player.number}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{player.name}</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Games: </span>
                        <span className="font-medium">{stats.gamesAttended}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Play Time: </span>
                        <span className={`font-medium ${getPlayTimeColor(stats)}`}>
                          {stats.normalizedPlayTime.toFixed(1)} min/game
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Points: </span>
                        <span className="font-medium">{stats.totalPoints}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rebounds: </span>
                        <span className="font-medium">{stats.rebounds}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Steals: </span>
                        <span className="font-medium">{stats.steals}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">FG%: </span>
                        <span className="font-medium">
                          {stats.fieldGoalPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
