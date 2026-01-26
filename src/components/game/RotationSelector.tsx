import React, { useState, useEffect } from 'react';
import type { Game, Player, Rotation, RotationAlgorithm } from '@/types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { GameService } from '@/services/game';
import { RotationService } from '@/services/rotation';
import { StatsService } from '@/services/stats';
import { StorageService } from '@/services/storage';

interface RotationSelectorProps {
  game: Game;
  players: Player[];
  onRefresh: () => void;
  onNextSwap: () => void;
  onRotationSaved?: () => void;
}

export function RotationSelector({ game, players, onRefresh, onNextSwap, onRotationSaved }: RotationSelectorProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [algorithm, setAlgorithm] = useState<RotationAlgorithm>(StorageService.getRotationAlgorithm());

  const toggleAlgorithm = () => {
    const newAlgorithm: RotationAlgorithm = algorithm === 'simple' ? 'weighted' : 'simple';
    setAlgorithm(newAlgorithm);
    StorageService.setRotationAlgorithm(newAlgorithm);
    // Force re-render of recommendations
    if (showRecommendations) {
      setShowRecommendations(false);
      setTimeout(() => setShowRecommendations(true), 0);
    }
  };

  const currentRotation = game.rotations.find(
    r => r.quarter === game.currentQuarter && r.swap === game.currentSwap
  );

  useEffect(() => {
    if (currentRotation) {
      setSelectedPlayers(currentRotation.playersOnCourt);
    } else {
      setSelectedPlayers([]);
      setShowRecommendations(true);
    }
  }, [currentRotation, game.currentQuarter, game.currentSwap]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else if (prev.length < 5) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  const handleSaveRotation = () => {
    if (selectedPlayers.length !== 5) {
      alert('Please select exactly 5 players for the rotation');
      return;
    }

    if (!game.currentQuarter || !game.currentSwap) {
      alert('Invalid game state');
      return;
    }

    const rotation: Rotation = {
      quarter: game.currentQuarter,
      swap: game.currentSwap,
      playersOnCourt: selectedPlayers,
      minutes: 4,
      startTime: Date.now(),
    };

    GameService.addRotation(game.id, rotation);
    onRefresh();
    onRotationSaved?.();
  };

  const handleApplyRecommendations = () => {
    const recommendations = RotationService.getRecommendations(game.id, 5);
    setSelectedPlayers(recommendations.map(r => r.playerId));
    setShowRecommendations(false);
  };

  const getPlayerStats = (playerId: string) => {
    return StatsService.getPlayerSeasonStats(playerId);
  };

  const recommendations = RotationService.getRecommendations(
    game.id,
    Math.min(5, players.length),
    selectedPlayers
  );

  return (
    <div className="space-y-4">
      {!currentRotation ? (
        <>
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-800">Set Rotation</h3>
                <p className="text-sm text-yellow-700">
                  Select 5 players for this rotation ({selectedPlayers.length}/5)
                </p>
              </div>
            </div>
          </Card>

          {/* Algorithm Toggle */}
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Algorithm:</span>
            <button
              onClick={toggleAlgorithm}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                algorithm === 'simple'
                  ? 'bg-blue-600 text-white'
                  : 'bg-purple-600 text-white'
              }`}
            >
              {algorithm === 'simple' ? 'Simple (Fair)' : 'Weighted (Advanced)'}
            </button>
          </div>

          {recommendations.length > 0 && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Recommended Players</h3>
                <Button size="sm" onClick={handleApplyRecommendations}>
                  Use All
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                {recommendations.map((rec, index) => (
                  <div key={rec.playerId} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <span className="font-bold text-green-600">#{index + 1}</span>
                    <span className="font-medium">{rec.playerName} (#{rec.playerNumber})</span>
                    <span className="text-gray-600 text-xs ml-auto">
                      {rec.normalizedPlayTime.toFixed(1)} min/game
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-green-800">Rotation Set</h3>
              <p className="text-sm text-green-700">
                Current rotation is active. Track stats or move to next swap.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Player Selection */}
      <div className="space-y-2">
        {players.map(player => {
          const isSelected = selectedPlayers.includes(player.id);
          const stats = getPlayerStats(player.id);

          return (
            <button
              key={player.id}
              type="button"
              onClick={() => !currentRotation && togglePlayer(player.id)}
              disabled={!!currentRotation}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${currentRotation ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="player-badge">{player.number}</div>
                <div className="flex-1">
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-xs text-gray-500">
                    {stats.playTimeMinutes} min ({stats.normalizedPlayTime.toFixed(1)} avg)
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-20 left-0 right-0 p-4 pb-6 bg-white border-t space-y-3">
        {!currentRotation ? (
          <Button
            onClick={handleSaveRotation}
            variant="success"
            size="lg"
            className="w-full"
            disabled={selectedPlayers.length !== 5}
          >
            Start Rotation ({selectedPlayers.length}/5)
          </Button>
        ) : (
          <Button onClick={onNextSwap} variant="success" size="lg" className="w-full">
            Next Swap →
          </Button>
        )}
      </div>
    </div>
  );
}
