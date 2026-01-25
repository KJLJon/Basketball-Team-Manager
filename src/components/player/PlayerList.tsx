import React, { useState } from 'react';
import type { Player } from '@/types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { PlayerForm } from './PlayerForm';

interface PlayerListProps {
  players: Player[];
  onCreatePlayer: (name: string, number: string) => void;
  onUpdatePlayer: (id: string, name: string, number: string) => void;
  onDeletePlayer: (id: string) => void;
}

export function PlayerList({
  players,
  onCreatePlayer,
  onUpdatePlayer,
  onDeletePlayer,
}: PlayerListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = players.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.number.includes(searchQuery)
  );

  const handleCreate = (name: string, number: string) => {
    onCreatePlayer(name, number);
    setShowForm(false);
  };

  const handleUpdate = (name: string, number: string) => {
    if (editingPlayer) {
      onUpdatePlayer(editingPlayer.id, name, number);
      setEditingPlayer(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      onDeletePlayer(id);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Players</h2>
        <Button onClick={() => setShowForm(true)}>Add Player</Button>
      </div>

      <Input
        type="search"
        placeholder="Search by name or number..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Add New Player</h3>
          <PlayerForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {editingPlayer && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Edit Player</h3>
          <PlayerForm
            initialName={editingPlayer.name}
            initialNumber={editingPlayer.number}
            onSubmit={handleUpdate}
            onCancel={() => setEditingPlayer(null)}
          />
        </Card>
      )}

      <div className="space-y-3">
        {filteredPlayers.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">
              {searchQuery ? 'No players found' : 'No players yet. Add your first player!'}
            </p>
          </Card>
        ) : (
          filteredPlayers.map(player => (
            <Card key={player.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="player-badge">{player.number}</div>
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-gray-500">#{player.number}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingPlayer(player)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(player.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
