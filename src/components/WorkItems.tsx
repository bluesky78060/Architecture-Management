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
import type { WorkItem, WorkStatus, Client } from '../types/domain';
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
      defaultPrice: '' as unknown as number,
      quantity: '' as unknown as number,
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
    defaultPrice: '' as unknown as number,
    quantity: '' as unknown as number,
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
      if (selectedClient !== '' && item.clientId !== parseInt(selectedClient)) return false;
      if (selectedProject !== '' && item.projectName !== selectedProject) return false;
      return true;
    });
  }, [workItems, selectedClient, selectedProject]);

  const visibleIds = useMemo<Id[]>(() => filteredWorkItems.map(i => i.id), [filteredWorkItems]);
  const selection = useSelection(visibleIds);

  const getLaborCost = (item: WorkItem): number => {
    const skilledPersons = parseInt(String(item?.laborPersons ?? 0), 10);
    const skilledRate = parseInt(String(item?.laborUnitRate ?? 0), 10);
    const generalPersons = parseInt(String(item?.laborPersonsGeneral ?? 0), 10);
    const generalRate = parseInt(String(item?.laborUnitRateGeneral ?? 0), 10);
    const skilledCost = (Number.isFinite(skilledPersons) && skilledPersons !== 0) ? skilledPersons * skilledRate : 0;
    const generalCost = (Number.isFinite(generalPersons) && generalPersons !== 0) ? generalPersons * generalRate : 0;
    return skilledCost + generalCost;
  };

  const getClientProjects = (clientId?: number | string): string[] => {
    if (clientId === undefined || clientId === null || clientId === '') return [];
    const cid = parseInt(String(clientId));
    const fromWorkItems = workItems
      .filter(item => item.clientId === cid)
      .map(item => item.projectName ?? '')
      .filter((name): name is string => name !== '');
    const client = clients.find(c => Number(c.id) === cid);
    const fromClientProjects = (client?.projects ?? []).filter((p): p is string => p !== '' && p !== null && p !== undefined);
    const fromWorkplaces = (client?.workplaces ?? [])
      .map(wp => wp.description ?? '')
      .filter((desc): desc is string => desc !== '');
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
    if (category !== undefined && category !== null && category !== '') {
      return colors[category] ?? 'bg-gray-100 text-gray-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const handleEdit = (item: WorkItem) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setShowItemModal(true);
  };

  const handleDelete = (id: Id) => setPendingDeleteId(id);
  const confirmDeleteSingle = async () => {
    if (pendingDeleteId == null) return;

    // UI에서 즉시 제거
    setWorkItems(prev => prev.filter(i => i.id !== pendingDeleteId));
    setPendingDeleteId(null);

    // Supabase에서도 즉시 삭제
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) return;
      const { error } = await supabase
        .from('work_items')
        .delete()
        .eq('work_item_id', pendingDeleteId);

      if (error !== null && error !== undefined) {
        // 오류 발생
      }
    } catch (err) {
      // 실패
    }
  };

  const toInvoiceItem = (wi: WorkItem) => {
    const DEFAULT_QUANTITY = 1;
    const qty = (typeof wi.quantity === 'number' && wi.quantity > 0) ? wi.quantity : DEFAULT_QUANTITY;
    const unitPrice = typeof wi.defaultPrice === 'number' ? wi.defaultPrice : 0;

    // 통합 인부임 계산 (laborPersons * laborUnitRate)
    const persons = parseInt(String(wi.laborPersons ?? 0), 10);
    const rate = parseInt(String(wi.laborUnitRate ?? 0), 10);
    const personsNum = Number.isFinite(persons) && !isNaN(persons) ? persons : 0;
    const rateNum = Number.isFinite(rate) && !isNaN(rate) ? rate : 0;
    const laborCost = personsNum * rateNum;

    // 레거시 필드도 읽어서 포함 (기존 데이터 호환성)
    const lpg = parseInt(String(wi.laborPersonsGeneral ?? 0), 10);
    const lrg = parseInt(String(wi.laborUnitRateGeneral ?? 0), 10);
    const lpgNum = Number.isFinite(lpg) && !isNaN(lpg) ? lpg : 0;
    const lrgNum = Number.isFinite(lrg) && !isNaN(lrg) ? lrg : 0;
    const legacyLaborCost = lpgNum * lrgNum;

    const totalLaborCost = laborCost + legacyLaborCost;

    return {
      name: wi.name,
      quantity: qty,
      unit: wi.unit,
      unitPrice,
      total: (qty * unitPrice) + totalLaborCost,
      notes: wi.notes ?? '',
      date: wi.date ?? '',
      // 상세/인부임 정보 보전
      category: wi.category ?? '',
      description: wi.description ?? '',
      laborPersons: wi.laborPersons ?? '',
      laborUnitRate: wi.laborUnitRate ?? '',
      laborPersonsGeneral: wi.laborPersonsGeneral ?? '',
      laborUnitRateGeneral: wi.laborUnitRateGeneral ?? '',
    };
  };

  const handleCreateInvoice = async (workItem: WorkItem) => {
    const INVOICE_ID_PADDING = 3;
    const DAYS_UNTIL_DUE = 14;
    const HOURS_PER_DAY = 24;
    const MINUTES_PER_HOUR = 60;
    const SECONDS_PER_MINUTE = 60;
    const MS_PER_SECOND = 1000;

    // clientId 유효성 검증
    if (workItem.clientId === null || workItem.clientId === undefined || workItem.clientId === 0) {
      alert('유효한 건축주 정보가 없습니다. 작업 항목에 건축주를 먼저 설정해주세요.');
      return;
    }

    const completedItems = workItems.filter(i =>
      i.clientId === workItem.clientId &&
      Number(i.workplaceId) === Number(workItem.workplaceId) &&
      i.projectName === workItem.projectName &&
      i.status === '완료'
    );
    const unbilledItems = completedItems;
    if (unbilledItems.length === 0) {
      alert('청구 가능한 완료된 작업 항목이 없습니다.');
      return;
    }
    const client = clients.find(c => Number(c.id) === workItem.clientId);
    const workplace = client?.workplaces?.find(w => Number(w.id) === Number(workItem.workplaceId));
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(INVOICE_ID_PADDING, '0')}`;
    const items = unbilledItems.map(toInvoiceItem);
    const totalAmount = items.reduce((s, it) => s + ((it.total !== 0) ? it.total : 0), 0);
    const dueDateTime = Date.now() + (DAYS_UNTIL_DUE * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND);
    const newInvoice = {
      id: newInvoiceId,
      clientId: workItem.clientId,
      client: workItem.clientName ?? '',
      workplaceId: (typeof workItem.workplaceId === 'number') ? workItem.workplaceId : undefined,
      project: workItem.projectName ?? '',
      workplaceAddress: workplace?.address ?? '',
      amount: totalAmount,
      status: '발송대기' as const,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(dueDateTime).toISOString().split('T')[0],
      workItems: items,
    };

    // 이전 상태 백업
    const previousInvoices = [...invoices];

    // UI 먼저 업데이트 (optimistic update)
    const tempInvoice = { ...newInvoice, id: `TEMP-${Date.now()}` };
    setInvoices(prev => [...prev, tempInvoice]);

    // Supabase INSERT
    try {
      const { supabase, getCurrentUserId } = await import('../services/supabase');
      if (supabase !== null && supabase !== undefined) {
        const userId = await getCurrentUserId();

        // Status 한글 → 영어 변환
        const toDbStatus = (status: string): string => {
          const statusMap: Record<string, string> = {
            '발송대기': 'pending',
            '발송됨': 'pending',
            '미결제': 'overdue',
            '결제완료': 'paid',
          };
          return statusMap[status] ?? 'pending';
        };

        // 1. Invoice 메인 데이터 INSERT
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            user_id: userId,
            invoice_number: newInvoiceId,
            client_id: workItem.clientId,
            workplace_id: workItem.workplaceId,
            title: workItem.projectName ?? '',
            date: newInvoice.date,
            due_date: newInvoice.dueDate,
            status: toDbStatus(newInvoice.status),
            amount: totalAmount,
            notes: '',
          })
          .select('invoice_id')
          .single();

        if (invoiceError !== null && invoiceError !== undefined) {
          alert(`청구서 생성 중 오류가 발생했습니다: ${invoiceError.message}`);
          setInvoices(previousInvoices);
          return;
        }

        // 2. Invoice Items INSERT
        if (invoiceData !== null && invoiceData !== undefined && items.length > 0) {
          const dbInvoiceItems = items.map((item, index) => ({
            user_id: userId,
            invoice_id: invoiceData.invoice_id,
            category: item.category ?? '',
            name: item.name,
            description: item.description ?? '',
            unit: item.unit ?? '',
            quantity: item.quantity,
            unit_price: item.unitPrice,
            sort_order: index,
            date: (item.date !== null && item.date !== undefined && item.date !== '') ? item.date : null,
            notes: (item.notes !== null && item.notes !== undefined && item.notes !== '') ? item.notes : null,
            labor_persons: typeof item.laborPersons === 'number' ? item.laborPersons : (typeof item.laborPersons === 'string' && item.laborPersons !== '' ? Number(item.laborPersons) : 0),
            labor_unit_rate: typeof item.laborUnitRate === 'number' ? item.laborUnitRate : (typeof item.laborUnitRate === 'string' && item.laborUnitRate !== '' ? Number(item.laborUnitRate) : 0),
            labor_persons_general: typeof item.laborPersonsGeneral === 'number' ? item.laborPersonsGeneral : (typeof item.laborPersonsGeneral === 'string' && item.laborPersonsGeneral !== '' ? Number(item.laborPersonsGeneral) : 0),
            labor_unit_rate_general: typeof item.laborUnitRateGeneral === 'number' ? item.laborUnitRateGeneral : (typeof item.laborUnitRateGeneral === 'string' && item.laborUnitRateGeneral !== '' ? Number(item.laborUnitRateGeneral) : 0),
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(dbInvoiceItems);

          if (itemsError !== null && itemsError !== undefined) {
            alert(`청구서 항목 저장 중 오류가 발생했습니다: ${itemsError.message}`);
            // Invoice는 생성되었으나 items 저장 실패 - 계속 진행
          }
        }

        // 실제 ID로 UI 업데이트
        setInvoices(prev => prev.map(inv =>
          inv.id === tempInvoice.id
            ? { ...newInvoice, id: newInvoiceId }
            : inv
        ));

        alert(`청구서 ${newInvoiceId}가 생성되었습니다.`);
      }
    } catch (err) {
      alert(`청구서 생성 실패: ${String(err)}`);
      setInvoices(previousInvoices);
    }
  };

  const onChangeField = (name: string, value: string) => {
    let v: unknown = value;
    if (['defaultPrice', 'quantity', 'laborPersons', 'laborUnitRate', 'laborPersonsGeneral', 'laborUnitRateGeneral'].includes(name)) {
      const digits = String(value).replace(/[^\d-]/g, '');
      v = (digits === '' || digits === '-') ? '' : parse(digits);
    } else if (['clientId', 'workplaceId'].includes(name)) {
      const parsedValue = parseInt(String(value));
      v = (parsedValue !== 0) ? parsedValue : 0;
    }
    setNewItem(prev => ({ ...prev, [name]: v } as NewItem));
  };

  // Bulk Modal handlers
  const onBaseInfoChangeField = (name: string, value: string) => {
    let v: unknown = value;
    if (name === 'clientId' || name === 'workplaceId') {
      const parsedValue = parseInt(String(value));
      v = (parsedValue !== 0) ? parsedValue : '';
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
        const hasProjectName = next.projectName !== '' && next.projectName !== null && next.projectName !== undefined;
        const hasDescription = wp?.description !== undefined && wp?.description !== null && wp?.description !== '';
        if (!hasProjectName && hasDescription) next.projectName = wp.description ?? '';
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
      const existingItem = updated[index];
      if (existingItem !== undefined) {
        updated[index] = { ...existingItem, [field]: v } as BulkItem;
      }
      return updated;
    });
  };

  const onBulkAddItem = () => {
    setBulkItems(prev => ([
      ...prev,
      {
        name: '', category: '', defaultPrice: '' as unknown as number, quantity: '' as unknown as number, unit: '', description: '', status: '예정', notes: '', laborPersons: '', laborUnitRate: ''
      }
    ]));
  };
  const onBulkRemoveItem = (index: number) => {
    setBulkItems(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const onBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];
    const hasClientId = bulkBaseInfo.clientId !== '' && bulkBaseInfo.clientId !== null && bulkBaseInfo.clientId !== undefined;
    const hasWorkplaceId = bulkBaseInfo.workplaceId !== '' && bulkBaseInfo.workplaceId !== null && bulkBaseInfo.workplaceId !== undefined;
    const hasProjectName = bulkBaseInfo.projectName !== '' && bulkBaseInfo.projectName !== null && bulkBaseInfo.projectName !== undefined;
    if (!hasClientId) errors.push('건축주를 선택하세요.');
    if (!hasWorkplaceId) errors.push('작업장을 선택하세요.');
    if (!hasProjectName) errors.push('프로젝트명을 입력하세요.');
    bulkItems.forEach((it, idx) => {
      const hasName = it.name !== undefined && it.name !== null && String(it.name).trim() !== '';
      if (!hasName) errors.push(`항목 #${idx + 1}: 내용은 필수입니다.`);
    });
    if (errors.length > 0) { alert(errors.join('\n')); return; }

    const selectedClientData = clients.find(c => Number(c.id) === Number(bulkBaseInfo.clientId));
    const selectedWorkplace = getClientWorkplaces(bulkBaseInfo.clientId).find(wp => wp.id === Number(bulkBaseInfo.workplaceId));
    const currentMaxId = (workItems.length > 0) ? Math.max(...workItems.map(i => Number(i.id) ?? 0)) : 0;

    const bulkLP: number | '' = typeof bulkBaseInfo.bulkLaborPersons === 'number'
      ? bulkBaseInfo.bulkLaborPersons
      : (String(bulkBaseInfo.bulkLaborPersons).trim() === '' ? '' : (parseInt(String(bulkBaseInfo.bulkLaborPersons), 10) ?? 0));
    const bulkLR: number | '' = typeof bulkBaseInfo.bulkLaborUnitRate === 'number'
      ? bulkBaseInfo.bulkLaborUnitRate
      : (String(bulkBaseInfo.bulkLaborUnitRate).trim() === '' ? '' : (parseInt(String(bulkBaseInfo.bulkLaborUnitRate), 10) ?? 0));

    const createdItems: WorkItem[] = bulkItems.map((item, idx) => ({
      id: currentMaxId + idx + 1,
      clientId: Number(bulkBaseInfo.clientId) as number,
      clientName: selectedClientData?.name ?? '',
      workplaceId: Number(bulkBaseInfo.workplaceId) as number,
      workplaceName: selectedWorkplace?.name ?? '',
      projectName: bulkBaseInfo.projectName,
      date: bulkBaseInfo.date ?? new Date().toISOString().split('T')[0],
      name: item.name ?? '',
      category: item.category ?? '',
      defaultPrice: (typeof item.defaultPrice === 'number' && item.defaultPrice !== 0) ? item.defaultPrice : ((item.defaultPrice as unknown as string) === '' ? '' as unknown as number : 0),
      quantity: (typeof item.quantity === 'number' && item.quantity !== 0) ? item.quantity : ((item.quantity as unknown as string) === '' ? '' as unknown as number : 1),
      unit: item.unit ?? '',
      description: item.description ?? '',
      status: (item.status as WorkStatus) ?? '예정',
      notes: item.notes ?? '',
      laborPersonsGeneral: bulkLP,
      laborUnitRateGeneral: bulkLR,
      laborPersons: item.laborPersons ?? '',
      laborUnitRate: item.laborUnitRate ?? '',
    }));

    // 이전 상태 백업 (롤백용)
    const previousWorkItems = workItems;
    const previousClients = clients;

    // UI 즉시 업데이트 (낙관적 업데이트)
    setWorkItems(prev => [...prev, ...createdItems]);
    const hasBulkProjectName = bulkBaseInfo.projectName !== '' && bulkBaseInfo.projectName !== null && bulkBaseInfo.projectName !== undefined;
    if (hasBulkProjectName) {
      setClients(prev => prev.map(c => Number(c.id) === Number(bulkBaseInfo.clientId)
        ? { ...c, projects: Array.from(new Set([...(c.projects ?? []), bulkBaseInfo.projectName])) }
        : c
      ));
    }

    // Supabase에도 즉시 생성
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) {
        setWorkItems(previousWorkItems);
        setClients(previousClients);
        alert('데이터베이스 연결에 실패했습니다.');
        return;
      }
      const { getCurrentUserId } = await import('../services/supabase');
      const userId = await getCurrentUserId();

      // Integer 필드를 안전하게 변환하는 헬퍼 함수
      const toIntOrNull = (val: string | number | null | undefined): number | null => {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      // Status 한글 -> 영어 변환 함수
      const toDbStatus = (status: string | undefined): string => {
        if (status === null || status === undefined || status === '') return 'planned';
        const statusMap: Record<string, string> = {
          '예정': 'planned',
          '진행중': 'in_progress',
          '완료': 'completed',
          '보류': 'on_hold',
        };
        return statusMap[status] ?? 'planned';
      };

      // 대량 INSERT를 위한 데이터 배열 생성
      const dbWorkItems = createdItems.map(item => ({
        user_id: userId,
        client_id: toIntOrNull(item.clientId),
        workplace_id: toIntOrNull(item.workplaceId),
        project_name: item.projectName ?? '',
        name: item.name,
        description: item.description ?? '',
        category: item.category ?? '',
        quantity: toIntOrNull(item.quantity) ?? 0,
        unit: item.unit ?? '',
        default_price: toIntOrNull(item.defaultPrice) ?? 0,
        status: toDbStatus(item.status),
        start_date: item.date ?? null,
        notes: item.notes ?? '',
        labor_persons: toIntOrNull(item.laborPersons) ?? 0,
        labor_unit_rate: toIntOrNull(item.laborUnitRate) ?? 0,
        labor_persons_general: toIntOrNull(item.laborPersonsGeneral) ?? 0,
        labor_unit_rate_general: toIntOrNull(item.laborUnitRateGeneral) ?? 0,
      }));

      const { data: insertedData, error } = await supabase
        .from('work_items')
        .insert(dbWorkItems)
        .select(`
          *,
          clients!client_id (
            company_name,
            workplaces
          )
        `);

      if (error !== null && error !== undefined) {
        setWorkItems(previousWorkItems);
        setClients(previousClients);
        alert(`작업 항목 생성 중 오류가 발생했습니다: ${error.message}`);
        return;
      }

      // DB에서 반환된 실제 데이터로 UI 업데이트
      if ((insertedData !== null && insertedData !== undefined) && insertedData.length > 0) {
        const fromDbStatus = (status: string): '예정' | '진행중' | '완료' | '보류' => {
          const statusMap: Record<string, '예정' | '진행중' | '완료' | '보류'> = {
            'planned': '예정',
            'in_progress': '진행중',
            'completed': '완료',
            'on_hold': '보류',
            'cancelled': '보류',
          };
          return statusMap[status] ?? '예정';
        };

        const actualCreatedItems: WorkItem[] = insertedData.map((w: Record<string, unknown>) => {
          const clients = w.clients as Record<string, unknown> | null | undefined;
          const clientName = (clients?.company_name !== null && clients?.company_name !== undefined) ? String(clients.company_name) : '';
          const workplaces = (clients?.workplaces !== null && clients?.workplaces !== undefined) ? clients.workplaces as Array<Record<string, unknown>> : [];
          const workplace = workplaces.find((wp: Record<string, unknown>) => (wp.id !== null && wp.id !== undefined) && wp.id === w.workplace_id);
          const workplaceName = (workplace?.name !== null && workplace?.name !== undefined) ? String(workplace.name) : '';
          const rawWorkplaceId = w.workplace_id as number | null | undefined;
          const workplaceId = (rawWorkplaceId !== null && rawWorkplaceId !== undefined) ? rawWorkplaceId : '';

          return {
            id: w.work_item_id as number,
            clientId: w.client_id as number,
            clientName,
            workplaceId,
            workplaceName,
            projectName: (w.project_name !== null && w.project_name !== undefined) ? String(w.project_name) : '',
            name: w.name as string,
            category: (w.category !== null && w.category !== undefined) ? String(w.category) : '',
            defaultPrice: (w.default_price !== null && w.default_price !== undefined) ? Number(w.default_price) : 0,
            quantity: (w.quantity !== null && w.quantity !== undefined) ? Number(w.quantity) : 0,
            unit: (w.unit !== null && w.unit !== undefined) ? String(w.unit) : '',
            description: (w.description !== null && w.description !== undefined) ? String(w.description) : '',
            status: fromDbStatus(w.status as string) as WorkStatus,
            date: (w.start_date !== null && w.start_date !== undefined) ? String(w.start_date) : '',
            notes: (w.notes !== null && w.notes !== undefined) ? String(w.notes) : '',
            laborPersons: (w.labor_persons !== null && w.labor_persons !== undefined) ? Number(w.labor_persons) : 0,
            laborUnitRate: (w.labor_unit_rate !== null && w.labor_unit_rate !== undefined) ? Number(w.labor_unit_rate) : 0,
            laborPersonsGeneral: (w.labor_persons_general !== null && w.labor_persons_general !== undefined) ? Number(w.labor_persons_general) : 0,
            laborUnitRateGeneral: (w.labor_unit_rate_general !== null && w.labor_unit_rate_general !== undefined) ? Number(w.labor_unit_rate_general) : 0
          };
        });

        // 실제 DB 데이터로 다시 업데이트
        setWorkItems(prev => {
          const withoutOptimistic = prev.filter(item =>
            !createdItems.some(created => created.id === item.id)
          );
          return [...withoutOptimistic, ...actualCreatedItems];
        });
      }
    } catch (err) {
      setWorkItems(previousWorkItems);
      setClients(previousClients);
      alert('작업 항목 생성 중 예상치 못한 오류가 발생했습니다.');
      return;
    }

    setShowBulkModal(false);
    setShowBulkCustomProject(false);
    setBulkItems([{ name: '', category: '', defaultPrice: '' as unknown as number, quantity: '' as unknown as number, unit: '', description: '', status: '예정', notes: '', laborPersons: '', laborUnitRate: '' }]);
    setBulkBaseInfo({ clientId: '', workplaceId: '', projectName: '', date: new Date().toISOString().split('T')[0], bulkLaborPersons: '', bulkLaborUnitRate: '' });
    alert(`${createdItems.length}개의 작업 항목이 추가되었습니다.`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedClientData = clients.find(c => Number(c.id) === Number(newItem.clientId));
    const selectedWorkplace = getClientWorkplaces(newItem.clientId).find(wp => wp.id === newItem.workplaceId);

    if (editingItem !== null) {
      // 이전 상태 백업 (롤백용)
      const previousWorkItems = workItems;

      // 수정: UI 즉시 업데이트 (낙관적 업데이트)
      const updated = {
        ...editingItem,
        ...newItem,
        clientName: selectedClientData?.name ?? editingItem.clientName,
        workplaceName: selectedWorkplace?.name ?? editingItem.workplaceName,
      } as WorkItem;
      setWorkItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));

      // Supabase에도 즉시 업데이트
      try {
        const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) {
        // Supabase 초기화 실패 시 롤백
        setWorkItems(previousWorkItems);
        alert('데이터베이스 연결에 실패했습니다.');
        return;
      }
        // Integer 필드를 안전하게 변환하는 헬퍼 함수
        const toIntOrNull = (val: string | number | null | undefined): number | null => {
          if (val === null || val === undefined || val === '') return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        // Status 한글 -> 영어 변환 함수
        const toDbStatus = (status: string | undefined): string => {
          if (status === null || status === undefined || status === '') return 'planned';
          const statusMap: Record<string, string> = {
            '예정': 'planned',
            '진행중': 'in_progress',
            '완료': 'completed',
            '보류': 'on_hold',
          };
          return statusMap[status] ?? 'planned';
        };

        const { error } = await supabase
          .from('work_items')
          .update({
            client_id: toIntOrNull(updated.clientId),
            workplace_id: toIntOrNull(updated.workplaceId),
            project_name: updated.projectName ?? '',
            name: updated.name,
            description: updated.description ?? '',
            category: updated.category ?? '',
            quantity: toIntOrNull(updated.quantity) ?? 0,
            unit: updated.unit ?? '',
            default_price: toIntOrNull(updated.defaultPrice) ?? 0,
            status: toDbStatus(updated.status),
            start_date: updated.date ?? null,
            notes: updated.notes ?? '',
            labor_persons: toIntOrNull(updated.laborPersons) ?? 0,
            labor_unit_rate: toIntOrNull(updated.laborUnitRate) ?? 0,
            labor_persons_general: toIntOrNull(updated.laborPersonsGeneral) ?? 0,
            labor_unit_rate_general: toIntOrNull(updated.laborUnitRateGeneral) ?? 0,
          })
          .eq('work_item_id', updated.id);

        if (error !== null && error !== undefined) {
          // 오류 발생 시 롤백
          setWorkItems(previousWorkItems);
          alert(`작업 항목 수정 중 오류가 발생했습니다: ${error.message}`);
          return;
        }
      } catch (err) {
        // 예외 발생 시 롤백
        setWorkItems(previousWorkItems);
        alert('작업 항목 수정 중 예상치 못한 오류가 발생했습니다.');
        return;
      }
    } else {
      // 이전 상태 백업 (롤백용)
      const previousWorkItems = workItems;
      const previousClients = clients;

      // 생성: UI 즉시 업데이트 (낙관적 업데이트)
      const nextId = ((workItems.length > 0) ? Math.max(...workItems.map(i => Number(i.id) ?? 0)) : 0) + 1;
      const created: WorkItem = {
        ...newItem,
        id: nextId,
        clientName: selectedClientData?.name ?? '',
        workplaceName: selectedWorkplace?.name ?? '',
        date: newItem.date ?? new Date().toISOString().split('T')[0],
      } as WorkItem;
      setWorkItems(prev => [...prev, created]);

      const hasProjectName = newItem.projectName !== undefined && newItem.projectName !== null && newItem.projectName !== '';
      if (hasProjectName) {
        setClients(prev => prev.map(c => Number(c.id) === Number(newItem.clientId)
          ? { ...c, projects: Array.from(new Set([...(c.projects ?? []), newItem.projectName!])) }
          : c
        ));
      }

      // Supabase에도 즉시 생성
      try {
        const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) {
        // Supabase 초기화 실패 시 롤백
        setWorkItems(previousWorkItems);
        setClients(previousClients);
        alert('데이터베이스 연결에 실패했습니다.');
        return;
      }
        const { getCurrentUserId } = await import('../services/supabase');
        const userId = await getCurrentUserId();

        // Integer 필드를 안전하게 변환하는 헬퍼 함수
        const toIntOrNull = (val: string | number | null | undefined): number | null => {
          if (val === null || val === undefined || val === '') return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        // Status 한글 -> 영어 변환 함수
        const toDbStatus = (status: string | undefined): string => {
          if (status === null || status === undefined || status === '') return 'planned';
          const statusMap: Record<string, string> = {
            '예정': 'planned',
            '진행중': 'in_progress',
            '완료': 'completed',
            '보류': 'on_hold',
          };
          return statusMap[status] ?? 'planned';
        };

        const dbStatus = toDbStatus(created.status);
        const clientIdValue = toIntOrNull(created.clientId);
        const workplaceIdValue = toIntOrNull(created.workplaceId);

        // client_id가 필수이므로 null이면 에러
        if (clientIdValue === null) {
          alert('건축주를 선택해주세요.');
          setWorkItems(previousWorkItems);
          setClients(previousClients);
          return;
        }

        // work_item_id는 데이터베이스에서 자동 생성하도록 제거
        const { error } = await supabase
          .from('work_items')
          .insert({
            user_id: userId,
            client_id: clientIdValue,
            workplace_id: workplaceIdValue,
            project_name: created.projectName ?? '',
            name: created.name,
            description: created.description ?? '',
            category: created.category ?? '',
            quantity: toIntOrNull(created.quantity) ?? 0,
            unit: created.unit ?? '',
            default_price: toIntOrNull(created.defaultPrice) ?? 0,
            status: dbStatus,
            start_date: created.date ?? null,
            notes: created.notes ?? '',
            labor_persons: toIntOrNull(created.laborPersons) ?? 0,
            labor_unit_rate: toIntOrNull(created.laborUnitRate) ?? 0,
            labor_persons_general: toIntOrNull(created.laborPersonsGeneral) ?? 0,
            labor_unit_rate_general: toIntOrNull(created.laborUnitRateGeneral) ?? 0,
          });

        if (error !== null && error !== undefined) {
          // 오류 발생 시 롤백
          setWorkItems(previousWorkItems);
          setClients(previousClients);
          alert(`작업 항목 생성 중 오류가 발생했습니다: ${error.message}`);
          return;
        }
      } catch (err) {
        // 예외 발생 시 롤백
        setWorkItems(previousWorkItems);
        setClients(previousClients);
        alert('작업 항목 생성 중 예상치 못한 오류가 발생했습니다.');
        return;
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

  const confirmBulkDelete = async () => {
    const count = selection.selected.length;

    // UI에서 즉시 제거
    setWorkItems(prev => prev.filter(i => !selection.selected.includes(i.id)));
    selection.clear();
    setShowConfirmBulkDelete(false);
    alert(`${count}개의 작업 항목이 삭제되었습니다.`);

    // Supabase에서도 즉시 삭제
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) return;
      const { error } = await supabase
        .from('work_items')
        .delete()
        .in('work_item_id', selection.selected);

      if (error !== null && error !== undefined) {
        // 오류 발생
      }
    } catch (err) {
      // 실패
    }
  };

  const handleApplyBulkStatus = async () => {
    const hasStatus = bulkStatus !== '' && bulkStatus !== null && bulkStatus !== undefined;
    if (!hasStatus) { alert('변경할 상태를 선택하세요.'); return; }

    // 이전 상태 백업 (롤백용)
    const previousWorkItems = workItems;

    // UI 즉시 업데이트 (낙관적 업데이트)
    setWorkItems(prev => prev.map(item => selection.selected.includes(item.id) ? { ...item, status: bulkStatus as WorkStatus } : item));
    setBulkStatus('');

    // Supabase에도 즉시 업데이트
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) {
        setWorkItems(previousWorkItems);
        alert('데이터베이스 연결에 실패했습니다.');
        return;
      }

      // Status 한글 -> 영어 변환 함수
      const toDbStatus = (status: string | undefined): string => {
        if (status === null || status === undefined || status === '') return 'planned';
        const statusMap: Record<string, string> = {
          '예정': 'planned',
          '진행중': 'in_progress',
          '완료': 'completed',
          '보류': 'on_hold',
        };
        return statusMap[status] ?? 'planned';
      };

      const dbStatus = toDbStatus(bulkStatus as WorkStatus);

      // 선택된 항목들의 상태를 일괄 업데이트
      const { error } = await supabase
        .from('work_items')
        .update({ status: dbStatus })
        .in('work_item_id', selection.selected);

      if (error !== null && error !== undefined) {
        setWorkItems(previousWorkItems);
        alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
        return;
      }
    } catch (err) {
      setWorkItems(previousWorkItems);
      alert('상태 변경 중 예상치 못한 오류가 발생했습니다.');
    }
  };

  const handleCreateBulkInvoice = () => {
    const INVOICE_ID_PADDING = 3;
    const DAYS_UNTIL_DUE = 14;
    const HOURS_PER_DAY = 24;
    const MINUTES_PER_HOUR = 60;
    const SECONDS_PER_MINUTE = 60;
    const MS_PER_SECOND = 1000;

    if (selection.selected.length === 0) { alert('항목을 선택하세요.'); return; }
    const selectedItems = workItems.filter(i => selection.selected.includes(i.id) && i.status === '완료');
    if (selectedItems.length === 0) { alert('완료된 항목이 없습니다.'); return; }
    const first = selectedItems[0];

    // clientId 유효성 검증
    if (first.clientId === null || first.clientId === undefined || first.clientId === 0) {
      alert('유효한 건축주 정보가 없습니다. 작업 항목에 건축주를 먼저 설정해주세요.');
      return;
    }

    // 같은 건축주, 작업장, 프로젝트인지 확인
    const hasDifferentProject = selectedItems.some(item =>
      item.clientId !== first.clientId ||
      Number(item.workplaceId) !== Number(first.workplaceId) ||
      item.projectName !== first.projectName
    );

    if (hasDifferentProject) {
      alert('선택한 항목들은 모두 같은 건축주, 작업장, 프로젝트여야 합니다.');
      return;
    }
    const client = clients.find(c => Number(c.id) === first.clientId);
    const workplace = client?.workplaces?.find(w => Number(w.id) === Number(first.workplaceId));
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(INVOICE_ID_PADDING, '0')}`;
    const items = selectedItems.map(toInvoiceItem);
    const totalAmount = items.reduce((s, it) => s + ((it.total !== 0) ? it.total : 0), 0);
    const dueDateTime = Date.now() + (DAYS_UNTIL_DUE * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND);
    const newInvoice = {
      id: newInvoiceId,
      clientId: first.clientId,
      client: first.clientName ?? '',
      workplaceId: (typeof first.workplaceId === 'number') ? first.workplaceId : undefined,
      project: first.projectName ?? '',
      workplaceAddress: workplace?.address ?? '',
      amount: totalAmount,
      status: '발송대기' as const,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(dueDateTime).toISOString().split('T')[0],
      workItems: items,
    };
    setInvoices(prev => [...prev, newInvoice]);
    selection.clear();
    alert(`청구서 ${newInvoiceId}가 생성되었습니다! (${selectedItems.length}개 항목)`);
  };

  const handleExport = () => exportToExcel.workItems(filteredWorkItems);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = (files !== null && files.length > 0) ? files[0] : null;
    if (file === null) return;

    // 이전 상태 백업 (롤백용)
    const previousWorkItems = workItems;

    try {
      const imported = await importFromExcel.workItems(file);
      const currentMax = (workItems.length > 0) ? Math.max(...workItems.map(i => Number(i.id) ?? 0)) : 0;
      const importedArray = imported ?? [];

      // 건축주 이름으로 ID 매칭 및 검증
      const notFoundClients: string[] = [];
      const notFoundWorkplaces: string[] = [];
      const missingWorkplaces: string[] = [];

      const remapped = importedArray.map((it: Partial<WorkItem>, idx: number) => {
        // 건축주 이름으로 ID 찾기
        let matchedClient: Client | undefined;
        if (it?.clientName !== null && it?.clientName !== undefined && it.clientName !== '') {
          matchedClient = clients.find(c => c.name === it.clientName);
          if (matchedClient === null || matchedClient === undefined) {
            notFoundClients.push(it.clientName);
          }
        }

        // 작업장 이름 필수 검증
        if (it?.workplaceName === null || it?.workplaceName === undefined || it.workplaceName.trim() === '') {
          missingWorkplaces.push(`${it?.clientName ?? '(건축주 없음)'} - ${it?.name ?? '(항목명 없음)'}`);
        }

        // 작업장 이름으로 ID 찾기 (해당 건축주 내에서)
        let matchedWorkplaceId: number | '' = '';
        if ((matchedClient !== null && matchedClient !== undefined) && (it?.workplaceName !== null && it?.workplaceName !== undefined && it.workplaceName !== '')) {
          const workplace = matchedClient.workplaces?.find(wp => wp.name === it.workplaceName);
          if (workplace !== null && workplace !== undefined) {
            matchedWorkplaceId = workplace.id;
          } else {
            // 건축주는 있지만 해당 작업장이 없는 경우
            notFoundWorkplaces.push(`${it.clientName} - ${it.workplaceName}`);
          }
        }

        return {
          id: currentMax + idx + 1,
          clientId: (matchedClient !== null && matchedClient !== undefined) ? matchedClient.id : 0,
          clientName: it?.clientName ?? '',
          workplaceId: matchedWorkplaceId,
          workplaceName: it?.workplaceName ?? '',
          projectName: it?.projectName ?? '',
          name: String(it?.name ?? ''),
          category: it?.category ?? '',
          unit: it?.unit ?? '',
          quantity: typeof it?.quantity === 'number' ? it.quantity : 0,
          defaultPrice: typeof it?.defaultPrice === 'number' ? it.defaultPrice : 0,
          description: it?.description ?? '',
          notes: it?.notes ?? '',
          status: (it?.status as WorkStatus) ?? '예정',
          date: it?.date ?? new Date().toISOString().split('T')[0],
          laborPersons: it?.laborPersons ?? '',
          laborUnitRate: it?.laborUnitRate ?? '',
          laborPersonsGeneral: it?.laborPersonsGeneral ?? '',
          laborUnitRateGeneral: it?.laborUnitRateGeneral ?? '',
        } as WorkItem;
      });

      // 검증 오류 확인
      const MAX_ERROR_DISPLAY_COUNT = 5;
      const errors: string[] = [];

      if (notFoundClients.length > 0) {
        const uniqueNames = Array.from(new Set(notFoundClients));
        errors.push(`❌ 등록되지 않은 건축주:\n   ${uniqueNames.join(', ')}`);
      }

      if (missingWorkplaces.length > 0) {
        errors.push(`❌ 작업장 정보가 누락된 항목:\n   ${missingWorkplaces.slice(0, MAX_ERROR_DISPLAY_COUNT).join('\n   ')}${missingWorkplaces.length > MAX_ERROR_DISPLAY_COUNT ? `\n   ... 외 ${missingWorkplaces.length - MAX_ERROR_DISPLAY_COUNT}개` : ''}`);
      }

      if (notFoundWorkplaces.length > 0) {
        const uniqueWorkplaces = Array.from(new Set(notFoundWorkplaces));
        errors.push(`❌ 등록되지 않은 작업장:\n   ${uniqueWorkplaces.slice(0, MAX_ERROR_DISPLAY_COUNT).join('\n   ')}${uniqueWorkplaces.length > MAX_ERROR_DISPLAY_COUNT ? `\n   ... 외 ${uniqueWorkplaces.length - MAX_ERROR_DISPLAY_COUNT}개` : ''}`);
      }

      if (errors.length > 0) {
        setWorkItems(previousWorkItems);
        alert(`엑셀 가져오기 실패\n\n${errors.join('\n\n')}\n\n해결 방법:\n1. 건축주 관리에서 건축주를 먼저 등록\n2. 건축주의 작업장을 등록\n3. 엑셀 파일의 "건축주"와 "작업장" 컬럼을 정확히 입력`);
        (e.target as HTMLInputElement).value = '';
        return;
      }

      // UI 즉시 업데이트 (낙관적 업데이트)
      setWorkItems(prev => [...prev, ...remapped]);

      // Supabase에 저장
      try {
        const { supabase } = await import('../services/supabase');
        if (supabase === null || supabase === undefined) {
          setWorkItems(previousWorkItems);
          alert('데이터베이스 연결에 실패했습니다.');
          return;
        }
        const { getCurrentUserId } = await import('../services/supabase');
        const userId = await getCurrentUserId();

        // Integer 필드를 안전하게 변환하는 헬퍼 함수
        const toIntOrNull = (val: string | number | null | undefined): number | null => {
          if (val === null || val === undefined || val === '') return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        // Status 한글 -> 영어 변환 함수
        const toDbStatus = (status: string | undefined): string => {
          if (status === null || status === undefined || status === '') return 'planned';
          const statusMap: Record<string, string> = {
            '예정': 'planned',
            '진행중': 'in_progress',
            '완료': 'completed',
            '보류': 'on_hold',
          };
          return statusMap[status] ?? 'planned';
        };

        // 대량 INSERT를 위한 데이터 배열 생성
        const dbWorkItems = remapped.map(item => ({
          user_id: userId,
          client_id: toIntOrNull(item.clientId),
          client_name: item.clientName ?? '',
          workplace_id: toIntOrNull(item.workplaceId),
          workplace_name: item.workplaceName ?? '',
          project_name: item.projectName ?? '',
          name: item.name,
          description: item.description ?? '',
          category: item.category ?? '',
          quantity: toIntOrNull(item.quantity) ?? 0,
          unit: item.unit ?? '',
          default_price: toIntOrNull(item.defaultPrice) ?? 0,
          status: toDbStatus(item.status),
          start_date: item.date ?? null,
          notes: item.notes ?? '',
          labor_persons: toIntOrNull(item.laborPersons) ?? 0,
          labor_unit_rate: toIntOrNull(item.laborUnitRate) ?? 0,
          labor_persons_general: toIntOrNull(item.laborPersonsGeneral) ?? 0,
          labor_unit_rate_general: toIntOrNull(item.laborUnitRateGeneral) ?? 0,
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('work_items')
          .insert(dbWorkItems)
          .select();

        if (insertError !== null && insertError !== undefined) {
          setWorkItems(previousWorkItems);
          // eslint-disable-next-line no-console
          console.error('엑셀 가져오기 Supabase 저장 오류 상세:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            데이터개수: dbWorkItems.length,
            첫번째항목: dbWorkItems[0]
          });
          alert(`Supabase 저장 중 오류가 발생했습니다: ${insertError.message}\n\n콘솔(F12)을 열어 상세 정보를 확인하세요.`);
          return;
        }

        // DB에서 반환된 실제 데이터로 업데이트 (work_item_id 포함)
        if (insertedData !== null && insertedData !== undefined) {
          const actualCreatedItems: WorkItem[] = insertedData.map((w: Record<string, unknown>) => {
            const fromDbStatus = (dbStatus: string): WorkStatus => {
              const statusMap: Record<string, WorkStatus> = {
                'planned': '예정',
                'in_progress': '진행중',
                'completed': '완료',
                'on_hold': '보류',
              };
              return statusMap[dbStatus] ?? '예정';
            };

            const clientId = w.client_id as number;
            const rawWorkplaceId = w.workplace_id as number | null | undefined;
            const workplaceId = (rawWorkplaceId !== null && rawWorkplaceId !== undefined) ? rawWorkplaceId : '';
            return {
              id: w.work_item_id as number,
              clientId,
              clientName: (w.client_name ?? '') as string,
              workplaceId,
              workplaceName: (w.workplace_name ?? '') as string,
              projectName: (w.project_name ?? '') as string,
              name: w.name as string,
              category: (w.category ?? '') as string,
              defaultPrice: (w.default_price ?? 0) as number,
              quantity: (w.quantity ?? 0) as number,
              unit: (w.unit ?? '') as string,
              description: (w.description ?? '') as string,
              status: fromDbStatus(w.status as string),
              date: (w.start_date ?? '') as string,
              notes: (w.notes ?? '') as string,
              laborPersons: (w.labor_persons ?? 0) as number,
              laborUnitRate: (w.labor_unit_rate ?? 0) as number,
              laborPersonsGeneral: (w.labor_persons_general ?? 0) as number,
              laborUnitRateGeneral: (w.labor_unit_rate_general ?? 0) as number
            };
          });

          // 실제 DB 데이터로 다시 업데이트
          setWorkItems(prev => {
            const withoutOptimistic = prev.filter(item =>
              !remapped.some(created => created.id === item.id)
            );
            return [...withoutOptimistic, ...actualCreatedItems];
          });
        }
      } catch (err) {
        setWorkItems(previousWorkItems);
        alert('작업 항목 저장 중 예상치 못한 오류가 발생했습니다.');
        return;
      }

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
      />

      <BulkFormModal
        open={showBulkModal}
        clients={clients}
        categories={categories}
        units={units}
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
