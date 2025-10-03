import { useState, useCallback } from 'react';

export function useModalState() {
  const [map, setMap] = useState<Record<string, boolean>>({});

  const open = useCallback((name: string) => setMap(prev => ({ ...prev, [name]: true })), []);
  const close = useCallback((name: string) => setMap(prev => ({ ...prev, [name]: false })), []);
  const toggle = useCallback((name: string) => setMap(prev => ({ ...prev, [name]: !prev[name] })), []);
  const isOpen = useCallback((name: string) => !!map[name], [map]);
  const reset = useCallback(() => setMap({}), []);

  return { open, close, toggle, isOpen, reset, set: setMap };
}

