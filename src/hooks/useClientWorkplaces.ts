import { useApp } from '../contexts/AppContext';
import type { Client, Workplace } from '../types/domain';

export function useClientWorkplaces() {
  const { clients } = useApp();

  const getClientWorkplaces = (clientId?: number | string): Workplace[] => {
    if (!clientId) return [];
    const id = typeof clientId === 'string' ? parseInt(clientId) : clientId;
    const client = (clients as Client[]).find(c => c.id === id);
    return client?.workplaces || [];
  };

  return { getClientWorkplaces };
}

