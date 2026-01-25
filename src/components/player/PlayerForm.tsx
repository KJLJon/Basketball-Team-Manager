import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface PlayerFormProps {
  initialName?: string;
  initialNumber?: string;
  onSubmit: (name: string, number: string) => void;
  onCancel: () => void;
}

export function PlayerForm({
  initialName = '',
  initialNumber = '',
  onSubmit,
  onCancel,
}: PlayerFormProps) {
  const [name, setName] = useState(initialName);
  const [number, setNumber] = useState(initialNumber);
  const [errors, setErrors] = useState<{ name?: string; number?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; number?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!number.trim()) {
      newErrors.number = 'Number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      try {
        onSubmit(name, number);
      } catch (error) {
        if (error instanceof Error) {
          setErrors({ number: error.message });
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Player Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Enter player name"
        autoFocus
      />

      <Input
        label="Jersey Number"
        type="text"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        error={errors.number}
        placeholder="Enter jersey number"
      />

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
