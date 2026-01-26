import React from 'react';
import type { Game, Player, Quarter, SwapNumber } from '@/types';
import { Card } from '../common/Card';
import { RotationService } from '@/services/rotation';

interface FullScheduleProps {
  game: Game;
  players: Player[];
}

export function FullSchedule({ game, players }: FullScheduleProps) {
  const attendingPlayers = players.filter(p => game.attendance.includes(p.id));

  // Get all quarter/swap combinations
  const quarterSwaps: Array<{ quarter: Quarter; swap: SwapNumber }> = [];
  for (let q = 1; q <= 4; q++) {
    for (let s = 1; s <= 2; s++) {
      quarterSwaps.push({ quarter: q as Quarter, swap: s as SwapNumber });
    }
  }

  // Generate recommendations for each swap
  const allRecommendations = quarterSwaps.map(({ quarter, swap }) => {
    // Set game to this quarter/swap temporarily for recommendations
    const tempGame = {
      ...game,
      currentQuarter: quarter,
      currentSwap: swap,
    };

    // Get recommendations based on current rotations
    const recommendations = RotationService.getRecommendations(
      tempGame.id,
      Math.min(5, attendingPlayers.length)
    );

    return {
      quarter,
      swap,
      recommendations: recommendations.slice(0, 5), // Top 5 players
    };
  });

  return (
    <div className="space-y-4 pb-24">
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-800">Full Game Schedule</h3>
            <p className="text-sm text-blue-700">
              Recommended rotations for all 8 swaps. This is based on fair play time distribution.
            </p>
          </div>
        </div>
      </Card>

      {quarterSwaps.map(({ quarter, swap }, index) => {
        const recommendations = allRecommendations[index].recommendations;
        const rotationNumber = (quarter - 1) * 2 + swap;

        return (
          <Card key={`q${quarter}-s${swap}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">
                  Quarter {quarter}, Swap {swap}
                </h3>
                <p className="text-xs text-gray-600">Rotation {rotationNumber}/8</p>
              </div>
              {game.currentQuarter === quarter && game.currentSwap === swap && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Current
                </span>
              )}
            </div>

            {recommendations.length > 0 ? (
              <div className="space-y-2">
                {recommendations.map((rec, idx) => {
                  const player = attendingPlayers.find(p => p.id === rec.playerId);
                  if (!player) return null;

                  return (
                    <div
                      key={rec.playerId}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                        {player.number}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs text-gray-500">
                          {rec.normalizedPlayTime.toFixed(1)} min/game avg
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">#{idx + 1}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recommendations available</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
