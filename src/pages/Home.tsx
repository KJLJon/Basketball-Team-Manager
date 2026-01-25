import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { usePlayers } from '@/hooks/usePlayers';
import { useGames } from '@/hooks/useGames';
import { exportData } from '@/utils/export';

export function Home() {
  const { players } = usePlayers();
  const { games } = useGames();

  const upcomingGames = games.filter(g => g.status === 'scheduled').slice(0, 3);
  const inProgressGame = games.find(g => g.status === 'in-progress');

  const handleExport = () => {
    exportData();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome Coach!</h1>
        <p className="text-gray-600">Manage your team with ease</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/players">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-3xl font-bold text-blue-600">{players.length}</div>
            <div className="text-sm text-gray-600">Players</div>
          </Card>
        </Link>
        <Link to="/schedule">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-3xl font-bold text-green-600">{games.length}</div>
            <div className="text-sm text-gray-600">Games</div>
          </Card>
        </Link>
      </div>

      {/* Active Game */}
      {inProgressGame && (
        <Card className="bg-green-50 border-2 border-green-500">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-green-800">Game in Progress</h3>
            <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">LIVE</span>
          </div>
          <p className="text-lg font-bold mb-3">vs {inProgressGame.opponent}</p>
          <Link to={`/game/${inProgressGame.id}`}>
            <Button variant="success" className="w-full">
              Continue Game →
            </Button>
          </Link>
        </Card>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Upcoming Games</h3>
          <div className="space-y-2">
            {upcomingGames.map(game => (
              <Link
                key={game.id}
                to={`/game/${game.id}/setup`}
                className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="font-semibold">vs {game.opponent}</div>
                <div className="text-sm text-gray-600">{game.location}</div>
              </Link>
            ))}
          </div>
          <Link to="/schedule">
            <Button variant="secondary" className="w-full mt-3">
              View All Games
            </Button>
          </Link>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Link to="/players">
            <Button variant="secondary" className="w-full">
              Manage Players
            </Button>
          </Link>
          <Link to="/schedule">
            <Button variant="secondary" className="w-full">
              Schedule Game
            </Button>
          </Link>
          <Link to="/stats">
            <Button variant="secondary" className="w-full">
              View Statistics
            </Button>
          </Link>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <h3 className="font-semibold mb-3">Data Management</h3>
        <Button variant="secondary" onClick={handleExport} className="w-full">
          Export Data
        </Button>
      </Card>

      {/* Getting Started */}
      {players.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Getting Started</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Add your players to the team</li>
            <li>Schedule your first game</li>
            <li>Mark player attendance</li>
            <li>Start the game and manage rotations</li>
            <li>Track stats during the game</li>
          </ol>
          <Link to="/players">
            <Button className="w-full mt-3">
              Add Your First Player
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
