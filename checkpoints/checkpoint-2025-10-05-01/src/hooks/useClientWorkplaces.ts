import { useApp } from '../contexts/AppContext';
import type { Client, Workplace } from '../types/domain';

export function useClientWorkplaces() {
  const { clients } = useApp();

  const getClientWorkplaces = (clientId?: number | string): Workplace[] => {
    if (clientId == null || (typeof clientId === 'string' && clientId.trim() === '')) return [];
    const parsed = typeof clientId === 'string' ? parseInt(clientId, 10) : clientId;
    const id = Number.isFinite(parsed) ? parsed : null;
    if (id === null) return [];
    const client = (clients as Client[]).find(c => c.id === id);
    const workplaces: Workplace[] = (client !== undefined && Array.isArray(client.workplaces)) ? client.workplaces : [];
    return workplaces;
  };

  return { getClientWorkplaces };
}
