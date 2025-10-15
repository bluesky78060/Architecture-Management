import { useRef } from 'react';
import type { Client, WorkItem } from '../../types/domain';
import { useCalendar } from '../../hooks/useCalendar';
import { useNumberFormat } from '../../hooks/useNumberFormat';
import { useClientWorkplaces } from '../../hooks/useClientWorkplaces';

type Props = {
  open: boolean;
  editingItem: WorkItem | null;
  newItem: WorkItem;
  clients: Client[];
  units: string[];
  categories: string[];
  statuses: string[];
  onChangeField: (name: string, value: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function ItemFormModal({ open, editingItem, newItem, clients, units, categories, statuses, onChangeField, onCancel, onSubmit }: Props) {
  const { getClientWorkplaces } = useClientWorkplaces();
  const { format } = useNumberFormat();
  const cal = useCalendar({ value: newItem?.date ?? '', onChange: (d) => onChangeField('date', d) });
  const calRef = useRef<HTMLDivElement>(null);

  if (open !== true) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto w-[980px] max-w-[95vw] shadow-2xl rounded-2xl bg-white/80 ring-1 ring-black/5">
        <div className="rounded-t-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white px-8 pt-8 pb-6 text-center">
          <h3 className="text-2xl font-extrabold tracking-tight text-indigo-600">{editingItem !== null ? '작업 항목 편집' : '새 작업 항목 추가'}</h3>
          <p className="mt-2 text-sm text-gray-500">새로운 건설 작업 항목을 등록하고 관리하세요</p>
        </div>
        <div className="px-6 pb-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center mb-3 gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">🏗️</span>
                <h4 className="text-base font-semibold text-gray-900">기본 정보</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">건축주</label>
                  <select name="clientId" value={String(newItem.clientId ?? '')} onChange={(e) => onChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
                    <option value="">건축주 선택</option>
                    {clients.map(c => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">작업장</label>
                  {(() => {
                    const hasClient = String(newItem.clientId ?? '') !== '';
                    return (
                      <select name="workplaceId" value={String(newItem.workplaceId ?? '')} onChange={(e) => onChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required disabled={!hasClient}>
                        <option value="">{hasClient ? '작업장 선택' : '작업장 선택(먼저 건축주를 선택하세요)'}</option>
                        {hasClient && getClientWorkplaces(newItem.clientId).map(wp => (<option key={wp.id} value={String(wp.id)}>{wp.name} - {wp.address}</option>))}
                      </select>
                    );
                  })()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">프로젝트명</label>
                  {(() => {
                    const selectedClient = clients.find(c => String(c.id) === String(newItem.clientId));
                    const projects: string[] = (selectedClient !== undefined && Array.isArray(selectedClient.projects)) ? selectedClient.projects : [];
                    const hasProjects = Array.isArray(projects) && projects.length > 0;

                    return hasProjects ? (
                      <select name="projectName" value={newItem.projectName ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
                        <option value="">프로젝트 선택</option>
                        {projects.map(proj => (<option key={proj} value={proj}>{proj}</option>))}
                      </select>
                    ) : (
                      <input type="text" name="projectName" value={newItem.projectName ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} placeholder="프로젝트명 입력" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">카테고리</label>
                  <select name="category" value={newItem.category ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required>
                    <option value="">카테고리 선택</option>
                    {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center mb-3 gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600">🛠️</span>
                <h4 className="text-base font-semibold text-gray-900">작업 정보</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">작업일자</label>
                <div className="mt-1 relative inline-block" ref={calRef}>
                  <div className="flex items-center gap-2">
                    <input type="text" name="date" value={newItem?.date ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} placeholder="YYYY-MM-DD" inputMode="numeric" className="block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400" onFocus={() => cal.setOpen(true)} required />
                    <button type="button" className="px-2 py-2 text-gray-600 hover:text-gray-800" onClick={() => cal.setOpen(v => !v)} title="달력 열기">📅</button>
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

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">내용</label>
                  <input type="text" name="name" value={newItem.name ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">세부 작업</label>
                  <input type="text" name="description" value={newItem.description ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">수량</label>
                  <input type="text" name="quantity" value={newItem.quantity ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} onFocus={(e) => e.target.select()} placeholder="예: 1" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">단위</label>
                  <select name="unit" value={newItem.unit ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">단위 선택</option>
                    {units.map(u => (<option key={u} value={u}>{u}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">단가</label>
                  <input type="text" name="defaultPrice" value={(() => {
                    const val = newItem.defaultPrice;
                    if (val === null || val === undefined) return '';
                    const num = Number(val);
                    return Number.isFinite(num) ? format(num) : String(val);
                  })()} onChange={(e) => onChangeField(e.target.name, e.target.value)} onFocus={(e) => e.target.select()} placeholder="예: 200,000" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">합계</label>
                  <div className="mt-1 w-full bg-green-50 border border-green-200 rounded px-3 py-2 text-sm font-semibold text-green-900">{
                    (() => {
                      const pRaw = newItem.defaultPrice;
                      const qRaw = newItem.quantity;
                      const pNum = Number(pRaw);
                      const qNum = Number(qRaw);
                      const p = Number.isFinite(pNum) ? pNum : 0;
                      const q = Number.isFinite(qNum) ? qNum : 1;
                      return `${format(p * q)}원`;
                    })()
                  }</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">인부 인원</label>
                  <input type="text" name="laborPersons" value={String(newItem.laborPersons ?? '')} onChange={(e) => onChangeField(e.target.name, e.target.value)} onFocus={(e) => e.target.select()} placeholder="예: 3" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">인부 단가</label>
                  <input type="text" name="laborUnitRate" value={typeof newItem.laborUnitRate === 'number' ? format(newItem.laborUnitRate) : ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} onFocus={(e) => e.target.select()} placeholder="예: 250,000" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">인부임 합계</label>
                  <div className="mt-1 w-full bg-indigo-50 border border-indigo-200 rounded px-3 py-2 text-sm font-semibold text-indigo-900">{
                    (() => {
                      const persons = Number(newItem.laborPersons ?? 0);
                      const rate = Number(newItem.laborUnitRate ?? 0);
                      const p = Number.isFinite(persons) ? persons : 0;
                      const r = Number.isFinite(rate) ? rate : 0;
                      return `${format(p * r)}원`;
                    })()
                  }</div>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">비고</label>
                <input type="text" name="notes" value={newItem.notes ?? ''} onChange={(e) => onChangeField(e.target.name, e.target.value)} placeholder="추가 메모나 특이사항을 입력하세요" className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                  <div className="flex flex-wrap gap-1.5">
                    {statuses.map((s) => {
                      const active = newItem.status === s;
                      const classes = active ? 'bg-indigo-600 text-white border-transparent shadow' : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200';
                      return (
                        <button key={s} type="button" onClick={() => onChangeField('status', s)} className={`px-3 py-1.5 rounded-full text-sm transition ${classes}`} aria-pressed={active}>{s}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">총합계 금액</label>
                  <div className="bg-blue-600 text-white rounded-lg px-4 py-2 text-base font-bold shadow-md">{
                    (() => {
                      const pRaw = newItem.defaultPrice;
                      const qRaw = newItem.quantity;
                      const pNum = Number(pRaw);
                      const qNum = Number(qRaw);
                      const p = Number.isFinite(pNum) ? pNum : 0;
                      const q = Number.isFinite(qNum) ? qNum : 1;
                      const laborPersons = Number(newItem.laborPersons ?? 0);
                      const laborRate = Number(newItem.laborUnitRate ?? 0);
                      const lp = Number.isFinite(laborPersons) ? laborPersons : 0;
                      const lr = Number.isFinite(laborRate) ? laborRate : 0;
                      const laborCost = lp * lr;
                      const total = (p * q) + laborCost;
                      return `${format(total)}원`;
                    })()
                  }</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">취소</button>
              <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow">{editingItem !== null ? '수정' : '추가'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
