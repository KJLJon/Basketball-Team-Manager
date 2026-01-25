import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface GameFormProps {
  onSubmit: (opponent: string, date: string, location: string) => void;
  onCancel: () => void;
}

export function GameForm({ onSubmit, onCancel }: GameFormProps) {
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<{
    opponent?: string;
    date?: string;
    location?: string;
  }>({});

  const validate = () => {
    const newErrors: { opponent?: string; date?: string; location?: string } = {};

    if (!opponent.trim()) {
      newErrors.opponent = 'Opponent name is required';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit(opponent, date, location);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Opponent"
        type="text"
        value={opponent}
        onChange={(e) => setOpponent(e.target.value)}
        error={errors.opponent}
        placeholder="Enter opponent team name"
        autoFocus
      />

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={errors.date}
      />

      <Input
        label="Location"
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        error={errors.location}
        placeholder="Enter game location"
      />

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Create Game
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
