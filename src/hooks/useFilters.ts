import { useState, useMemo } from 'react';

export function useFilters(initial?: { selectedClient?: string; selectedStatus?: string }) {
  const [selectedClient, setSelectedClient] = useState<string>(initial?.selectedClient || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(initial?.selectedStatus || '');

  const isActive = useMemo(() => Boolean(selectedClient || selectedStatus), [selectedClient, selectedStatus]);
  const reset = () => {
    setSelectedClient('');
    setSelectedStatus('');
  };

  const countLabel = (total: number, filtered: number) => (isActive ? `${filtered}개` : `총 ${total}개`);

  return {
    selectedClient,
    selectedStatus,
    setSelectedClient,
    setSelectedStatus,
    reset,
    isActive,
    countLabel,
  };
}

