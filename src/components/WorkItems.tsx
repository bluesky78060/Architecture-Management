import { useMemo, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNumberFormat } from '../hooks/useNumberFormat';
import { useSelection } from '../hooks/useSelection';
import { useClientWorkplaces } from '../hooks/useClientWorkplaces';
import StatsCards from './work-items/StatsCards';
import FilterBar from './work-items/FilterBar';
import WorkItemsTable from './work-items/WorkItemsTable';
import ItemFormModal from './work-items/ItemFormModal';
import BulkFormModal from './work-items/BulkFormModal';
import ConfirmDialog from './ConfirmDialog';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';
import type { WorkItem, WorkStatus } from '../types/domain';
import type { Id } from '../hooks/useSelection';

type NewItem = WorkItem;
type BulkItem = Partial<WorkItem> & { status?: string };

const STATUSES: WorkStatus[] = ['예정', '진행중', '완료', '보류'];

export default function WorkItems(): JSX.Element {
  const { clients, setClients, workItems, setWorkItems, invoices, setInvoices, units, categories } = useApp();
  const { format, parse } = useNumberFormat();
  const { getClientWorkplaces } = useClientWorkplaces();
  // const { getAllProjects } = useProjects();

  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<Id | null>(null);

  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [showBulkCustomProject, setShowBulkCustomProject] = useState<boolean>(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([
    {
      name: '',
      category: '',
      defaultPrice: 0,
      quantity: 1,
      unit: '',
      description: '',
      status: '예정',
      notes: '',
      laborPersons: '',
      laborUnitRate: '',
    }
  ]);
  const [bulkBaseInfo, setBulkBaseInfo] = useState<{
    clientId: string | number;
    workplaceId: string | number;
    projectName: string;
    date: string;
    bulkLaborPersons: string | number;
    bulkLaborUnitRate: string | number;
  }>({
    clientId: '',
    workplaceId: '',
    projectName: '',
    date: new Date().toISOString().split('T')[0],
    bulkLaborPersons: '',
    bulkLaborUnitRate: '',
  });
  const defaultNewItem: NewItem = {
    id: 0,
    clientId: '' as unknown as number,
    clientName: '',
    workplaceId: '' as unknown as number,
    workplaceName: '',
    projectName: '',
    name: '',
    category: '',
    defaultPrice: 0,
    quantity: 1,
    unit: '',
    description: '',
    status: '예정',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    laborPersons: '',
    laborUnitRate: '',
    laborPersonsGeneral: '',
    laborUnitRateGeneral: '',
  };
  const [newItem, setNewItem] = useState<NewItem>(defaultNewItem);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredWorkItems = useMemo(() => {
    return workItems.filter(item => {
      if (selectedClient && item.clientId !== parseInt(selectedClient)) return false;
      if (selectedProject && item.projectName !== selectedProject) return false;
      return true;
    });
  }, [workItems, selectedClient, selectedProject]);

  const visibleIds = useMemo<Id[]>(() => filteredWorkItems.map(i => i.id), [filteredWorkItems]);
  const selection = useSelection(visibleIds);

  const getLaborCost = (item: WorkItem): number => {
    const skilledPersons = parseInt(String(item?.laborPersons ?? 0), 10) || 0;
    const skilledRate = parseInt(String(item?.laborUnitRate ?? 0), 10) || 0;
    const generalPersons = parseInt(String(item?.laborPersonsGeneral ?? 0), 10) || 0;
    const generalRate = parseInt(String(item?.laborUnitRateGeneral ?? 0), 10) || 0;
    return (skilledPersons * skilledRate) + (generalPersons * generalRate);
  };

  const getClientProjects = (clientId?: number | string): string[] => {
    if (!clientId) return [];
    const cid = parseInt(String(clientId));
    const fromWorkItems = (workItems || [])
      .filter(item => item.clientId === cid)
      .map(item => item.projectName || '')
      .filter(Boolean) as string[];
    const client = clients.find(c => Number(c.id) === cid);
    const fromClientProjects = (client?.projects || []).filter(Boolean) as string[];
    const fromWorkplaces = (client?.workplaces || [])
      .map(wp => wp.description || '')
      .filter(Boolean) as string[];
    return Array.from(new Set([...fromWorkItems, ...fromClientProjects, ...fromWorkplaces]));
  };

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      '토목공사': 'bg-brown-100 text-brown-800',
      '구조공사': 'bg-gray-100 text-gray-800',
      '철거공사': 'bg-red-100 text-red-800',
      '마감공사': 'bg-blue-100 text-blue-800',
      '설비공사': 'bg-yellow-100 text-yellow-800',
      '내부공사': 'bg-green-100 text-green-800',
      '기타': 'bg-purple-100 text-purple-800',
    };
    return category ? (colors[category] || 'bg-gray-100 text-gray-800') : 'bg-gray-100 text-gray-800';
  };

  const handleEdit = (item: WorkItem) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setShowItemModal(true);
  };

  const handleDelete = (id: Id) => setPendingDeleteId(id);
  const confirmDeleteSingle = () => {
    if (pendingDeleteId == null) return;
    setWorkItems(prev => prev.filter(i => i.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const toInvoiceItem = (wi: WorkItem) => {
    const qty = (typeof wi.quantity === 'number' && wi.quantity > 0) ? wi.quantity : 1;
    const unitPrice = typeof wi.defaultPrice === 'number' ? wi.defaultPrice : 0;
    const lp = parseInt(String(wi.laborPersons || 0), 10) || 0;
    const lr = parseInt(String(wi.laborUnitRate || 0), 10) || 0;
    const lpg = parseInt(String(wi.laborPersonsGeneral || 0), 10) || 0;
    const lrg = parseInt(String(wi.laborUnitRateGeneral || 0), 10) || 0;
    const laborCost = (lp * lr) + (lpg * lrg);
    return {
      name: wi.name,
      quantity: qty,
      unit: wi.unit,
      unitPrice,
      total: (qty * unitPrice) + laborCost,
      notes: wi.notes || '',
      date: wi.date || '',
      // 상세/인부임 정보 보전
      category: wi.category || '',
      description: wi.description || '',
      laborPersons: wi.laborPersons ?? '',
      laborUnitRate: wi.laborUnitRate ?? '',
      laborPersonsGeneral: wi.laborPersonsGeneral ?? '',
      laborUnitRateGeneral: wi.laborUnitRateGeneral ?? '',
    };
  };

  const handleCreateInvoice = (workItem: WorkItem) => {
    const completedItems = workItems.filter(i => i.clientId === workItem.clientId && i.status === '완료');
    const unbilledItems = completedItems; // 간단 처리: 고유 검사 생략
    if (unbilledItems.length === 0) {
      alert('청구 가능한 완료된 작업 항목이 없습니다.');
      return;
    }
    const client = clients.find(c => Number(c.id) === workItem.clientId);
    const workplace = client?.workplaces?.find(w => w.id === workItem.workplaceId);
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const items = unbilledItems.map(toInvoiceItem);
    const totalAmount = items.reduce((s, it) => s + (it.total || 0), 0);
    const newInvoice = {
      id: newInvoiceId,
      client: workItem.clientName || '',
      project: workItem.projectName || '',
      workplaceAddress: workplace?.address || '',
      amount: totalAmount,
      status: '발송대기' as const,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      workItems: items,
    };
    setInvoices(prev => [...prev, newInvoice]);
    alert(`청구서 ${newInvoiceId}가 생성되었습니다.`);
  };

  const onChangeField = (name: string, value: string) => {
    let v: unknown = value;
    if (['defaultPrice', 'quantity', 'laborPersons', 'laborUnitRate', 'laborPersonsGeneral', 'laborUnitRateGeneral'].includes(name)) {
      const digits = String(value).replace(/[^\d-]/g, '');
      v = (digits === '' || digits === '-') ? '' : parse(digits);
    } else if (['clientId', 'workplaceId'].includes(name)) {
      v = parseInt(String(value)) || 0;
    }
    setNewItem(prev => ({ ...prev, [name]: v } as NewItem));
  };

  // Bulk Modal handlers
  const onBaseInfoChangeField = (name: string, value: string) => {
    let v: unknown = value;
    if (name === 'clientId' || name === 'workplaceId') {
      v = parseInt(String(value)) || '';
    } else if (name === 'bulkLaborPersons' || name === 'bulkLaborUnitRate') {
      const digits = String(value).replace(/[^\d-]/g, '');
      v = (digits === '' || digits === '-') ? '' : parse(digits);
    }

    setBulkBaseInfo(prev => {
      const next = { ...prev, [name]: v } as typeof prev;
      if (name === 'clientId') {
        next.workplaceId = '';
        setShowBulkCustomProject(false);
      }
      if (name === 'workplaceId') {
        const wp = getClientWorkplaces(next.clientId).find(w => w.id === Number(v));
        if (!next.projectName && wp?.description) next.projectName = wp.description;
      }
      if (name === 'projectName') {
        if (value === 'custom') {
          setShowBulkCustomProject(true);
          next.projectName = '';
        } else {
          setShowBulkCustomProject(false);
        }
      }
      return next;
    });
  };

  const onBulkItemChange = (index: number, field: string, value: string) => {
    setBulkItems(prev => {
      const updated = [...prev];
      let v: unknown = value;
      if (['defaultPrice', 'quantity', 'laborPersons', 'laborUnitRate'].includes(field)) {
        const digits = String(value).replace(/[^\d-]/g, '');
        v = (digits === '' || digits === '-') ? '' : parse(digits);
      }
      updated[index] = { ...(updated[index] || {}), [field]: v } as BulkItem;
      return updated;
    });
  };

  const onBulkAddItem = () => {
    setBulkItems(prev => ([
      ...prev,
      {
        name: '', category: '', defaultPrice: 0, quantity: 1, unit: '', description: '', status: '예정', notes: '', laborPersons: '', laborUnitRate: ''
      }
    ]));
  };
  const onBulkRemoveItem = (index: number) => {
    setBulkItems(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const onBulkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!bulkBaseInfo.clientId) errors.push('건축주를 선택하세요.');
    if (!bulkBaseInfo.workplaceId) errors.push('작업장을 선택하세요.');
    if (!bulkBaseInfo.projectName) errors.push('프로젝트명을 입력하세요.');
    bulkItems.forEach((it, idx) => {
      if (!it.name || String(it.name).trim() === '') errors.push(`항목 #${idx + 1}: 내용은 필수입니다.`);
    });
    if (errors.length > 0) { alert(errors.join('\n')); return; }

    const selectedClientData = clients.find(c => Number(c.id) === Number(bulkBaseInfo.clientId));
    const selectedWorkplace = getClientWorkplaces(bulkBaseInfo.clientId).find(wp => wp.id === Number(bulkBaseInfo.workplaceId));
    const currentMaxId = workItems.length ? Math.max(...workItems.map(i => Number(i.id) || 0)) : 0;

    const bulkLP: number | '' = typeof bulkBaseInfo.bulkLaborPersons === 'number'
      ? bulkBaseInfo.bulkLaborPersons
      : (String(bulkBaseInfo.bulkLaborPersons).trim() === '' ? '' : (parseInt(String(bulkBaseInfo.bulkLaborPersons), 10) || 0));
    const bulkLR: number | '' = typeof bulkBaseInfo.bulkLaborUnitRate === 'number'
      ? bulkBaseInfo.bulkLaborUnitRate
      : (String(bulkBaseInfo.bulkLaborUnitRate).trim() === '' ? '' : (parseInt(String(bulkBaseInfo.bulkLaborUnitRate), 10) || 0));

    const createdItems: WorkItem[] = bulkItems.map((item, idx) => ({
      id: currentMaxId + idx + 1,
      clientId: Number(bulkBaseInfo.clientId) as number,
      clientName: selectedClientData?.name || '',
      workplaceId: Number(bulkBaseInfo.workplaceId) as number,
      workplaceName: selectedWorkplace?.name || '',
      projectName: bulkBaseInfo.projectName,
      date: bulkBaseInfo.date || new Date().toISOString().split('T')[0],
      name: item.name || '',
      category: item.category || '',
      defaultPrice: (typeof item.defaultPrice === 'number' ? item.defaultPrice : 0),
      quantity: (typeof item.quantity === 'number' ? item.quantity : 1),
      unit: item.unit || '',
      description: item.description || '',
      status: (item.status as WorkStatus) || '예정',
      notes: item.notes || '',
      laborPersonsGeneral: bulkLP,
      laborUnitRateGeneral: bulkLR,
      laborPersons: item.laborPersons || '',
      laborUnitRate: item.laborUnitRate || '',
    }));

    setWorkItems(prev => [...prev, ...createdItems]);
    if (bulkBaseInfo.projectName) {
      setClients(prev => prev.map(c => Number(c.id) === Number(bulkBaseInfo.clientId)
        ? { ...c, projects: Array.from(new Set([...(c.projects || []), bulkBaseInfo.projectName])) }
        : c
      ));
    }

    setShowBulkModal(false);
    setShowBulkCustomProject(false);
    setBulkItems([{ name: '', category: '', defaultPrice: 0, quantity: 1, unit: '', description: '', status: '예정', notes: '', laborPersons: '', laborUnitRate: '' }]);
    setBulkBaseInfo({ clientId: '', workplaceId: '', projectName: '', date: new Date().toISOString().split('T')[0], bulkLaborPersons: '', bulkLaborUnitRate: '' });
    alert(`${createdItems.length}개의 작업 항목이 추가되었습니다.`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedClientData = clients.find(c => Number(c.id) === Number(newItem.clientId));
    const selectedWorkplace = getClientWorkplaces(newItem.clientId).find(wp => wp.id === newItem.workplaceId);
    if (editingItem) {
      const updated = {
        ...editingItem,
        ...newItem,
        clientName: selectedClientData?.name || editingItem.clientName,
        workplaceName: selectedWorkplace?.name || editingItem.workplaceName,
      } as WorkItem;
      setWorkItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
    } else {
      const nextId = (workItems.length ? Math.max(...workItems.map(i => Number(i.id) || 0)) : 0) + 1;
      const created: WorkItem = {
        ...newItem,
        id: nextId,
        clientName: selectedClientData?.name || '',
        workplaceName: selectedWorkplace?.name || '',
        date: newItem.date || new Date().toISOString().split('T')[0],
      } as WorkItem;
      setWorkItems(prev => [...prev, created]);
      if (newItem.projectName) {
        setClients(prev => prev.map(c => Number(c.id) === Number(newItem.clientId)
          ? { ...c, projects: Array.from(new Set([...(c.projects || []), newItem.projectName!])) }
          : c
        ));
      }
    }
    setShowItemModal(false);
    setEditingItem(null);
    setNewItem(defaultNewItem);
  };

  const handleBulkDelete = () => {
    if (selection.selected.length === 0) {
      alert('삭제할 항목을 선택하세요.');
      return;
    }
    setShowConfirmBulkDelete(true);
  };

  const confirmBulkDelete = () => {
    const count = selection.selected.length;
    setWorkItems(prev => prev.filter(i => !selection.selected.includes(i.id)));
    selection.clear();
    setShowConfirmBulkDelete(false);
    alert(`${count}개의 작업 항목이 삭제되었습니다.`);
  };

  const handleApplyBulkStatus = () => {
    if (!bulkStatus) { alert('변경할 상태를 선택하세요.'); return; }
    setWorkItems(prev => prev.map(item => selection.selected.includes(item.id) ? { ...item, status: bulkStatus as WorkStatus } : item));
    setBulkStatus('');
  };

  const handleCreateBulkInvoice = () => {
    if (selection.selected.length === 0) { alert('항목을 선택하세요.'); return; }
    const selectedItems = workItems.filter(i => selection.selected.includes(i.id) && i.status === '완료');
    if (selectedItems.length === 0) { alert('완료된 항목이 없습니다.'); return; }
    const first = selectedItems[0];
    const client = clients.find(c => Number(c.id) === first.clientId);
    const workplace = client?.workplaces?.find(w => w.id === first.workplaceId);
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const items = selectedItems.map(toInvoiceItem);
    const totalAmount = items.reduce((s, it) => s + (it.total || 0), 0);
    const newInvoice = {
      id: newInvoiceId,
      client: first.clientName || '',
      project: first.projectName || '',
      workplaceAddress: workplace?.address || '',
      amount: totalAmount,
      status: '발송대기' as const,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      workItems: items,
    };
    setInvoices(prev => [...prev, newInvoice]);
    selection.clear();
    alert(`청구서 ${newInvoiceId}가 생성되었습니다! (${selectedItems.length}개 항목)`);
  };

  const handleExport = () => exportToExcel.workItems(filteredWorkItems);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    try {
      const imported = await importFromExcel.workItems(file);
      setWorkItems(prev => {
        const currentMax = prev.length ? Math.max(...prev.map(i => Number(i.id) || 0)) : 0;
        const remapped = (imported || []).map((it: Partial<WorkItem>, idx: number) => ({
          id: currentMax + idx + 1,
          clientId: Number(it?.clientId || 0),
          clientName: it?.clientName,
          workplaceId: it?.workplaceId === '' || it?.workplaceId == null ? '' : Number(it?.workplaceId),
          workplaceName: it?.workplaceName,
          projectName: it?.projectName,
          name: String(it?.name || ''),
          category: it?.category,
          unit: it?.unit,
          quantity: typeof it?.quantity === 'number' ? it.quantity : 0,
          defaultPrice: typeof it?.defaultPrice === 'number' ? it.defaultPrice : 0,
          description: it?.description,
          notes: it?.notes,
          status: it?.status,
          date: it?.date,
          laborPersons: it?.laborPersons ?? '',
          laborUnitRate: it?.laborUnitRate ?? '',
          laborPersonsGeneral: it?.laborPersonsGeneral ?? '',
          laborUnitRateGeneral: it?.laborUnitRateGeneral ?? '',
        } as WorkItem));
        return [...prev, ...remapped];
      });
      alert(`${imported.length}개의 작업 항목을 가져왔습니다.`);
    } catch (err) {
      alert('Excel 파일을 가져오는 중 오류가 발생했습니다.');
    }
    (e.target as HTMLInputElement).value = '';
  };

  return (
    <div className="p-2 md:p-3">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">작업 항목 관리</h1>
            <p className="text-gray-600">작업 항목을 관리하고 진행을 확인하세요</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => createTemplate.workItems()} className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-700">
              <span className="text-gray-500 mr-2">📁</span>
              <span className="text-xs font-semibold">템플릿 다운로드</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-700">
              <span className="text-blue-500 mr-2">📤</span>
              <span className="text-xs font-semibold">Excel 가져오기</span>
            </button>
            <button onClick={handleExport} className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-700">
              <span className="text-green-500 mr-2">📥</span>
              <span className="text-xs font-semibold">Excel 내보내기</span>
            </button>
            <button onClick={() => setShowBulkModal(true)} className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-700">
              <span className="text-purple-500 mr-2">📋</span>
              <span className="text-xs font-semibold">일괄 작업 항목 추가</span>
            </button>
            <button onClick={() => setShowItemModal(true)} className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg">
              <span className="text-yellow-300 mr-2">✨</span>
              <span className="text-xs font-bold">새 작업 항목</span>
            </button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls" style={{ display: 'none' }} />
      </div>

      <StatsCards filteredWorkItems={filteredWorkItems} format={format} getLaborCost={getLaborCost} />

      <FilterBar
        clients={clients}
        selectedClient={selectedClient}
        selectedProject={selectedProject}
        filteredCount={filteredWorkItems.length}
        totalCount={workItems.length}
        selectionCount={selection.selected.length}
        bulkStatus={bulkStatus}
        statuses={STATUSES}
        getClientProjects={getClientProjects}
        onChangeClient={(val) => { setSelectedClient(val); setSelectedProject(''); }}
        onChangeProject={(val) => setSelectedProject(val)}
        onResetFilters={() => { setSelectedClient(''); setSelectedProject(''); }}
        onBulkStatusChange={(val) => setBulkStatus(val)}
        onApplyBulkStatus={handleApplyBulkStatus}
        onCreateBulkInvoice={handleCreateBulkInvoice}
        onBulkDelete={handleBulkDelete}
      />

      <WorkItemsTable
        items={filteredWorkItems}
        selection={selection}
        format={format}
        getLaborCost={getLaborCost}
        getCategoryColor={getCategoryColor}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateInvoice={handleCreateInvoice}
      />

      <ItemFormModal
        open={showItemModal}
        editingItem={editingItem}
        newItem={newItem}
        clients={clients}
        units={units}
        categories={categories}
        statuses={STATUSES}
        onChangeField={onChangeField}
        onCancel={() => { setShowItemModal(false); setEditingItem(null); setNewItem(defaultNewItem); }}
        onSubmit={handleSubmit}
        getLaborCost={getLaborCost}
      />

      <BulkFormModal
        open={showBulkModal}
        clients={clients}
        categories={categories}
        bulkItems={bulkItems}
        bulkBaseInfo={bulkBaseInfo}
        showBulkCustomProject={showBulkCustomProject}
        statuses={STATUSES}
        onBaseInfoChangeField={onBaseInfoChangeField}
        onItemChange={onBulkItemChange}
        onAddItem={onBulkAddItem}
        onRemoveItem={onBulkRemoveItem}
        onCancel={() => { setShowBulkModal(false); }}
        onSubmit={onBulkSubmit}
      />

      <ConfirmDialog
        open={showConfirmBulkDelete}
        title="선택 삭제"
        message={`선택된 ${selection.selected.length}개의 작업 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowConfirmBulkDelete(false)}
      />
      <ConfirmDialog
        open={pendingDeleteId != null}
        title="작업 항목 삭제"
        message={`이 작업 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDeleteSingle}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
