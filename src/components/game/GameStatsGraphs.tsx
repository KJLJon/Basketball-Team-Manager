import React from 'react';
import type { Game, Player } from '@/types';
import { Card } from '../common/Card';
import { SimpleBarChart, PercentageBar } from '../stats/SimpleBarChart';
import { StatsService } from '@/services/stats';

interface GameStatsGraphsProps {
  game: Game;
  players: Player[];
}

export function GameStatsGraphs({ game, players }: GameStatsGraphsProps) {
  const attendingPlayers = players.filter(p => game.attendance.includes(p.id));

  // Get stats for all attending players
  const playerStats = attendingPlayers.map(player => {
    const stats = StatsService.getPlayerGameStats(game.id, player.id);
    const totalPoints = stats.made1pt + stats.made2pt * 2 + stats.made3pt * 3;
    return {
      player,
      stats,
      totalPoints
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  // Calculate team totals
  const teamTotals = playerStats.reduce(
    (acc, { stats }) => ({
      points: acc.points + stats.made1pt + stats.made2pt * 2 + stats.made3pt * 3,
      rebounds: acc.rebounds + stats.rebounds,
      steals: acc.steals + stats.steals,
      made1pt: acc.made1pt + stats.made1pt,
      attempts1pt: acc.attempts1pt + stats.attempts1pt,
      made2pt: acc.made2pt + stats.made2pt,
      attempts2pt: acc.attempts2pt + stats.attempts2pt,
      made3pt: acc.made3pt + stats.made3pt,
      attempts3pt: acc.attempts3pt + stats.attempts3pt,
    }),
    { points: 0, rebounds: 0, steals: 0, made1pt: 0, attempts1pt: 0, made2pt: 0, attempts2pt: 0, made3pt: 0, attempts3pt: 0 }
  );

  // Points by player chart data
  const pointsData = playerStats.slice(0, 10).map(({ player, totalPoints }) => ({
    label: player.name.split(' ')[0],
    value: totalPoints,
    color: 'bg-blue-500'
  }));

  // Rebounds by player chart data
  const reboundsData = playerStats
    .sort((a, b) => b.stats.rebounds - a.stats.rebounds)
    .slice(0, 10)
    .map(({ player, stats }) => ({
      label: player.name.split(' ')[0],
      value: stats.rebounds,
      color: 'bg-purple-500'
    }));

  // Steals by player chart data
  const stealsData = playerStats
    .sort((a, b) => b.stats.steals - a.stats.steals)
    .slice(0, 10)
    .map(({ player, stats }) => ({
      label: player.name.split(' ')[0],
      value: stats.steals,
      color: 'bg-yellow-500'
    }));

  // Play time by player
  const playTimeData = playerStats
    .sort((a, b) => b.stats.playTimeMinutes - a.stats.playTimeMinutes)
    .slice(0, 10)
    .map(({ player, stats }) => ({
      label: player.name.split(' ')[0],
      value: stats.playTimeMinutes,
      color: 'bg-green-500'
    }));

  return (
    <div className="space-y-4">
      {/* Team Summary */}
      <Card>
        <h3 className="font-semibold text-lg mb-3">Team Totals</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{teamTotals.points}</div>
            <div className="text-xs text-gray-600">Points</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{teamTotals.rebounds}</div>
            <div className="text-xs text-gray-600">Rebounds</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{teamTotals.steals}</div>
            <div className="text-xs text-gray-600">Steals</div>
          </div>
        </div>
      </Card>

      {/* Team Shooting */}
      <Card>
        <h3 className="font-semibold text-lg mb-3">Team Shooting</h3>
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

      {/* Points by Player */}
      {pointsData.length > 0 && (
        <Card>
          <SimpleBarChart
            title="Points by Player"
            data={pointsData}
          />
        </Card>
      )}

      {/* Play Time by Player */}
      {playTimeData.length > 0 && (
        <Card>
          <SimpleBarChart
            title="Play Time (minutes)"
            data={playTimeData}
          />
        </Card>
      )}

      {/* Rebounds by Player */}
      {reboundsData.some(d => d.value > 0) && (
        <Card>
          <SimpleBarChart
            title="Rebounds by Player"
            data={reboundsData}
          />
        </Card>
      )}

      {/* Steals by Player */}
      {stealsData.some(d => d.value > 0) && (
        <Card>
          <SimpleBarChart
            title="Steals by Player"
            data={stealsData}
          />
        </Card>
      )}
    </div>
  );
}
