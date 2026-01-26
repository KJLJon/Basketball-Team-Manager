import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Game, Player, Quarter, SwapNumber } from '@/types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { RotationSelector } from './RotationSelector';
import { RotationHistory } from './RotationHistory';
import { CurrentPlayerCard } from './CurrentPlayerCard';
import { EditableStatRow } from './EditableStatRow';
import { SwapsOverview } from './SwapsOverview';
import { GameService } from '@/services/game';
import { StatsService } from '@/services/stats';
import { RotationService } from '@/services/rotation';

interface GameDayProps {
  game: Game;
  players: Player[];
  onRefresh: () => void;
}

export function GameDay({ game, players, onRefresh }: GameDayProps) {
  const navigate = useNavigate();
  const isCompleted = game.status === 'completed';
  const [currentView, setCurrentView] = useState<'rotation' | 'current' | 'stats' | 'swaps'>(
    isCompleted ? 'stats' : 'rotation'
  );
  const [sortBy, setSortBy] = useState<'name' | 'number'>('name');

  const attendingPlayers = players.filter(p => game.attendance.includes(p.id));
  const currentRotation = game.rotations.find(
    r => r.quarter === game.currentQuarter && r.swap === game.currentSwap
  );
  const playersOnCourt = currentRotation?.playersOnCourt || [];

  const benchPlayers = attendingPlayers.filter(p => !playersOnCourt.includes(p.id));

  // Sort players
  const sortedCurrentPlayers = [...attendingPlayers.filter(p => playersOnCourt.includes(p.id))].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return a.number.localeCompare(b.number, undefined, { numeric: true });
  });

  const sortedAllPlayers = [...attendingPlayers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return a.number.localeCompare(b.number, undefined, { numeric: true });
  });

  const handleNextSwap = () => {
    if (!game.currentQuarter || !game.currentSwap) return;

    // Update play time for current rotation
    StatsService.updatePlayTimeForGame(game.id);

    const next = RotationService.getNextQuarterSwap(game.currentQuarter, game.currentSwap);

    if (!next) {
      // Game is over
      if (confirm('This is the final swap. End the game?')) {
        GameService.endGame(game.id);
        onRefresh();
        navigate('/schedule');
      }
      return;
    }

    GameService.setCurrentQuarterSwap(game.id, next.quarter as Quarter, next.swap as SwapNumber);
    onRefresh();
    setCurrentView('rotation');
  };

  const handleEndGame = () => {
    if (confirm('Are you sure you want to end this game?')) {
      StatsService.updatePlayTimeForGame(game.id);
      GameService.endGame(game.id);
      onRefresh();
      navigate('/schedule');
    }
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

  const handleSwapPlayer = (playerOutId: string, playerInId: string) => {
    if (!game.currentQuarter || !game.currentSwap) return;

    try {
      GameService.substitutePlayer(
        game.id,
        game.currentQuarter,
        game.currentSwap,
        playerOutId,
        playerInId,
        2 // 2 minutes each
      );
      StatsService.updatePlayTimeForGame(game.id);
      onRefresh();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const rotationNumber = game.currentQuarter && game.currentSwap
    ? RotationService.getRotationNumber(game.currentQuarter, game.currentSwap)
    : 0;

  return (
    <div className="pb-24">
      {/* Game Header */}
      <div className={`text-white p-4 space-y-2 ${isCompleted ? 'bg-gray-600' : 'bg-blue-600'}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">vs {game.opponent}</h2>
          {!isCompleted && (
            <Button size="sm" variant="danger" onClick={handleEndGame}>
              End Game
            </Button>
          )}
          {isCompleted && (
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              Completed
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div>
            {isCompleted ? (
              <div className="text-lg font-bold">Game Finished</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  Q{game.currentQuarter} - Swap {game.currentSwap}
                </div>
                <div className="text-sm">Rotation {rotationNumber}/8</div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm">Players Attended</div>
            <div className="text-2xl font-bold">{attendingPlayers.length}</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 font-medium text-sm ${
            currentView === 'rotation'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setCurrentView('rotation')}
        >
          {isCompleted ? 'Rotations' : 'Rotation'}
        </button>
        {!isCompleted && (
          <button
            className={`flex-1 py-3 font-medium text-sm ${
              currentView === 'current'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setCurrentView('current')}
          >
            Current
          </button>
        )}
        <button
          className={`flex-1 py-3 font-medium text-sm ${
            currentView === 'stats'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setCurrentView('stats')}
        >
          Stats
        </button>
        <button
          className={`flex-1 py-3 font-medium text-sm ${
            currentView === 'swaps'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setCurrentView('swaps')}
        >
          Swaps
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentView === 'rotation' && (
          <>
            {isCompleted ? (
              <RotationHistory
                game={game}
                players={attendingPlayers}
                onRefresh={onRefresh}
              />
            ) : (
              <RotationSelector
                game={game}
                players={attendingPlayers}
                onRefresh={onRefresh}
                onNextSwap={handleNextSwap}
              />
            )}
          </>
        )}

        {currentView === 'current' && (
          <>
            {!currentRotation ? (
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-yellow-800">No Active Rotation</h3>
                    <p className="text-sm text-yellow-700">
                      Go to the Rotation tab to set up players for this swap.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Players on Court</h3>
                  <button
                    type="button"
                    onClick={() => setSortBy(sortBy === 'name' ? 'number' : 'name')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sort by {sortBy === 'name' ? 'Number' : 'Name'}
                  </button>
                </div>

                <div className="space-y-2">
                  {sortedCurrentPlayers.map(player => {
                    const stats = StatsService.getPlayerGameStats(game.id, player.id);
                    return (
                      <CurrentPlayerCard
                        key={player.id}
                        player={player}
                        stats={stats}
                        benchPlayers={benchPlayers}
                        onIncrementStat={(stat) => handleIncrementStat(player.id, stat)}
                        onSwapPlayer={(benchPlayerId) => handleSwapPlayer(player.id, benchPlayerId)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {currentView === 'swaps' && (
          <SwapsOverview
            game={game}
            players={attendingPlayers}
            onRefresh={onRefresh}
          />
        )}

        {currentView === 'stats' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Players</h3>
              <button
                type="button"
                onClick={() => setSortBy(sortBy === 'name' ? 'number' : 'name')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Sort by {sortBy === 'name' ? 'Number' : 'Name'}
              </button>
            </div>

            <div className="space-y-3">
              {sortedAllPlayers.map(player => {
                const stats = StatsService.getPlayerGameStats(game.id, player.id);
                const totalPoints = stats.made1pt + stats.made2pt * 2 + stats.made3pt * 3;
                const isOnCourt = playersOnCourt.includes(player.id);

                return (
                  <Card key={player.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {player.number}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-xs text-gray-500">
                          {isOnCourt ? (
                            <span className="text-green-600 font-medium">● On Court</span>
                          ) : (
                            <span className="text-gray-500">Bench</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{totalPoints}</div>
                        <div className="text-xs text-gray-500">Points</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <EditableStatRow
                        label="Steals"
                        value={stats.steals}
                        onIncrement={() => handleIncrementStat(player.id, 'steals')}
                        onDecrement={() => handleDecrementStat(player.id, 'steals')}
                      />
                      <EditableStatRow
                        label="Rebounds"
                        value={stats.rebounds}
                        onIncrement={() => handleIncrementStat(player.id, 'rebounds')}
                        onDecrement={() => handleDecrementStat(player.id, 'rebounds')}
                      />
                      <EditableStatRow
                        label="Made 1pt"
                        value={stats.made1pt}
                        onIncrement={() => {
                          handleIncrementStat(player.id, 'made1pt');
                          handleIncrementStat(player.id, 'attempts1pt');
                        }}
                        onDecrement={() => {
                          handleDecrementStat(player.id, 'made1pt');
                          handleDecrementStat(player.id, 'attempts1pt');
                        }}
                      />
                      <EditableStatRow
                        label="Made 2pt"
                        value={stats.made2pt}
                        onIncrement={() => {
                          handleIncrementStat(player.id, 'made2pt');
                          handleIncrementStat(player.id, 'attempts2pt');
                        }}
                        onDecrement={() => {
                          handleDecrementStat(player.id, 'made2pt');
                          handleDecrementStat(player.id, 'attempts2pt');
                        }}
                      />
                      <EditableStatRow
                        label="Made 3pt"
                        value={stats.made3pt}
                        onIncrement={() => {
                          handleIncrementStat(player.id, 'made3pt');
                          handleIncrementStat(player.id, 'attempts3pt');
                        }}
                        onDecrement={() => {
                          handleDecrementStat(player.id, 'made3pt');
                          handleDecrementStat(player.id, 'attempts3pt');
                        }}
                      />
                      <EditableStatRow
                        label="Miss 1pt"
                        value={stats.attempts1pt - stats.made1pt}
                        onIncrement={() => handleIncrementStat(player.id, 'attempts1pt')}
                        onDecrement={() => handleDecrementStat(player.id, 'attempts1pt')}
                      />
                      <EditableStatRow
                        label="Miss 2pt"
                        value={stats.attempts2pt - stats.made2pt}
                        onIncrement={() => handleIncrementStat(player.id, 'attempts2pt')}
                        onDecrement={() => handleDecrementStat(player.id, 'attempts2pt')}
                      />
                      <EditableStatRow
                        label="Miss 3pt"
                        value={stats.attempts3pt - stats.made3pt}
                        onIncrement={() => handleIncrementStat(player.id, 'attempts3pt')}
                        onDecrement={() => handleDecrementStat(player.id, 'attempts3pt')}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
