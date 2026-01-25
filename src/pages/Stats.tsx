import React from 'react';
import { StatsDashboard } from '@/components/stats/StatsDashboard';
import { usePlayers } from '@/hooks/usePlayers';
import { Loading } from '@/components/common/Loading';

export function Stats() {
  const { players, loading } = usePlayers();

  if (loading) {
    return <Loading />;
  }

  return <StatsDashboard players={players} />;
}
