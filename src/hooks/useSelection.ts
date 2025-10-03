import { useEffect, useMemo, useState } from 'react';

export type Id = string | number;

export function useSelection(allIds: Id[]) {
  const [selected, setSelected] = useState<Id[]>([]);

  // 교차 보정: 전체 목록이 바뀌면 선택 목록도 교집합으로 정리
  useEffect(() => {
    setSelected((prev) => {
      const next = prev.filter((id) => allIds.includes(id));
      // 동일한 내용이면 상태 갱신 생략하여 불필요한 리렌더/루프 방지
      if (next.length === prev.length && next.every((v, i) => v === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [allIds]);

  const allSelected = useMemo(
    () => allIds.length > 0 && selected.length === allIds.length,
    [allIds.length, selected.length]
  );

  const toggleOne = (id: Id, checked: boolean) => {
    setSelected((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? [...allIds] : []);
  };

  const clear = () => setSelected([]);

  return { selected, setSelected, allSelected, toggleOne, toggleAll, clear };
}
