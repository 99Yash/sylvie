'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '~/lib/trpc';

export function Demo() {
  const { data, isLoading, error } = useQuery(trpc.healthCheck.queryOptions());

  return (
    <div>
      <h1>Demo</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <p>Data: {data}</p>}
    </div>
  );
}
