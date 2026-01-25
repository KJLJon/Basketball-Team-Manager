import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Game, Player, Quarter, SwapNumber } from '@/types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { RotationSelector } from './RotationSelector';
import { StatTracker } from './StatTracker';
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
  const [currentView, setCurrentView] = useState<'rotation' | 'stats'>('rotation');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const attendingPlayers = players.filter(p => game.attendance.includes(p.id));
  const currentRotation = game.rotations.find(
    r => r.quarter === game.currentQuarter && r.swap === game.currentSwap
  );
  const playersOnCourt = currentRotation?.playersOnCourt || [];

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

  const rotationNumber = game.currentQuarter && game.currentSwap
    ? RotationService.getRotationNumber(game.currentQuarter, game.currentSwap)
    : 0;

  return (
    <div className="pb-24">
      {/* Game Header */}
      <div className="bg-blue-600 text-white p-4 space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">vs {game.opponent}</h2>
          <Button size="sm" variant="danger" onClick={handleEndGame}>
            End Game
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold">
              Q{game.currentQuarter} - Swap {game.currentSwap}
            </div>
            <div className="text-sm">Rotation {rotationNumber}/8</div>
          </div>
          <div className="text-right">
            <div className="text-sm">Players on Court</div>
            <div className="text-2xl font-bold">{playersOnCourt.length}/5</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 font-medium ${
            currentView === 'rotation'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setCurrentView('rotation')}
        >
          Rotation
        </button>
        <button
          className={`flex-1 py-3 font-medium ${
            currentView === 'stats'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => setCurrentView('stats')}
        >
          Stats
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentView === 'rotation' ? (
          <RotationSelector
            game={game}
            players={attendingPlayers}
            onRefresh={onRefresh}
            onNextSwap={handleNextSwap}
          />
        ) : (
          <StatTracker
            game={game}
            players={attendingPlayers}
            playersOnCourt={playersOnCourt}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
}
