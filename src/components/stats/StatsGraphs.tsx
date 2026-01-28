import React from 'react';
import type { Player } from '@/types';
import { Card } from '../common/Card';
import { SimpleBarChart, PercentageBar } from './SimpleBarChart';
import { StatsService } from '@/services/stats';
import { GameService } from '@/services/game';

interface StatsGraphsProps {
  players: Player[];
}

export function StatsGraphs({ players }: StatsGraphsProps) {
  const allStats = StatsService.getAllPlayerSeasonStats();
  const games = GameService.getAllGames().filter(g => g.status !== 'scheduled');

  // Sort by various metrics for charts
  const byPoints = [...allStats].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);
  const byPlayTime = [...allStats].sort((a, b) => b.normalizedPlayTime - a.normalizedPlayTime).slice(0, 10);
  const byRebounds = [...allStats].sort((a, b) => b.rebounds - a.rebounds).slice(0, 10);
  const bySteals = [...allStats].sort((a, b) => b.steals - a.steals).slice(0, 10);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name.split(' ')[0] : 'Unknown';
  };

  // Team totals
  const teamTotals = allStats.reduce(
    (acc, stats) => ({
      points: acc.points + stats.totalPoints,
      rebounds: acc.rebounds + stats.rebounds,
      steals: acc.steals + stats.steals,
      made1pt: acc.made1pt + stats.made1pt,
      attempts1pt: acc.attempts1pt + stats.attempts1pt,
      made2pt: acc.made2pt + stats.made2pt,
      attempts2pt: acc.attempts2pt + stats.attempts2pt,
      made3pt: acc.made3pt + stats.made3pt,
      attempts3pt: acc.attempts3pt + stats.attempts3pt,
      playTime: acc.playTime + stats.playTimeMinutes,
    }),
    { points: 0, rebounds: 0, steals: 0, made1pt: 0, attempts1pt: 0, made2pt: 0, attempts2pt: 0, made3pt: 0, attempts3pt: 0, playTime: 0 }
  );

  // Points per game data
  const pointsPerGameData = games.map(game => {
    const gameStats = Object.keys(game.stats || {}).reduce((sum, playerId) => {
      const stats = StatsService.getPlayerGameStats(game.id, playerId);
      return sum + stats.made1pt + stats.made2pt * 2 + stats.made3pt * 3;
    }, 0);
    return {
      label: `vs ${game.opponent.substring(0, 6)}`,
      value: gameStats,
      color: 'bg-blue-500'
    };
  }).slice(-8); // Last 8 games

  return (
    <div className="space-y-4">
      {/* Season Totals */}
      <Card>
        <h3 className="font-semibold text-lg mb-3">Season Totals</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{teamTotals.points}</div>
            <div className="text-xs text-gray-600">Total Points</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{games.length}</div>
            <div className="text-xs text-gray-600">Games Played</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{teamTotals.rebounds}</div>
            <div className="text-xs text-gray-600">Total Rebounds</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{teamTotals.steals}</div>
            <div className="text-xs text-gray-600">Total Steals</div>
          </div>
        </div>
      </Card>

      {/* Team Shooting */}
      <Card>
        <h3 className="font-semibold text-lg mb-3">Season Shooting</h3>
        <div className="space-y-3">
          <PercentageBar
            label="Free Throws (1pt)"
            made={teamTotals.made1pt}
            attempts={teamTotals.attempts1pt}
            color="bg-blue-500"
          />
          <PercentageBar
            label="Field Goals (2pt)"
            made={teamTotals.made2pt}
            attempts={teamTotals.attempts2pt}
            color="bg-green-500"
          />
          <PercentageBar
            label="Three Pointers (3pt)"
            made={teamTotals.made3pt}
            attempts={teamTotals.attempts3pt}
            color="bg-purple-500"
          />
        </div>
      </Card>

      {/* Points per Game Trend */}
      {pointsPerGameData.length > 0 && (
        <Card>
          <SimpleBarChart
            title="Team Points by Game"
            data={pointsPerGameData}
          />
        </Card>
      )}

      {/* Points Leaders */}
      {byPoints.length > 0 && byPoints.some(s => s.totalPoints > 0) && (
        <Card>
          <SimpleBarChart
            title="Season Points Leaders"
            data={byPoints.map(stats => ({
              label: getPlayerName(stats.playerId),
              value: stats.totalPoints,
              color: 'bg-blue-500'
            }))}
          />
        </Card>
      )}

      {/* Average Play Time */}
      {byPlayTime.length > 0 && (
        <Card>
          <SimpleBarChart
            title="Avg Play Time per Game (min)"
            data={byPlayTime.map(stats => ({
              label: getPlayerName(stats.playerId),
              value: Math.round(stats.normalizedPlayTime * 10) / 10,
              color: 'bg-green-500'
            }))}
          />
        </Card>
      )}

      {/* Rebounds Leaders */}
      {byRebounds.length > 0 && byRebounds.some(s => s.rebounds > 0) && (
        <Card>
          <SimpleBarChart
            title="Season Rebounds Leaders"
            data={byRebounds.map(stats => ({
              label: getPlayerName(stats.playerId),
              value: stats.rebounds,
              color: 'bg-purple-500'
            }))}
          />
        </Card>
      )}

      {/* Steals Leaders */}
      {bySteals.length > 0 && bySteals.some(s => s.steals > 0) && (
        <Card>
          <SimpleBarChart
            title="Season Steals Leaders"
            data={bySteals.map(stats => ({
              label: getPlayerName(stats.playerId),
              value: stats.steals,
              color: 'bg-yellow-500'
            }))}
          />
        </Card>
      )}
    </div>
  );
}
