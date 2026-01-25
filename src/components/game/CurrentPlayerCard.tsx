import React, { useState, useRef, useEffect } from 'react';
import type { Player, PlayerStats } from '@/types';
import { StatButtonWithDropdown } from './StatButtonWithDropdown';

interface CurrentPlayerCardProps {
  player: Player;
  stats: PlayerStats;
  benchPlayers: Player[];
  onIncrementStat: (stat: string) => void;
  onSwapPlayer: (benchPlayerId: string) => void;
}

export function CurrentPlayerCard({
  player,
  stats,
  benchPlayers,
  onIncrementStat,
  onSwapPlayer,
}: CurrentPlayerCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleMade = (type: string) => {
    onIncrementStat(`attempts${type}`);
    onIncrementStat(`made${type}`);
  };

  const handleMiss = (type: string) => {
    onIncrementStat(`attempts${type}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {player.number}
          </div>
          <div>
            <div className="font-semibold text-sm">{player.name}</div>
            <div className="text-xs text-gray-500">
              Pts: {totalPoints} | Reb: {stats.rebounds} | Stl: {stats.steals}
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
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onIncrementStat('steals')}
          className="px-2 py-2 bg-yellow-100 text-yellow-900 rounded-lg font-medium text-sm hover:bg-yellow-200 active:scale-95 transition-all"
        >
          Steal
        </button>
        <button
          type="button"
          onClick={() => onIncrementStat('rebounds')}
          className="px-2 py-2 bg-purple-100 text-purple-900 rounded-lg font-medium text-sm hover:bg-purple-200 active:scale-95 transition-all"
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
            <h3 className="text-lg font-semibold mb-3">Swap {player.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a player from the bench to substitute in. Each player will get 2 minutes.
            </p>

            {benchPlayers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No bench players available</p>
            ) : (
              <div className="space-y-2">
                {benchPlayers.map((benchPlayer) => (
                  <button
                    key={benchPlayer.id}
                    type="button"
                    onClick={() => {
                      onSwapPlayer(benchPlayer.id);
                      setShowSwapDialog(false);
                    }}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {benchPlayer.number}
                      </div>
                      <div>
                        <div className="font-semibold">{benchPlayer.name}</div>
                        <div className="text-xs text-gray-500">#{benchPlayer.number}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSwapDialog(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
