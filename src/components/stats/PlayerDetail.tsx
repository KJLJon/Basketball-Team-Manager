import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player, Game } from '@/types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatsService } from '@/services/stats';
import { formatDate } from '@/utils/date';
import { SimpleBarChart, PercentageBar } from './SimpleBarChart';

interface PlayerDetailProps {
  player: Player;
  games: Game[];
}

export function PlayerDetail({ player, games }: PlayerDetailProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<'details' | 'graphs'>('details');
  const seasonStats = StatsService.getPlayerSeasonStats(player.id);

  const playerGames = games.filter(g => g.attendance.includes(player.id));

  // Prepare game-by-game data for graphs
  const gameStats = playerGames.map(game => {
    const stats = StatsService.getPlayerGameStats(game.id, player.id);
    return {
      game,
      stats,
      points: stats.made1pt + stats.made2pt * 2 + stats.made3pt * 3
    };
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => navigate('/stats')}>
          ← Back
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="player-badge text-lg w-12 h-12">{player.number}</div>
          <div>
            <h2 className="text-2xl font-bold">{player.name}</h2>
            <p className="text-gray-600">#{player.number}</p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('details')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            view === 'details'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setView('graphs')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            view === 'graphs'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Graphs
        </button>
      </div>

      {view === 'graphs' ? (
        <>
          {/* Shooting Percentages */}
          <Card>
            <h3 className="text-lg font-semibold mb-3">Shooting Breakdown</h3>
            <div className="space-y-3">
              <PercentageBar
                label="Free Throws (1pt)"
                made={seasonStats.made1pt}
                attempts={seasonStats.attempts1pt}
                color="bg-blue-500"
              />
              <PercentageBar
                label="Field Goals (2pt)"
                made={seasonStats.made2pt}
                attempts={seasonStats.attempts2pt}
                color="bg-green-500"
              />
              <PercentageBar
                label="Three Pointers (3pt)"
                made={seasonStats.made3pt}
                attempts={seasonStats.attempts3pt}
                color="bg-purple-500"
              />
            </div>
          </Card>

          {/* Points per Game */}
          {gameStats.length > 0 && (
            <Card>
              <SimpleBarChart
                title="Points by Game"
                data={gameStats.slice(-8).map(({ game, points }) => ({
                  label: `vs ${game.opponent.substring(0, 5)}`,
                  value: points,
                  color: 'bg-blue-500'
                }))}
              />
            </Card>
          )}

          {/* Play Time per Game */}
          {gameStats.length > 0 && (
            <Card>
              <SimpleBarChart
                title="Play Time by Game (min)"
                data={gameStats.slice(-8).map(({ game, stats }) => ({
                  label: `vs ${game.opponent.substring(0, 5)}`,
                  value: stats.playTimeMinutes,
                  color: 'bg-green-500'
                }))}
              />
            </Card>
          )}

          {/* Rebounds per Game */}
          {gameStats.some(g => g.stats.rebounds > 0) && (
            <Card>
              <SimpleBarChart
                title="Rebounds by Game"
                data={gameStats.slice(-8).map(({ game, stats }) => ({
                  label: `vs ${game.opponent.substring(0, 5)}`,
                  value: stats.rebounds,
                  color: 'bg-purple-500'
                }))}
              />
            </Card>
          )}

          {/* Steals per Game */}
          {gameStats.some(g => g.stats.steals > 0) && (
            <Card>
              <SimpleBarChart
                title="Steals by Game"
                data={gameStats.slice(-8).map(({ game, stats }) => ({
                  label: `vs ${game.opponent.substring(0, 5)}`,
                  value: stats.steals,
                  color: 'bg-yellow-500'
                }))}
              />
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Season Summary */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">Season Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-blue-600">{seasonStats.gamesAttended}</div>
            <div className="text-sm text-gray-600">Games Attended</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{seasonStats.gamesPlayed}</div>
            <div className="text-sm text-gray-600">Games Played</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {seasonStats.playTimeMinutes} min
            </div>
            <div className="text-sm text-gray-600">Total Play Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {seasonStats.normalizedPlayTime.toFixed(1)} min
            </div>
            <div className="text-sm text-gray-600">Avg per Game</div>
          </div>
        </div>
      </Card>

      {/* Scoring Stats */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">Scoring</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Total Points</span>
              <span className="text-xl font-bold">{seasonStats.totalPoints}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Field Goal %</span>
              <span className="text-lg font-bold">{seasonStats.fieldGoalPercentage.toFixed(1)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-bold text-blue-600">
                {seasonStats.made1pt}/{seasonStats.attempts1pt}
              </div>
              <div className="text-xs text-gray-600">1-PT</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-bold text-green-600">
                {seasonStats.made2pt}/{seasonStats.attempts2pt}
              </div>
              <div className="text-xs text-gray-600">2-PT</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-bold text-purple-600">
                {seasonStats.made3pt}/{seasonStats.attempts3pt}
              </div>
              <div className="text-xs text-gray-600">3-PT</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Other Stats */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">Other Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{seasonStats.steals}</div>
            <div className="text-sm text-yellow-900">Steals</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">{seasonStats.rebounds}</div>
            <div className="text-sm text-purple-900">Rebounds</div>
          </div>
        </div>
      </Card>

      {/* Game-by-Game */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">Game History</h3>
        <p className="text-xs text-gray-500 mb-3">Tap a game to view full game stats</p>
        {playerGames.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No games yet</p>
        ) : (
          <div className="space-y-2">
            {playerGames.map(game => {
              const stats = StatsService.getPlayerGameStats(game.id, player.id);
              const points = stats.made1pt + stats.made2pt * 2 + stats.made3pt * 3;

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => navigate(`/game/${game.id}?tab=stats`)}
                  className="w-full text-left border-b last:border-b-0 pb-2 last:pb-0 hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-semibold">vs {game.opponent}</div>
                      <div className="text-xs text-gray-500">{formatDate(game.date)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          game.status === 'completed'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {game.status === 'completed' ? 'Completed' : 'In Progress'}
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-center">
                    <div>
                      <div className="font-bold">{stats.playTimeMinutes} min</div>
                      <div className="text-gray-500">Time</div>
                    </div>
                    <div>
                      <div className="font-bold">{points}</div>
                      <div className="text-gray-500">Pts</div>
                    </div>
                    <div>
                      <div className="font-bold">{stats.rebounds}</div>
                      <div className="text-gray-500">Reb</div>
                    </div>
                    <div>
                      <div className="font-bold">{stats.steals}</div>
                      <div className="text-gray-500">Stl</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
        </>
      )}
    </div>
  );
}
