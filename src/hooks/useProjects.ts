import { useApp } from '../contexts/AppContext';
import type { WorkItem, Client } from '../types/domain';

export function useProjects() {
  const { workItems, clients } = useApp();

  const getClientProjects = (clientId?: number | string): string[] => {
    if (!clientId) return [];
    const cid = typeof clientId === 'string' ? parseInt(clientId) : clientId;
    const fromWorkItems = (workItems as WorkItem[])
      .filter(item => item.clientId === cid)
      .map(item => item.projectName)
      .filter(Boolean) as string[];
    const client = (clients as Client[]).find(c => c.id === cid);
    const fromClientProjects = (client?.projects || []).filter(Boolean) as string[];
    const fromWorkplaces = (client?.workplaces || []).map(wp => wp.description).filter(Boolean) as string[];
    return Array.from(new Set([...fromWorkItems, ...fromClientProjects, ...fromWorkplaces]));
  };

  const getAllProjects = (): string[] => {
    const all = Array.from(new Set((workItems as WorkItem[]).map(i => i.projectName).filter(Boolean))) as string[];
    return all.sort();
  };

  return { getClientProjects, getAllProjects };
}

