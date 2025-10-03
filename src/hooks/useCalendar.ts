import { useEffect, useRef, useState } from 'react';

export type UseCalendarOptions = {
  value?: string | null;
  onChange?: (date: string) => void;
  closeOnSelect?: boolean;
};

export function useCalendar(options: UseCalendarOptions = {}) {
  const { value, onChange, closeOnSelect = true } = options;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => new Date());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync month with external value
  useEffect(() => {
    if (!value) return;
    const [y, m] = value.split('-').map((x) => parseInt(x, 10));
    if (y && m) setMonth(new Date(y, m - 1, 1));
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const prevMonth = () => setMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const pickDate = (day: number | null) => {
    if (!day) return;
    const y = month.getFullYear();
    const m = month.getMonth() + 1;
    const v = `${y}-${pad2(m)}-${pad2(day)}`;
    onChange?.(v);
    if (closeOnSelect) setOpen(false);
  };

  // Calendar grid (weeks x days)
  const getCalendarGrid = () => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startDay = first.getDay();
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: Array<number | null> = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const rows: Array<Array<number | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  };

  return {
    open,
    setOpen,
    month,
    setMonth,
    prevMonth,
    nextMonth,
    pickDate,
    getCalendarGrid,
    containerRef,
  };
}

