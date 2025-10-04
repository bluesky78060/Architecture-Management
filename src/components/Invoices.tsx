import { useMemo, useRef, useState } from 'react';
import StatsCards from './invoices/StatsCards';
import FilterBar from './invoices/FilterBar';
import InvoicesTable from './invoices/InvoicesTable';
import InvoiceDetailTable from './invoices/InvoiceDetailTable';
import ConfirmDialog from './ConfirmDialog';
import { useApp } from '../contexts/AppContext';
import { useNumberFormat } from '../hooks/useNumberFormat';
import { useFilters } from '../hooks/useFilters';
import { useSelection } from '../hooks/useSelection';
import type { Invoice, InvoiceStatus } from '../types/domain';
import { exportToExcel } from '../utils/excelUtils';

export default function Invoices(): JSX.Element {
  const { invoices, setInvoices, clients, companyInfo, stampImage, categories, units } = useApp();
  const { format } = useNumberFormat();
  const filters = useFilters();

  type FormItem = {
    name: string;
    quantity: number | '';
    unit?: string;
    unitPrice: number | '';
    total: number;
    notes?: string;
    date?: string;
    // 상세내역과 인부임 정보 추가
    category?: string;
    description?: string;
    laborPersons?: string | number;
    laborUnitRate?: string | number;
    laborPersonsGeneral?: string | number;
    laborUnitRateGeneral?: string | number;
  };
  type FormState = {
    clientId: string | number | '';
    client: string;
    workplaceId: string | number | '';
    workplaceAddress: string;
    project: string;
    date: string;
    status: Invoice['status'];
    items: FormItem[];
  };
  const [showForm, setShowForm] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    clientId: '',
    client: '',
    workplaceId: '',
    workplaceAddress: '',
    project: '',
    date: new Date().toISOString().split('T')[0],
    status: '발송대기',
    items: [{ name: '', quantity: 1, unit: '', unitPrice: 0, total: 0, category: '', description: '', laborPersons: '', laborUnitRate: '', laborPersonsGeneral: '', laborUnitRateGeneral: '' }],
  });

  const filteredInvoices = useMemo(() => {
    const base = (() => {
      if (!filters.selectedClient) return invoices;
      const cid = parseInt(filters.selectedClient);
      const clientName = clients.find(c => c.id === cid)?.name;
      return invoices.filter(inv => {
        if (inv.clientId && inv.clientId === cid) return true;
        if (clientName && inv.client === clientName) return true;
        return false;
      });
    })();
    if (!filters.selectedStatus) return base;
    return base.filter(inv => inv.status === filters.selectedStatus);
  }, [invoices, filters.selectedClient, filters.selectedStatus, clients]);

  const allVisibleIds = useMemo(() => filteredInvoices.map(inv => inv.id), [filteredInvoices]);
  const selection = useSelection(allVisibleIds);
  const allSelected = selection.allSelected;

  const handleToggleAll = (checked: boolean) => selection.toggleAll(checked);
  const handleToggleOne = (id: string, checked: boolean) => selection.toggleOne(id, checked);

  const handleChangeStatus = (id: string, next: string) => {
    const n = next as InvoiceStatus;
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: n } : inv));
  };

  const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDeleteSingle = () => {
    if (!pendingDeleteId) return;
    setInvoices(prev => prev.filter(inv => inv.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const handleBulkDelete = () => {
    if (selection.selected.length === 0) return;
    setShowConfirmBulkDelete(true);
  };

  const confirmBulkDelete = () => {
    setInvoices(prev => prev.filter(inv => !selection.selected.includes(inv.id)));
    selection.clear();
    setShowConfirmBulkDelete(false);
  };

  const [detail, setDetail] = useState<Invoice | null>(null);
  const handleOpenDetailPrint = () => {
    if (!detail) return;
    try {
      const payload = { invoice: detail, companyInfo };
      
      // localStorage에 데이터 저장
      try {
        localStorage.setItem('invoiceDetailPrintData', JSON.stringify(payload));
      } catch (e) {
      }
      
      // URL 구성
      const base = process.env.PUBLIC_URL || '';
      const baseUrl = base ? `${window.location.origin}${base}` : window.location.origin;
      const printUrl = `${baseUrl}/invoice-detail-output.html`;
      
      
      // 새 창 열기
      const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        alert(`팝업이 차단되었습니다.\n브라우저 설정에서 팝업을 허용하거나, 아래 URL을 새 탭에서 열어주세요:\n\n${printUrl}`);
        return;
      }
      
      setTimeout(() => {
        try {
          printWindow.focus();
        } catch (e) {
        }
      }, 500);
      
    } catch (error) {
      alert('상세 출력 창을 여는 중 오류가 발생했습니다.');
    }
  };
  const detailPrintRef = useRef<HTMLDivElement | null>(null);

  const handleViewDetails = (invoice: Invoice) => setDetail(invoice);
  const handleOpenPrint = (invoice: Invoice) => {
    try {
      // 템플릿에서 사용할 회사정보/도장/청구서 데이터를 함께 전달
      const payload = { invoice, companyInfo, stampImage };
      
      // localStorage에 데이터 저장
      try {
        localStorage.setItem('invoicePrintData', JSON.stringify(payload));
      } catch (e) {
      }
      
      // URL 구성 - 간단하게 수정
      const base = process.env.PUBLIC_URL || '';
      const baseUrl = base ? `${window.location.origin}${base}` : window.location.origin;
      const printUrl = `${baseUrl}/invoice-output.html`;
      
      
      // 새 창 열기
      const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        // 팝업이 차단된 경우
        alert(`팝업이 차단되었습니다.\n브라우저 설정에서 팝업을 허용하거나, 아래 URL을 새 탭에서 열어주세요:\n\n${printUrl}`);
        return;
      }
      
      // 창이 로드된 후 포커스
      setTimeout(() => {
        try {
          printWindow.focus();
        } catch (e) {
        }
      }, 500);
      
    } catch (error) {
      
      // 폴백: Excel 내보내기 제안
      const fallbackConfirm = window.confirm('출력 창을 여는 중 오류가 발생했습니다.\n대신 Excel 파일로 내보내시겠습니까?');
      if (fallbackConfirm) {
        exportToExcel.invoiceDetail(invoice);
      }
    }
  };

  const getClientWorkplaces = (clientId: string | number) => {
    const cid = parseInt(String(clientId));
    const c = clients.find(cl => Number(cl.id) === cid);
    return c?.workplaces || [];
  };

  const onFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value } as FormState;
      if (name === 'clientId') {
        const cid = parseInt(String(value));
        const c = clients.find(cl => Number(cl.id) === cid);
        next.client = c?.name || '';
        next.workplaceId = '';
        next.workplaceAddress = '';
        next.project = '';
      }
      if (name === 'workplaceId') {
        const wp = getClientWorkplaces(prev.clientId).find(w => Number(w.id) === parseInt(String(value)));
        next.workplaceAddress = wp?.address || '';
        if (!next.project && wp?.description) next.project = wp.description;
      }
      return next;
    });
  };

  const onFormItemChange = (index: number, field: keyof FormItem, value: string) => {
    setForm(prev => {
      const items = [...prev.items];
      if (field === 'quantity' || field === 'unitPrice' || field === 'laborPersons' || field === 'laborUnitRate' || field === 'laborPersonsGeneral' || field === 'laborUnitRateGeneral') {
        const digits = String(value ?? '').replace(/[^\d-]/g, '');
        const numeric = (digits === '' || digits === '-') ? '' : parseInt(digits, 10);
        if (field === 'quantity') items[index].quantity = numeric;
        if (field === 'unitPrice') items[index].unitPrice = numeric;
        if (field === 'laborPersons') items[index].laborPersons = numeric;
        if (field === 'laborUnitRate') items[index].laborUnitRate = numeric;
        if (field === 'laborPersonsGeneral') items[index].laborPersonsGeneral = numeric;
        if (field === 'laborUnitRateGeneral') items[index].laborUnitRateGeneral = numeric;
      } else if (field === 'name') {
        items[index].name = value;
      } else if (field === 'unit') {
        items[index].unit = value;
      } else if (field === 'notes') {
        items[index].notes = value;
      } else if (field === 'date') {
        items[index].date = value;
      } else if (field === 'category') {
        items[index].category = value;
      } else if (field === 'description') {
        items[index].description = value;
      }
      const q = Number(items[index].quantity) || 0;
      const p = Number(items[index].unitPrice) || 0;
      const lp = Number(items[index].laborPersons) || 0;
      const lr = Number(items[index].laborUnitRate) || 0;
      const lpg = Number(items[index].laborPersonsGeneral) || 0;
      const lrg = Number(items[index].laborUnitRateGeneral) || 0;
      const laborCost = (lp * lr) + (lpg * lrg);
      items[index].total = (q * p) + laborCost;
      return { ...prev, items };
    });
  };

  const addFormItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, unit: '', unitPrice: 0, total: 0, category: '', description: '', laborPersons: '', laborUnitRate: '', laborPersonsGeneral: '', laborUnitRateGeneral: '' }] }));
  const removeFormItem = (idx: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const getFormTotal = () => form.items.reduce((s, it) => s + (Number(it.total) || 0), 0);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.workplaceId || !form.project) {
      alert('건축주/작업장/프로젝트를 입력하세요.');
      return;
    }
    if (form.items.length === 0 || !form.items[0].name) {
      alert('작업 항목을 1개 이상 입력하세요.');
      return;
    }
    const newId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const created: Invoice = {
      id: newId,
      clientId: Number(form.clientId),
      client: form.client,
      project: form.project,
      workplaceAddress: form.workplaceAddress,
      amount: getFormTotal(),
      status: form.status,
      date: form.date,
      workItems: form.items.map(it => ({
        name: it.name,
        quantity: Number(it.quantity) || 0,
        unit: it.unit,
        unitPrice: Number(it.unitPrice) || 0,
        total: Number(it.total) || 0,
        notes: it.notes || '',
        date: it.date || '',
        // 상세내역과 인부임 정보 포함
        category: it.category || '',
        description: it.description || '',
        laborPersons: typeof it.laborPersons === 'number' ? it.laborPersons : (String(it.laborPersons).trim() === '' ? '' : Number(it.laborPersons) || ''),
        laborUnitRate: typeof it.laborUnitRate === 'number' ? it.laborUnitRate : (String(it.laborUnitRate).trim() === '' ? '' : Number(it.laborUnitRate) || ''),
        laborPersonsGeneral: typeof it.laborPersonsGeneral === 'number' ? it.laborPersonsGeneral : (String(it.laborPersonsGeneral).trim() === '' ? '' : Number(it.laborPersonsGeneral) || ''),
        laborUnitRateGeneral: typeof it.laborUnitRateGeneral === 'number' ? it.laborUnitRateGeneral : (String(it.laborUnitRateGeneral).trim() === '' ? '' : Number(it.laborUnitRateGeneral) || ''),
      })),
    };
    setInvoices(prev => [...prev, created]);
    setShowForm(false);
    setForm({
      clientId: '', client: '', workplaceId: '', workplaceAddress: '', project: '', date: new Date().toISOString().split('T')[0], status: '발송대기',
      items: [{ name: '', quantity: 1, unit: '', unitPrice: 0, total: 0, category: '', description: '', laborPersons: '', laborUnitRate: '', laborPersonsGeneral: '', laborUnitRateGeneral: '' }]
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">청구서 관리</h1>
        <div className="flex items-center gap-2">
          {selection.selected.length > 0 && (
            <button 
              onClick={handleBulkDelete} 
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-red-200 rounded-full shadow-sm hover:shadow-md hover:bg-red-50 transition-all duration-300 text-red-600 font-medium"
            >
              <span className="text-red-500 mr-2">🗑️</span>
              <span className="text-xs font-semibold">선택 삭제({selection.selected.length})</span>
            </button>
          )}
          <button 
            onClick={() => setShowForm(true)} 
            className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-300 font-bold"
          >
            <span className="text-yellow-300 mr-2">✨</span>
            <span className="text-xs font-bold">새 청구서</span>
          </button>
        </div>
      </div>

      <StatsCards invoices={invoices} />

      <FilterBar
        clients={clients}
        selectedClient={filters.selectedClient}
        selectedStatus={filters.selectedStatus}
        filteredCount={filteredInvoices.length}
        onChangeClient={(val) => filters.setSelectedClient(val)}
        onChangeStatus={(val) => filters.setSelectedStatus(val)}
        onReset={() => filters.reset()}
      />

      <InvoicesTable
        items={filteredInvoices}
        allSelected={allSelected}
        selectedIds={selection.selected}
        onToggleAll={handleToggleAll}
        onToggleOne={handleToggleOne}
        format={format}
        onChangeStatus={handleChangeStatus}
        onViewDetails={handleViewDetails}
        onOpenPrint={handleOpenPrint}
        onDelete={handleDelete}
      />

      {detail && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">청구서 상세</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleOpenDetailPrint} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm" title="상세 출력">🖨️ 상세 출력</button>
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            {/* 인쇄 대상 시작 */}
            <div ref={detailPrintRef}>
              {/* 인쇄 헤더: 번호/성명(건축주)만 출력 */}
              <div className="mb-3 text-sm">
                <p><strong>번호:</strong> {detail.id}</p>
                <p><strong>성명:</strong> {detail.client}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">작업 내역</h4>
                <InvoiceDetailTable items={detail.workItems || []} format={format} totalAmount={Number(detail.amount) || 0} />
              {/* 합계 영역: 템플릿 스타일 참고(소계/부가세/총액) */}
              <div className="mt-3 w-full flex justify-end">
                <div className="w-full max-w-sm space-y-1 bg-white p-3 rounded border">
                  {(() => {
                    const total = Number(detail.amount) || 0;
                    const subtotal = Math.round(total / 1.1);
                    const vat = total - subtotal;
                    return (
                      <>
                        <div className="flex justify-between text-sm"><span>소계</span><span>{format(subtotal)}원</span></div>
                        <div className="flex justify-between text-sm"><span>부가세(10%)</span><span>{format(vat)}원</span></div>
                        <div className="flex justify-between font-bold text-base"><span>총액</span><span>{format(total)}원</span></div>
                      </>
                    );
                  })()}
                </div>
              </div>
              </div>
            </div>
            {/* 인쇄 대상 끝 */}
            <div className="mt-4 text-right">
              <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-gray-600">닫기</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirmBulkDelete}
        title="선택 삭제"
        message={`선택된 ${selection.selected.length}개의 청구서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowConfirmBulkDelete(false)}
      />

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="청구서 삭제"
        message={`이 청구서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDeleteSingle}
        onCancel={() => setPendingDeleteId(null)}
      />

      {showForm && (
        <div className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto w-[980px] max-w-[95vw] shadow-2xl rounded-2xl bg-white/80 ring-1 ring-black/5">
            <div className="rounded-t-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white px-8 pt-8 pb-6 text-center">
              <h3 className="text-2xl font-extrabold tracking-tight text-indigo-600">새 청구서 생성</h3>
              <p className="mt-2 text-sm text-gray-500">청구 정보를 입력하고 항목을 추가하세요</p>
            </div>
            <div className="px-6 pb-6">
              <form onSubmit={submitForm} className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">건축주 *</label>
                      <select name="clientId" value={String(form.clientId)} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" required>
                        <option value="">건축주 선택</option>
                        {clients.map(c => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">프로젝트 *</label>
                      <input type="text" name="project" value={form.project} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">작업장 *</label>
                      <select name="workplaceId" value={String(form.workplaceId)} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" required disabled={!form.clientId}>
                        <option value="">{form.clientId ? '작업장 선택' : '먼저 건축주를 선택하세요'}</option>
                        {form.clientId && getClientWorkplaces(form.clientId).map(wp => (
                          <option key={wp.id} value={String(wp.id)}>{wp.name} - {wp.address}</option>
                        ))}
                      </select>
                      {form.workplaceAddress && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">작업장 주소: {form.workplaceAddress}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">발행일</label>
                      <input type="date" name="date" value={form.date} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold text-gray-900">작업 항목</h4>
                    <button type="button" onClick={addFormItem} className="text-indigo-600 hover:text-indigo-800 text-sm">+ 항목 추가</button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {form.items.map((it, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">내용</label>
                            <input type="text" value={it.name} onChange={(e) => onFormItemChange(idx, 'name', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                            <select value={it.category || ''} onChange={(e) => onFormItemChange(idx, 'category', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
                              <option value="">선택</option>
                              {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                            <input type="text" value={it.quantity === '' ? '' : String(it.quantity)} onChange={(e) => onFormItemChange(idx, 'quantity', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
                            <select value={it.unit || ''} onChange={(e) => onFormItemChange(idx, 'unit', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
                              <option value="">선택</option>
                              {units.map(unit => (<option key={unit} value={unit}>{unit}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단가</label>
                            <input type="text" value={it.unitPrice === '' ? '' : String(it.unitPrice)} onChange={(e) => onFormItemChange(idx, 'unitPrice', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상세 설명</label>
                            <textarea value={it.description || ''} onChange={(e) => onFormItemChange(idx, 'description', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm h-8 resize-none" placeholder="작업 상세 내용"></textarea>
                          </div>
                        </div>
                        {/* 인부임 섹션 */}
                        <div className="bg-blue-50 rounded p-2 mb-2">
                          <div className="text-xs font-medium text-blue-700 mb-1">인부임 정보</div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs text-blue-600 mb-1">숙련 인부수</label>
                              <input type="text" value={it.laborPersons === '' ? '' : String(it.laborPersons)} onChange={(e) => onFormItemChange(idx, 'laborPersons', e.target.value)} className="w-full border border-blue-200 rounded px-2 py-1 text-sm" placeholder="명" />
                            </div>
                            <div>
                              <label className="block text-xs text-blue-600 mb-1">숙련 단가</label>
                              <input type="text" value={it.laborUnitRate === '' ? '' : String(it.laborUnitRate)} onChange={(e) => onFormItemChange(idx, 'laborUnitRate', e.target.value)} className="w-full border border-blue-200 rounded px-2 py-1 text-sm" placeholder="원" />
                            </div>
                            <div>
                              <label className="block text-xs text-blue-600 mb-1">일반 인부수</label>
                              <input type="text" value={it.laborPersonsGeneral === '' ? '' : String(it.laborPersonsGeneral)} onChange={(e) => onFormItemChange(idx, 'laborPersonsGeneral', e.target.value)} className="w-full border border-blue-200 rounded px-2 py-1 text-sm" placeholder="명" />
                            </div>
                            <div>
                              <label className="block text-xs text-blue-600 mb-1">일반 단가</label>
                              <input type="text" value={it.laborUnitRateGeneral === '' ? '' : String(it.laborUnitRateGeneral)} onChange={(e) => onFormItemChange(idx, 'laborUnitRateGeneral', e.target.value)} className="w-full border border-blue-200 rounded px-2 py-1 text-sm" placeholder="원" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
                            <input type="text" value={it.notes || ''} onChange={(e) => onFormItemChange(idx, 'notes', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">날짜</label>
                            <input type="date" value={it.date || ''} onChange={(e) => onFormItemChange(idx, 'date', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">합계</label>
                            <div className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-sm">{format(it.total || 0)}원</div>
                          </div>
                        </div>
                        {form.items.length > 1 && (
                          <div className="mt-2 text-right">
                            <button type="button" onClick={() => removeFormItem(idx)} className="text-xs text-red-600 hover:text-red-800">항목 삭제</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">상태</label>
                      <select name="status" value={form.status} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2">
                        <option value="발송대기">발송대기</option>
                        <option value="발송됨">발송됨</option>
                        <option value="미결제">미결제</option>
                        <option value="결제완료">결제완료</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-sm text-gray-600">총 금액</div>
                      <div className="text-lg font-bold">{format(getFormTotal())}원</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">취소</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">저장</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
