import { useApp } from '../contexts/AppContext';
import type { WorkItem, Client } from '../types/domain';

export function useProjects() {
  const { workItems, clients } = useApp();

  const getClientProjects = (clientId?: number | string): string[] => {
    if (clientId == null || (typeof clientId === 'string' && clientId.trim() === '')) return [];
    const parsed = typeof clientId === 'string' ? parseInt(clientId, 10) : clientId;
    const cid = Number.isFinite(parsed) ? parsed : null;
    if (cid === null) return [];
    const fromWorkItems = (workItems as WorkItem[])
      .filter(item => item.clientId === cid)
      .map(item => item.projectName)
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '');
    const client = (clients as Client[]).find(c => c.id === cid);
    const clientProjects: string[] = (client !== undefined && Array.isArray(client.projects)) ? client.projects : [];
    const clientWorkplaces = (client !== undefined && Array.isArray(client.workplaces)) ? client.workplaces : [];
    const fromClientProjects = clientProjects
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '');
    const fromWorkplaces = clientWorkplaces
      .map(wp => wp.description)
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '');
    return Array.from(new Set([...fromWorkItems, ...fromClientProjects, ...fromWorkplaces]));
  };

  const getAllProjects = (): string[] => {
    const all = Array.from(new Set((workItems as WorkItem[])
      .map(i => i.projectName)
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '')));
    return all.sort();
  };

  return { getClientProjects, getAllProjects };
}
