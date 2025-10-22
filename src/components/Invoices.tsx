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
import { TIMEOUT } from '../constants/formatting';

export default function Invoices(): JSX.Element {
  const { invoices, setInvoices, clients, companyInfo, stampImage, categories, units, setWorkItems } = useApp();
  const { format } = useNumberFormat();
  const filters = useFilters();

  const statuses = ['발송대기', '발송됨', '미결제', '결제완료'];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case '결제완료': return 'bg-green-100 text-green-800';
      case '발송됨': return 'bg-blue-100 text-blue-800';
      case '미결제': return 'bg-orange-100 text-orange-800';
      case '발송대기': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
  const [showCustomProject, setShowCustomProject] = useState<boolean>(false);
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
      if (filters.selectedClient === '') return invoices;
      const cid = parseInt(filters.selectedClient);
      const clientName = clients.find(c => c.id === cid)?.name;
      return invoices.filter(inv => {
        if (inv.clientId !== null && inv.clientId !== undefined && inv.clientId === cid) return true;
        if (clientName !== null && clientName !== undefined && clientName !== '' && inv.client === clientName) return true;
        return false;
      });
    })();
    if (filters.selectedStatus === '') return base;
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

  const confirmDeleteSingle = async () => {
    if (pendingDeleteId === null || pendingDeleteId === undefined) return;

    // UI에서 즉시 제거
    setInvoices(prev => prev.filter(inv => inv.id !== pendingDeleteId));
    setPendingDeleteId(null);

    // Supabase에서도 즉시 삭제 (invoice_items도 CASCADE로 자동 삭제됨)
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) return;
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('invoice_number', pendingDeleteId);

      if (error !== null && error !== undefined) {
        // 오류 발생
      }
    } catch (err) {
      // 실패
    }
  };

  const handleBulkDelete = () => {
    if (selection.selected.length === 0) return;
    setShowConfirmBulkDelete(true);
  };

  const confirmBulkDelete = async () => {
    // UI에서 즉시 제거
    setInvoices(prev => prev.filter(inv => !selection.selected.includes(inv.id)));
    selection.clear();
    setShowConfirmBulkDelete(false);

    // Supabase에서도 즉시 삭제 (invoice_items도 CASCADE로 자동 삭제됨)
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) return;
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('invoice_number', selection.selected);

      if (error !== null && error !== undefined) {
        // 오류 발생
      }
    } catch (err) {
      // 실패
    }
  };

  const [detail, setDetail] = useState<Invoice | null>(null);
  const resolveBaseUrl = (): string => {
    const pub = process.env.PUBLIC_URL;
    if (typeof pub === 'string' && pub.trim() !== '') {
      try {
        const u = new URL(pub, window.location.origin);
        let path = u.pathname;
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        return `${window.location.origin}${path}`;
      } catch {
        let path = pub.trim();
        if (!path.startsWith('/')) path = `/${path}`;
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        return `${window.location.origin}${path}`;
      }
    }
    return window.location.origin;
  };

  const handleOpenDetailPrint = () => {
    if (detail === null || detail === undefined) return;
    try {
      const payload = { invoice: detail, companyInfo };

      // localStorage에 데이터 저장
      try {
        localStorage.setItem('invoiceDetailPrintData', JSON.stringify(payload));
      } catch (e) {
        // Ignore storage errors
      }

      // URL 구성
      const printUrl = `${resolveBaseUrl()}/invoice-detail-output.html`;


      // 새 창 열기
      const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (printWindow === null || printWindow === undefined) {
        const go = window.confirm(`팝업이 차단되었습니다.\n같은 탭에서 출력 화면으로 이동할까요?`);
        if (go) { window.location.assign(printUrl); }
        return;
      }

      setTimeout(() => {
        try {
          printWindow.focus();
        } catch (e) {
          // Ignore focus errors
        }
      }, TIMEOUT.AUTO_SAVE_DELAY);
      
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
        // Ignore storage errors
      }

      // URL 구성 - 간단하게 수정
      const printUrl = `${resolveBaseUrl()}/invoice-output.html`;


      // 새 창 열기
      const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (printWindow === null || printWindow === undefined) {
        const go = window.confirm('팝업이 차단되었습니다.\n같은 탭에서 출력 화면으로 이동할까요?');
        if (go) { window.location.assign(printUrl); }
        return;
      }

      // 창이 로드된 후 포커스
      setTimeout(() => {
        try {
          printWindow.focus();
        } catch (e) {
          // Ignore focus errors
        }
      }, TIMEOUT.AUTO_SAVE_DELAY);
      
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
    return (c?.workplaces !== null && c?.workplaces !== undefined) ? c.workplaces : [];
  };

  const getClientProjects = (clientId: string | number) => {
    const cid = parseInt(String(clientId));
    const client = clients.find(c => Number(c.id) === cid);
    const clientProjects = (client?.projects !== null && client?.projects !== undefined) ? client.projects.filter((p): p is string => p !== '' && p !== null && p !== undefined) : [];
    const workplaceProjects = (client?.workplaces !== null && client?.workplaces !== undefined)
      ? client.workplaces.map(wp => wp.description ?? '').filter((desc): desc is string => desc !== '')
      : [];
    return Array.from(new Set([...clientProjects, ...workplaceProjects]));
  };

  const onFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value } as FormState;
      if (name === 'clientId') {
        const cid = parseInt(String(value));
        const c = clients.find(cl => Number(cl.id) === cid);
        next.client = (c?.name !== null && c?.name !== undefined && c?.name !== '') ? c.name : '';
        next.workplaceId = '';
        next.workplaceAddress = '';
        next.project = '';
        setShowCustomProject(false);
      }
      if (name === 'workplaceId') {
        const wp = getClientWorkplaces(prev.clientId).find(w => Number(w.id) === parseInt(String(value)));
        next.workplaceAddress = (wp?.address !== null && wp?.address !== undefined && wp?.address !== '') ? wp.address : '';
        if (next.project === '' && wp?.description !== null && wp?.description !== undefined && wp?.description !== '') next.project = wp.description;
      }
      if (name === 'project') {
        if (value === 'custom') {
          setShowCustomProject(true);
          next.project = '';
        } else {
          setShowCustomProject(false);
        }
      }
      return next;
    });
  };

  const onFormItemChange = (index: number, field: keyof FormItem, value: string) => {
    setForm(prev => {
      const items = [...prev.items];
      const MIN_VALUE = 0;
      const BASE_TEN = 10;

      if (field === 'quantity' || field === 'unitPrice' || field === 'laborPersons' || field === 'laborUnitRate' || field === 'laborPersonsGeneral' || field === 'laborUnitRateGeneral') {
        const digits = String(value ?? '').replace(/[^\d-]/g, '');
        const numeric = (digits === '' || digits === '-') ? '' : parseInt(digits, BASE_TEN);
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
      const qNum = Number(items[index].quantity);
      const pNum = Number(items[index].unitPrice);
      const lpNum = Number(items[index].laborPersons);
      const lrNum = Number(items[index].laborUnitRate);
      const lpgNum = Number(items[index].laborPersonsGeneral);
      const lrgNum = Number(items[index].laborUnitRateGeneral);

      const q = (qNum !== MIN_VALUE && !isNaN(qNum)) ? qNum : MIN_VALUE;
      const p = (pNum !== MIN_VALUE && !isNaN(pNum)) ? pNum : MIN_VALUE;
      const lp = (lpNum !== MIN_VALUE && !isNaN(lpNum)) ? lpNum : MIN_VALUE;
      const lr = (lrNum !== MIN_VALUE && !isNaN(lrNum)) ? lrNum : MIN_VALUE;
      const lpg = (lpgNum !== MIN_VALUE && !isNaN(lpgNum)) ? lpgNum : MIN_VALUE;
      const lrg = (lrgNum !== MIN_VALUE && !isNaN(lrgNum)) ? lrgNum : MIN_VALUE;

      const laborCost = (lp * lr) + (lpg * lrg);
      items[index].total = (q * p) + laborCost;
      return { ...prev, items };
    });
  };

  const addFormItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, unit: '', unitPrice: 0, total: 0, category: '', description: '', laborPersons: '', laborUnitRate: '', laborPersonsGeneral: '', laborUnitRateGeneral: '' }] }));
  const removeFormItem = (idx: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const getFormTotal = () => {
    const MIN_VALUE = 0;
    return form.items.reduce((s, it) => {
      const total = Number(it.total);
      return s + ((total !== MIN_VALUE && !isNaN(total)) ? total : MIN_VALUE);
    }, MIN_VALUE);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const MIN_ID_VALUE = 0;
    const INVOICE_ID_PAD_LENGTH = 3;
    const PAD_CHAR = '0';

    if (
      (typeof form.clientId === 'number' && (form.clientId === MIN_ID_VALUE || isNaN(form.clientId))) ||
      (typeof form.clientId === 'string' && form.clientId === '') ||
      (typeof form.workplaceId === 'number' && (form.workplaceId === MIN_ID_VALUE || isNaN(form.workplaceId))) ||
      (typeof form.workplaceId === 'string' && form.workplaceId === '') ||
      form.project === ''
    ) {
      alert('건축주/작업장/프로젝트를 입력하세요.');
      return;
    }
    if (form.items.length === 0 || form.items[0].name === '') {
      alert('작업 항목을 1개 이상 입력하세요.');
      return;
    }
    const newId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(INVOICE_ID_PAD_LENGTH, PAD_CHAR)}`;
    const MIN_VALUE = 0;

    const workplaceIdNumber = Number(form.workplaceId);

    const created: Invoice = {
      id: newId,
      clientId: Number(form.clientId),
      client: form.client,
      workplaceId: workplaceIdNumber,
      project: form.project,
      workplaceAddress: form.workplaceAddress,
      amount: getFormTotal(),
      status: form.status,
      date: form.date,
      workItems: form.items.map((it, index) => {
        const qtyNum = Number(it.quantity);
        const priceNum = Number(it.unitPrice);
        const totalNum = Number(it.total);

        return {
          id: index + 1,
          name: it.name,
          quantity: (qtyNum !== MIN_VALUE && !isNaN(qtyNum)) ? qtyNum : MIN_VALUE,
          unit: it.unit,
          unitPrice: (priceNum !== MIN_VALUE && !isNaN(priceNum)) ? priceNum : MIN_VALUE,
          total: (totalNum !== MIN_VALUE && !isNaN(totalNum)) ? totalNum : MIN_VALUE,
          notes: (it.notes !== null && it.notes !== undefined && it.notes !== '') ? it.notes : '',
          date: (it.date !== null && it.date !== undefined && it.date !== '') ? it.date : '',
          // 상세내역과 인부임 정보 포함
          category: (it.category !== null && it.category !== undefined && it.category !== '') ? it.category : '',
          description: (it.description !== null && it.description !== undefined && it.description !== '') ? it.description : '',
          laborPersons: typeof it.laborPersons === 'number' ? it.laborPersons : (String(it.laborPersons).trim() === '' ? '' : (Number(it.laborPersons) !== MIN_VALUE && !isNaN(Number(it.laborPersons))) ? Number(it.laborPersons) : ''),
          laborUnitRate: typeof it.laborUnitRate === 'number' ? it.laborUnitRate : (String(it.laborUnitRate).trim() === '' ? '' : (Number(it.laborUnitRate) !== MIN_VALUE && !isNaN(Number(it.laborUnitRate))) ? Number(it.laborUnitRate) : ''),
          laborPersonsGeneral: typeof it.laborPersonsGeneral === 'number' ? it.laborPersonsGeneral : (String(it.laborPersonsGeneral).trim() === '' ? '' : (Number(it.laborPersonsGeneral) !== MIN_VALUE && !isNaN(Number(it.laborPersonsGeneral))) ? Number(it.laborPersonsGeneral) : ''),
          laborUnitRateGeneral: typeof it.laborUnitRateGeneral === 'number' ? it.laborUnitRateGeneral : (String(it.laborUnitRateGeneral).trim() === '' ? '' : (Number(it.laborUnitRateGeneral) !== MIN_VALUE && !isNaN(Number(it.laborUnitRateGeneral))) ? Number(it.laborUnitRateGeneral) : ''),
        };
      }),
    };

    // 이전 상태 백업 (롤백용)
    const previousInvoices = invoices;

    // UI 즉시 업데이트 (낙관적 업데이트)
    setInvoices(prev => [...prev, created]);
    setShowForm(false);
    setShowCustomProject(false);
    setForm({
      clientId: '', client: '', workplaceId: '', workplaceAddress: '', project: '', date: new Date().toISOString().split('T')[0], status: '발송대기',
      items: [{ name: '', quantity: 1, unit: '', unitPrice: 0, total: 0, category: '', description: '', laborPersons: '', laborUnitRate: '', laborPersonsGeneral: '', laborUnitRateGeneral: '' }]
    });

    // Supabase에도 즉시 생성 (invoices + invoice_items)
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) {
        // Supabase 초기화 실패 시 롤백
        setInvoices(previousInvoices);
        alert('데이터베이스 연결에 실패했습니다.');
        return;
      }
      const { getCurrentUserId } = await import('../services/supabase');
        const userId = await getCurrentUserId();

      // 1. invoices 테이블 삽입
      // workplace_id: 0 또는 NaN은 null로 변환
      const validWorkplaceId = (typeof created.workplaceId === 'number' && created.workplaceId > 0 && !isNaN(created.workplaceId))
        ? created.workplaceId
        : null;

      const invoiceInsertData = {
        invoice_number: created.id,
        user_id: userId,
        client_id: created.clientId,
        workplace_id: validWorkplaceId,
        title: created.project ?? '',
        date: created.date,
        status: created.status,
        amount: created.amount,
      };

      const { data: invoiceData, error: invError } = await supabase
        .from('invoices')
        .insert(invoiceInsertData)
        .select()
        .single();

      if (invError !== null && invError !== undefined) {
        // 오류 발생 시 롤백
        setInvoices(previousInvoices);
        // eslint-disable-next-line no-console
        console.error('청구서 저장 오류:', invError);
        // eslint-disable-next-line no-console
        console.error('청구서 데이터:', {
          invoice_number: created.id,
          user_id: userId,
          client_id: created.clientId,
          title: created.project ?? '',
          date: created.date,
          status: created.status,
          amount: created.amount,
        });
        alert(`청구서 생성 중 오류가 발생했습니다: ${invError.message}\n코드: ${invError.code}\n상세: ${invError.details}`);
        return;
      }

      if (invoiceData === null || invoiceData === undefined) {
        setInvoices(previousInvoices);
        alert('청구서 생성에 실패했습니다.');
        return;
      }

      // 2. invoice_items 삽입
      const itemsToInsert = created.workItems.map((item, index) => ({
        invoice_id: invoiceData.invoice_id,
        item_id: index + 1,
        category: item.category ?? '',
        name: item.name,
        description: item.description ?? '',
        quantity: item.quantity ?? 0,
        unit: item.unit ?? '',
        unit_price: item.unitPrice ?? 0,
        total: item.total ?? 0,
        notes: item.notes ?? '',
        date: item.date ?? '',
        labor_persons: typeof item.laborPersons === 'number' ? item.laborPersons : 0,
        labor_unit_rate: typeof item.laborUnitRate === 'number' ? item.laborUnitRate : 0,
        labor_persons_general: typeof item.laborPersonsGeneral === 'number' ? item.laborPersonsGeneral : 0,
        labor_unit_rate_general: typeof item.laborUnitRateGeneral === 'number' ? item.laborUnitRateGeneral : 0,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError !== null && itemsError !== undefined) {
        // 오류 발생 시 롤백
        setInvoices(previousInvoices);
        // eslint-disable-next-line no-console
        console.error('청구서 항목 저장 오류:', itemsError);
        // eslint-disable-next-line no-console
        console.error('항목 데이터:', itemsToInsert);
        alert(`청구서 항목 생성 중 오류가 발생했습니다: ${itemsError.message}\n코드: ${itemsError.code}\n상세: ${itemsError.details}`);
        return;
      }

      // 3. work_items 테이블에도 저장 (작업 항목 관리에서 보이도록)
      // 작업장 이름 조회
      const clientIdForWorkplace = created.clientId ?? 0;
      const workplace = getClientWorkplaces(clientIdForWorkplace).find(w => Number(w.id) === Number(validWorkplaceId));
      const workplaceName = workplace?.name ?? '';

      const workItemsToInsert = created.workItems.map((item) => ({
        user_id: userId,
        client_id: created.clientId,
        client_name: created.client,
        workplace_id: validWorkplaceId,
        workplace_name: workplaceName,
        project_name: created.project ?? '',
        name: item.name,
        description: item.description ?? '',
        category: item.category ?? '',
        quantity: item.quantity ?? 0,
        unit: item.unit ?? '',
        default_price: item.unitPrice ?? 0,
        status: 'completed', // 청구서 생성 시점이므로 완료 상태
        start_date: item.date ?? created.date,
        notes: item.notes ?? '',
        labor_persons: typeof item.laborPersons === 'number' ? item.laborPersons : 0,
        labor_unit_rate: typeof item.laborUnitRate === 'number' ? item.laborUnitRate : 0,
        labor_persons_general: typeof item.laborPersonsGeneral === 'number' ? item.laborPersonsGeneral : 0,
        labor_unit_rate_general: typeof item.laborUnitRateGeneral === 'number' ? item.laborUnitRateGeneral : 0,
      }));

      const { data: workItemsData, error: workItemsError } = await supabase
        .from('work_items')
        .insert(workItemsToInsert)
        .select();

      if (workItemsError !== null && workItemsError !== undefined) {
        // 오류 발생 - 청구서는 생성되었지만 작업 항목 저장 실패
        // eslint-disable-next-line no-console
        console.error('작업 항목 저장 오류:', workItemsError);
        alert(`청구서는 생성되었으나 작업 항목 저장 중 오류가 발생했습니다: ${workItemsError.message}`);
        return;
      }

      // 4. 작업 항목 관리 UI 업데이트
      if (workItemsData !== null && workItemsData !== undefined) {
        const fromDbStatus = (status: string): '예정' | '진행중' | '완료' | '보류' => {
          const statusMap: Record<string, '예정' | '진행중' | '완료' | '보류'> = {
            'planned': '예정',
            'in_progress': '진행중',
            'completed': '완료',
            'on_hold': '보류',
          };
          return statusMap[status] ?? '예정';
        };

        const newWorkItems = workItemsData.map((w: Record<string, unknown>) => {
          const rawWorkplaceId = w.workplace_id as number | null | undefined;
          const workplaceIdValue: number | '' = (rawWorkplaceId !== null && rawWorkplaceId !== undefined) ? rawWorkplaceId : '';

          return {
            id: w.work_item_id as number,
            clientId: w.client_id as number,
            clientName: (w.client_name ?? created.client) as string,
            workplaceId: workplaceIdValue,
            workplaceName: (w.workplace_name ?? workplaceName) as string,
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
            laborUnitRateGeneral: (w.labor_unit_rate_general ?? 0) as number,
          };
        });

        setWorkItems(prev => [...prev, ...newWorkItems]);
      }
    } catch (err) {
      // 예외 발생 시 롤백
      setInvoices(previousInvoices);
      alert('청구서 생성 중 예상치 못한 오류가 발생했습니다.');
      return;
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">청구서 관리</h1>
          <p className="text-gray-600 dark:text-gray-300">청구서를 발송하고 결제 현황을 추적하세요</p>
        </div>
        <div className="flex items-center gap-2">
          {selection.selected.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-600 rounded-full shadow-sm hover:shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 text-red-600 dark:text-red-400 font-medium"
            >
              <span className="text-red-500 dark:text-red-400 mr-2">🗑️</span>
              <span className="text-xs font-semibold">선택 삭제({selection.selected.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-300 font-bold"
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
        statuses={statuses}
        getStatusColor={getStatusColor}
      />

      {(detail !== null && detail !== undefined) && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-5xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">청구서 상세</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleOpenDetailPrint} className="px-3 py-1.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded text-sm" title="상세 출력">🖨️ 상세 출력</button>
                <button onClick={() => setDetail(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
              </div>
            </div>
            {/* 인쇄 대상 시작 */}
            <div ref={detailPrintRef}>
              {/* 인쇄 헤더: 번호/성명(건축주)만 출력 */}
              <div className="mb-3 text-sm text-gray-900 dark:text-gray-100">
                <p><strong>번호:</strong> {detail.id}</p>
                <p><strong>성명:</strong> {detail.client}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">작업 내역</h4>
                <InvoiceDetailTable items={(detail.workItems !== null && detail.workItems !== undefined) ? detail.workItems : []} format={format} totalAmount={(() => {
                  const MIN_VALUE = 0;
                  const amt = Number(detail.amount);
                  return (amt !== MIN_VALUE && !isNaN(amt)) ? amt : MIN_VALUE;
                })()} />
              {/* 합계 영역: 템플릿 스타일 참고(소계/부가세/총액) */}
              <div className="mt-3 w-full flex justify-end">
                <div className="w-full max-w-sm space-y-1 bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                  {(() => {
                    const MIN_VALUE = 0;
                    const VAT_DIVISOR = 1.1;
                    const amt = Number(detail.amount);
                    const total = (amt !== MIN_VALUE && !isNaN(amt)) ? amt : MIN_VALUE;
                    const subtotal = Math.round(total / VAT_DIVISOR);
                    const vat = total - subtotal;
                    return (
                      <>
                        <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100"><span>소계</span><span>{format(subtotal)}원</span></div>
                        <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100"><span>부가세(10%)</span><span>{format(vat)}원</span></div>
                        <div className="flex justify-between font-bold text-base text-gray-900 dark:text-gray-100"><span>총액</span><span>{format(total)}원</span></div>
                      </>
                    );
                  })()}
                </div>
              </div>
              </div>
            </div>
            {/* 인쇄 대상 끝 */}
            <div className="mt-4 text-right">
              <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">닫기</button>
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
        <div className="fixed inset-0 bg-gray-800/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto w-[980px] max-w-[95vw] shadow-2xl rounded-2xl bg-white/80 dark:bg-gray-800/90 ring-1 ring-black/5 dark:ring-white/10 mb-8">
            <div className="rounded-t-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 px-8 pt-8 pb-6 text-center">
              <h3 className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">새 청구서 생성</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">청구 정보를 입력하고 항목을 추가하세요</p>
            </div>
            <div className="px-6 pb-6">
              <form id="invoice-form" onSubmit={submitForm} className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="invoice-client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">건축주 *</label>
                      <select id="invoice-client" name="clientId" value={String(form.clientId)} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required>
                        <option value="">건축주 선택</option>
                        {clients.map(c => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="invoice-project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">프로젝트 *</label>
                      {!showCustomProject ? (
                        <select id="invoice-project" name="project" value={form.project} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required disabled={(typeof form.clientId === 'string' && form.clientId === '') || (typeof form.clientId === 'number' && (form.clientId === 0 || isNaN(form.clientId)))}>
                          <option value="">{(typeof form.clientId === 'string' ? form.clientId !== '' : (form.clientId !== 0 && !isNaN(form.clientId))) ? '프로젝트 선택' : '먼저 건축주를 선택하세요'}</option>
                          {(typeof form.clientId === 'string' ? form.clientId !== '' : (form.clientId !== 0 && !isNaN(form.clientId))) && getClientProjects(form.clientId).map((proj, idx) => (
                            <option key={idx} value={proj}>{proj}</option>
                          ))}
                          {(typeof form.clientId === 'string' ? form.clientId !== '' : (form.clientId !== 0 && !isNaN(form.clientId))) && (
                            <option value="custom">직접 입력</option>
                          )}
                        </select>
                      ) : (
                        <input id="invoice-project" type="text" name="project" value={form.project} onChange={onFormChange} placeholder="프로젝트명을 입력하세요" className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                      )}
                      {showCustomProject && (
                        <button type="button" onClick={() => { setShowCustomProject(false); setForm(prev => ({ ...prev, project: '' })); }} className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">← 목록에서 선택</button>
                      )}
                    </div>
                    <div>
                      <label htmlFor="invoice-workplace" className="block text-sm font-medium text-gray-700 dark:text-gray-300">작업장 *</label>
                      <select id="invoice-workplace" name="workplaceId" value={String(form.workplaceId)} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required disabled={(typeof form.clientId === 'string' && form.clientId === '') || (typeof form.clientId === 'number' && (form.clientId === 0 || isNaN(form.clientId)))}>
                        <option value="">{(typeof form.clientId === 'string' ? form.clientId !== '' : (form.clientId !== 0 && !isNaN(form.clientId))) ? '작업장 선택' : '먼저 건축주를 선택하세요'}</option>
                        {(typeof form.clientId === 'string' ? form.clientId !== '' : (form.clientId !== 0 && !isNaN(form.clientId))) && getClientWorkplaces(form.clientId).map(wp => (
                          <option key={wp.id} value={String(wp.id)}>{wp.name} - {wp.address}</option>
                        ))}
                      </select>
                      {form.workplaceAddress !== '' && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">작업장 주소: {form.workplaceAddress}</div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="invoice-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">발행일</label>
                      <input id="invoice-date" type="date" name="date" value={form.date} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">작업 항목</h4>
                    <button type="button" onClick={addFormItem} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm">+ 항목 추가</button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {form.items.map((it, idx) => (
                      <div key={idx} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div>
                            <label htmlFor={`invoice-item-name-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">내용</label>
                            <input id={`invoice-item-name-${idx}`} name={`invoice-item-name-${idx}`} type="text" value={it.name} onChange={(e) => onFormItemChange(idx, 'name', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" required />
                          </div>
                          <div>
                            <label htmlFor={`invoice-item-category-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">카테고리</label>
                            <select id={`invoice-item-category-${idx}`} name={`invoice-item-category-${idx}`} value={(it.category !== null && it.category !== undefined && it.category !== '') ? it.category : ''} onChange={(e) => onFormItemChange(idx, 'category', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                              <option value="">선택</option>
                              {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`invoice-item-quantity-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">수량</label>
                            <input id={`invoice-item-quantity-${idx}`} name={`invoice-item-quantity-${idx}`} type="text" value={it.quantity === '' ? '' : String(it.quantity)} onChange={(e) => onFormItemChange(idx, 'quantity', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div>
                            <label htmlFor={`invoice-item-unit-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">단위</label>
                            <select id={`invoice-item-unit-${idx}`} name={`invoice-item-unit-${idx}`} value={(it.unit !== null && it.unit !== undefined && it.unit !== '') ? it.unit : ''} onChange={(e) => onFormItemChange(idx, 'unit', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                              <option value="">선택</option>
                              {units.map(unit => (<option key={unit} value={unit}>{unit}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label htmlFor={`invoice-item-unitprice-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">단가</label>
                            <input id={`invoice-item-unitprice-${idx}`} name={`invoice-item-unitprice-${idx}`} type="text" value={it.unitPrice === '' ? '' : String(it.unitPrice)} onChange={(e) => onFormItemChange(idx, 'unitPrice', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div>
                            <label htmlFor={`invoice-item-description-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">상세 설명</label>
                            <textarea id={`invoice-item-description-${idx}`} name={`invoice-item-description-${idx}`} value={(it.description !== null && it.description !== undefined && it.description !== '') ? it.description : ''} onChange={(e) => onFormItemChange(idx, 'description', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm h-8 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="작업 상세 내용"></textarea>
                          </div>
                        </div>
                        {/* 인부임 섹션 */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 mb-2">
                          <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">인부임 정보</div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label htmlFor={`invoice-item-labor-persons-${idx}`} className="block text-xs text-blue-600 dark:text-blue-400 mb-1">인부수</label>
                              <input id={`invoice-item-labor-persons-${idx}`} name={`invoice-item-labor-persons-${idx}`} type="text" value={it.laborPersons === '' ? '' : String(it.laborPersons)} onChange={(e) => onFormItemChange(idx, 'laborPersons', e.target.value)} className="w-full border border-blue-200 dark:border-blue-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="명" />
                            </div>
                            <div>
                              <label htmlFor={`invoice-item-labor-rate-${idx}`} className="block text-xs text-blue-600 dark:text-blue-400 mb-1">단가</label>
                              <input id={`invoice-item-labor-rate-${idx}`} name={`invoice-item-labor-rate-${idx}`} type="text" value={it.laborUnitRate === '' ? '' : String(it.laborUnitRate)} onChange={(e) => onFormItemChange(idx, 'laborUnitRate', e.target.value)} className="w-full border border-blue-200 dark:border-blue-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="원" />
                            </div>
                            <div>
                              <label htmlFor={`invoice-item-labor-persons-general-${idx}`} className="block text-xs text-blue-600 dark:text-blue-400 mb-1">인부수</label>
                              <input id={`invoice-item-labor-persons-general-${idx}`} name={`invoice-item-labor-persons-general-${idx}`} type="text" value={it.laborPersonsGeneral === '' ? '' : String(it.laborPersonsGeneral)} onChange={(e) => onFormItemChange(idx, 'laborPersonsGeneral', e.target.value)} className="w-full border border-blue-200 dark:border-blue-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="명" />
                            </div>
                            <div>
                              <label htmlFor={`invoice-item-labor-rate-general-${idx}`} className="block text-xs text-blue-600 dark:text-blue-400 mb-1">단가</label>
                              <input id={`invoice-item-labor-rate-general-${idx}`} name={`invoice-item-labor-rate-general-${idx}`} type="text" value={it.laborUnitRateGeneral === '' ? '' : String(it.laborUnitRateGeneral)} onChange={(e) => onFormItemChange(idx, 'laborUnitRateGeneral', e.target.value)} className="w-full border border-blue-200 dark:border-blue-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="원" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label htmlFor={`invoice-item-notes-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">비고</label>
                            <input id={`invoice-item-notes-${idx}`} name={`invoice-item-notes-${idx}`} type="text" value={(it.notes !== null && it.notes !== undefined && it.notes !== '') ? it.notes : ''} onChange={(e) => onFormItemChange(idx, 'notes', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div>
                            <label htmlFor={`invoice-item-date-${idx}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">날짜</label>
                            <input id={`invoice-item-date-${idx}`} name={`invoice-item-date-${idx}`} type="date" value={(it.date !== null && it.date !== undefined && it.date !== '') ? it.date : ''} onChange={(e) => onFormItemChange(idx, 'date', e.target.value)} className="w-full border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div>
                            <div className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">합계</div>
                            <div className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100">{(() => {
                              const MIN_VALUE = 0;
                              const total = Number(it.total);
                              return format((total !== MIN_VALUE && !isNaN(total)) ? total : MIN_VALUE);
                            })()}원</div>
                          </div>
                        </div>
                        {form.items.length > 1 && (
                          <div className="mt-2 text-right">
                            <button type="button" onClick={() => removeFormItem(idx)} className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">항목 삭제</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">상태</label>
                      <select name="status" value={form.status} onChange={onFormChange} className="mt-1 block w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        <option value="발송대기">발송대기</option>
                        <option value="발송됨">발송됨</option>
                        <option value="미결제">미결제</option>
                        <option value="결제완료">결제완료</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-300">총 금액</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{format(getFormTotal())}원</div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky 버튼 영역 */}
            <div className="sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-2xl shadow-lg">
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => { setShowForm(false); setShowCustomProject(false); }} className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition font-medium">
                  취소
                </button>
                <button type="submit" form="invoice-form" className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition font-bold">
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
