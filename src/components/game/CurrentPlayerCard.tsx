import React, { useState, useRef, useEffect } from 'react';
import type { Player, PlayerStats } from '@/types';
import { StatButtonWithDropdown } from './StatButtonWithDropdown';
import { RotationService } from '@/services/rotation';
import { StatsService } from '@/services/stats';

interface CurrentPlayerCardProps {
  player: Player;
  stats: PlayerStats;
  benchPlayers: Player[];
  gameId: string;
  playersOnCourt: string[];
  onIncrementStat: (stat: string) => void;
  onSwapPlayer: (benchPlayerId: string) => void;
  onUpdate?: () => void; // Callback to refresh parent after swap
}

export function CurrentPlayerCard({
  player,
  stats,
  benchPlayers,
  gameId,
  playersOnCourt,
  onIncrementStat,
  onSwapPlayer,
  onUpdate,
}: CurrentPlayerCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [selectedSwapPlayer, setSelectedSwapPlayer] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get recommendations for the swap (excluding current players on court)
  const recommendations = RotationService.getRecommendations(
    gameId,
    Math.min(3, benchPlayers.length),
    playersOnCourt
  );

  // Get the recommended player (first recommendation that's on the bench)
  const recommendedPlayer = recommendations.length > 0
    ? benchPlayers.find(p => p.id === recommendations[0].playerId)
    : null;

  useEffect(() => {
    // Pre-select the recommended player when dialog opens
    if (showSwapDialog && recommendedPlayer && !selectedSwapPlayer) {
      setSelectedSwapPlayer(recommendedPlayer.id);
    }
  }, [showSwapDialog, recommendedPlayer, selectedSwapPlayer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const totalPoints = stats.made1pt + stats.made2pt * 2 + stats.made3pt * 3;
  const totalMisses = (stats.attempts1pt - stats.made1pt) +
                      (stats.attempts2pt - stats.made2pt) +
                      (stats.attempts3pt - stats.made3pt);

  const handleMade = (type: string) => {
    onIncrementStat(`attempts${type}`);
    onIncrementStat(`made${type}`);
  };

  const handleMiss = (type: string) => {
    onIncrementStat(`attempts${type}`);
  };

  const handleConfirmSwap = () => {
    if (selectedSwapPlayer) {
      onSwapPlayer(selectedSwapPlayer);
      setShowSwapDialog(false);
      setSelectedSwapPlayer(null);
      // Trigger parent refresh to show updated players on court
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  const handleCloseDialog = () => {
    setShowSwapDialog(false);
    setSelectedSwapPlayer(null);
  };

  // Get season stats for bench players to display
  const getBenchPlayerStats = (playerId: string) => {
    return StatsService.getPlayerSeasonStats(playerId);
  };

  // Sort bench players with recommendations first
  const sortedBenchPlayers = [...benchPlayers].sort((a, b) => {
    const aRecIndex = recommendations.findIndex(r => r.playerId === a.id);
    const bRecIndex = recommendations.findIndex(r => r.playerId === b.id);

    // Recommended players come first
    if (aRecIndex >= 0 && bRecIndex < 0) return -1;
    if (aRecIndex < 0 && bRecIndex >= 0) return 1;
    if (aRecIndex >= 0 && bRecIndex >= 0) return aRecIndex - bRecIndex;

    // Otherwise sort by number
    return parseInt(a.number) - parseInt(b.number);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-2 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
            {player.number}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-xs leading-tight">
              {player.name} <span className="text-[10px] text-gray-500 font-normal">Pts: {totalPoints} | Reb: {stats.rebounds} | Stl: {stats.steals} | Miss: {totalMisses}</span>
            </div>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]">
              <button
                type="button"
                onClick={() => {
                  setShowSwapDialog(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
              >
                Swap Player
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stat Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onIncrementStat('steals')}
          className="px-2 py-1.5 bg-yellow-100 text-yellow-900 rounded font-medium text-xs hover:bg-yellow-200 active:scale-95 transition-all"
        >
          Steal
        </button>
        <button
          type="button"
          onClick={() => onIncrementStat('rebounds')}
          className="px-2 py-1.5 bg-purple-100 text-purple-900 rounded font-medium text-xs hover:bg-purple-200 active:scale-95 transition-all"
        >
          Rebound
        </button>
        <StatButtonWithDropdown
          label="Made"
          defaultValue="2pt"
          options={[
            { label: '1 Point', value: '1pt' },
            { label: '2 Points', value: '2pt' },
            { label: '3 Points', value: '3pt' },
          ]}
          onSelect={handleMade}
          className="bg-green-600 text-white hover:bg-green-700"
        />
        <StatButtonWithDropdown
          label="Miss"
          defaultValue="2pt"
          options={[
            { label: '1 Point', value: '1pt' },
            { label: '2 Points', value: '2pt' },
            { label: '3 Points', value: '3pt' },
          ]}
          onSelect={handleMiss}
          className="bg-red-600 text-white hover:bg-red-700"
        />
      </div>

      {/* Swap Dialog */}
      {showSwapDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Swap {player.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a player from the bench. Each player gets 2 minutes for this swap.
            </p>

            {benchPlayers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No bench players available</p>
            ) : (
              <>
                {/* Recommendation banner */}
                {recommendedPlayer && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Recommended Substitute</span>
                    </div>
                    <div className="text-xs text-green-700">
                      #{recommendedPlayer.number} {recommendedPlayer.name} - {recommendations[0]?.reason || 'Needs more play time'}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {sortedBenchPlayers.map((benchPlayer) => {
                    const isRecommended = recommendations.some(r => r.playerId === benchPlayer.id);
                    const isSelected = selectedSwapPlayer === benchPlayer.id;
                    const playerSeasonStats = getBenchPlayerStats(benchPlayer.id);

                    return (
                      <button
                        key={benchPlayer.id}
                        type="button"
                        onClick={() => setSelectedSwapPlayer(benchPlayer.id)}
                        className={`w-full p-3 rounded-lg transition-all text-left border-2 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : isRecommended
                            ? 'border-green-300 bg-green-50 hover:bg-green-100'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                            {benchPlayer.number}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{benchPlayer.name}</span>
                              {isRecommended && (
                                <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {playerSeasonStats.normalizedPlayTime.toFixed(1)} min/game avg
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwap}
                disabled={!selectedSwapPlayer}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSwapPlayer
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
