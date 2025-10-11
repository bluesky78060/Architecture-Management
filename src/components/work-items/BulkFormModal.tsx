import { useRef } from 'react';
import type { Client, WorkItem } from '../../types/domain';
import { useCalendar } from '../../hooks/useCalendar';
import { useNumberFormat } from '../../hooks/useNumberFormat';
import { useClientWorkplaces } from '../../hooks/useClientWorkplaces';
import { useProjects } from '../../hooks/useProjects';

type BulkItem = Partial<WorkItem> & { status?: string };

type Props = {
  open: boolean;
  clients: Client[];
  categories: string[];
  units: string[];
  bulkItems: BulkItem[];
  bulkBaseInfo: { clientId: string | number; workplaceId: string | number; projectName: string; date?: string; bulkLaborPersons?: string | number; bulkLaborUnitRate?: string | number };
  showBulkCustomProject: boolean;
  statuses: string[];
  onBaseInfoChangeField: (name: string, value: string) => void;
  onItemChange: (index: number, field: string, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  getLaborCost: (item: WorkItem) => number;
};

export default function BulkFormModal({ open, clients, categories, units, bulkItems, bulkBaseInfo, showBulkCustomProject, statuses, onBaseInfoChangeField, onItemChange, onAddItem, onRemoveItem, onCancel, onSubmit, getLaborCost }: Props) {
  const { getClientWorkplaces } = useClientWorkplaces();
  const { getClientProjects } = useProjects();
  const { format } = useNumberFormat();
  const cal = useCalendar({ value: bulkBaseInfo?.date ?? '', onChange: (d) => onBaseInfoChangeField('date', d) });
  const calRef = useRef<HTMLDivElement>(null);

  if (open !== true) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-6 mx-auto w-[1100px] max-w-[96vw] shadow-2xl rounded-2xl bg-white/80 ring-1 ring-black/5">
        <div className="rounded-t-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white px-8 pt-8 pb-6 text-center">
          <h3 className="text-2xl font-extrabold tracking-tight text-indigo-600">일괄 작업 항목 추가</h3>
          <p className="mt-2 text-sm text-gray-500">여러 작업을 한 번에 등록합니다</p>
        </div>
        <div className="px-6 pb-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center mb-3 gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">📋</span>
                <h4 className="text-base font-semibold text-gray-900">공통 정보</h4>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">건축주</label>
                  <select name="clientId" value={String(bulkBaseInfo.clientId ?? '')} onChange={(e) => onBaseInfoChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
                    <option value="">건축주 선택</option>
                    {clients.map(client => (<option key={client.id} value={String(client.id)}>{client.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">작업장</label>
                  {(() => {
                    const hasClient = String(bulkBaseInfo.clientId ?? '') !== '';
                    return (
                      <select name="workplaceId" value={String(bulkBaseInfo.workplaceId ?? '')} onChange={(e) => onBaseInfoChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required disabled={!hasClient}>
                        <option value="">{hasClient ? '작업장 선택' : '작업장 선택(먼저 건축주를 선택하세요)'}</option>
                        {hasClient && getClientWorkplaces(bulkBaseInfo.clientId).map(workplace => (<option key={workplace.id} value={String(workplace.id)}>{workplace.name} - {workplace.address}</option>))}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">프로젝트명</label>
                  {showBulkCustomProject !== true ? (
                    (() => {
                      const hasClient = String(bulkBaseInfo.clientId ?? '') !== '';
                      return (
                        <select name="projectName" value={bulkBaseInfo.projectName} onChange={(e) => onBaseInfoChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required disabled={!hasClient}>
                          <option value="">프로젝트 선택</option>
                          {hasClient && getClientProjects(bulkBaseInfo.clientId).map(project => (<option key={project} value={project}>{project}</option>))}
                          <option value="custom">+ 새 프로젝트 입력</option>
                        </select>
                      );
                    })()
                  ) : (
                    <div className="flex space-x-2">
                      <input type="text" name="projectName" value={bulkBaseInfo.projectName} onChange={(e) => onBaseInfoChangeField(e.target.name, e.target.value)} placeholder="새 프로젝트명 입력" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                      <button type="button" onClick={() => onBaseInfoChangeField('projectName', '')} className="mt-1 px-2 py-2 text-gray-400 hover:text-gray-600" title="기존 프로젝트 선택으로 돌아가기">↩</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">작업일자</label>
                  <div className="mt-1 relative inline-block" ref={calRef}>
                    <div className="flex items-center gap-2">
                      <input type="text" name="date" value={bulkBaseInfo?.date ?? ''} onChange={(e) => onBaseInfoChangeField(e.target.name, e.target.value)} placeholder="YYYY-MM-DD" inputMode="numeric" className="block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400" onFocus={() => cal.setOpen(true)} required />
                      <button type="button" className="px-2 py-2 text-gray-600 hover:text-gray-800" onClick={() => cal.setOpen((v) => !v)} title="달력 열기">📅</button>
                    </div>
                    {cal.open && (
                      <div className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-2 p-3" style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                        <div className="flex items-center justify-between mb-2">
                          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={cal.prevMonth}>◀</button>
                          <div className="text-sm font-medium">{cal.month.getFullYear()}년 {cal.month.getMonth() + 1}월</div>
                          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={cal.nextMonth}>▶</button>
                        </div>
                        <table className="text-xs select-none">
                          <thead>
                            <tr className="text-left text-gray-600">{['일','월','화','수','목','금','토'].map((d, idx) => {
                              const SUN = 0; // eslint-disable-line no-magic-numbers
                              const SAT = 6; // eslint-disable-line no-magic-numbers
                              return (<th key={d} className={`px-2 py-1 ${idx === SUN ? 'text-red-600' : idx === SAT ? 'text-blue-600' : ''}`}>{d}</th>);
                            })}</tr>
                          </thead>
                          <tbody>{cal.getCalendarGrid().map((row, idx) => (
                            <tr key={idx} className="text-left">{row.map((d, i2) => {
                              const clickable = typeof d === 'number' && d !== 0 && !Number.isNaN(d);
                              const SUN = 0; // eslint-disable-line no-magic-numbers
                              const SAT = 6; // eslint-disable-line no-magic-numbers
                              const dayColor = i2 === SUN ? 'text-red-600' : i2 === SAT ? 'text-blue-600' : '';
                              return (
                                <td
                                  key={i2}
                                  className={`px-2 py-1 ${dayColor} ${clickable ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
                                  onClick={() => { if (clickable) cal.pickDate(d as number); }}
                                >
                                  {clickable ? d : ''}
                                </td>
                              );
                            })}</tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600">🗂️</span>
                  <h4 className="text-base font-semibold text-gray-900">작업 항목들</h4>
                </div>
                <button type="button" onClick={onAddItem} className="text-indigo-600 hover:text-indigo-800 text-sm">+ 항목 추가</button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bulkItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">작업 항목 #{index + 1}</span>
                      {bulkItems.length > 1 && (
                        <button type="button" onClick={() => onRemoveItem(index)} className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">내용</label>
                        <input type="text" value={item.name ?? ''} onChange={(e) => onItemChange(index, 'name', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">카테고리</label>
                        <select value={item.category ?? ''} onChange={(e) => onItemChange(index, 'category', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
                          <option value="">카테고리 선택</option>
                          {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">수량</label>
                        <input type="text" value={item.quantity ?? ''} onChange={(e) => onItemChange(index, 'quantity', e.target.value)} placeholder="예: 1" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">단위</label>
                        <select value={item.unit ?? ''} onChange={(e) => onItemChange(index, 'unit', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option value="">단위 선택</option>
                          {units.map(u => (<option key={u} value={u}>{u}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">단가</label>
                        <input type="text" value={(() => {
                          const val = item.defaultPrice;
                          if (val === null || val === undefined) return '';
                          const num = Number(val);
                          return Number.isFinite(num) ? format(num) : String(val);
                        })()} onChange={(e) => onItemChange(index, 'defaultPrice', e.target.value)} placeholder="예: 200,000" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">숙련 인부 인원</label>
                        <input type="text" value={item.laborPersons ?? ''} onChange={(e) => onItemChange(index, 'laborPersons', e.target.value)} placeholder="예: 1" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">숙련 인부 단가</label>
                        <input type="text" value={(() => {
                          const val = item.laborUnitRate;
                          if (val === null || val === undefined) return '';
                          const num = Number(val);
                          return Number.isFinite(num) ? format(num) : String(val);
                        })()} onChange={(e) => onItemChange(index, 'laborUnitRate', e.target.value)} placeholder="예: 300,000" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">일반 인부 인원</label>
                        <input type="text" value={item.laborPersonsGeneral ?? ''} onChange={(e) => onItemChange(index, 'laborPersonsGeneral', e.target.value)} placeholder="예: 2" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">일반 인부 단가</label>
                        <input type="text" value={(() => {
                          const val = item.laborUnitRateGeneral;
                          if (val === null || val === undefined) return '';
                          const num = Number(val);
                          return Number.isFinite(num) ? format(num) : String(val);
                        })()} onChange={(e) => onItemChange(index, 'laborUnitRateGeneral', e.target.value)} placeholder="예: 200,000" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">합계</label>
                        <div className="mt-1 w-full bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm">{
                          (() => {
                            const pRaw = item.defaultPrice;
                            const qRaw = item.quantity;
                            const pNum = Number(pRaw);
                            const qNum = Number(qRaw);
                            const p = Number.isFinite(pNum) ? pNum : 0;
                            const q = Number.isFinite(qNum) ? qNum : 1;
                            const laborCost = getLaborCost(item as WorkItem);
                            const total = (p * q) + laborCost;
                            return `${format(total)}원`;
                          })()
                        }</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">세부 작업</label>
                        <input type="text" value={item.description ?? ''} onChange={(e) => onItemChange(index, 'description', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">비고</label>
                        <input type="text" value={item.notes ?? ''} onChange={(e) => onItemChange(index, 'notes', e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                      <div className="flex flex-wrap gap-1.5">
                        {statuses.map((s) => {
                          const active = item.status === s;
                          const classes = active ? 'bg-indigo-600 text-white border-transparent shadow' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200';
                          return (
                            <button key={s} type="button" onClick={() => onItemChange(index, 'status', s)} className={`px-2.5 py-1 rounded-full text-xs transition ${classes}`} aria-pressed={active}>{s}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">취소</button>
              <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow">{bulkItems.length}개 항목 일괄 추가</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
