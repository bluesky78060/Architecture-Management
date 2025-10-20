import React, { useState, useRef, useEffect } from 'react';
import StatsCards from './estimates/StatsCards';
import ConfirmDialog from './ConfirmDialog';
import FilterBar from './estimates/FilterBar';
import EstimatesTable from './estimates/EstimatesTable';
import { Estimate, EstimateItem, EstimateStatus } from '../types/domain';
import type { ID } from '../types/domain';
import { useCalendar } from '../hooks/useCalendar';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';
import { numberToKorean } from '../utils/numberToKorean';
import { useNumberFormat } from '../hooks/useNumberFormat';
import { useFilters } from '../hooks/useFilters';
import { useModalState } from '../hooks/useModalState';
import { TIMEOUT } from '../constants/formatting';

interface UIState {
  selectedIds: ID[];
}

interface ModalState {
  showModal: boolean;
  editingEstimate: Estimate | null;
  printEstimate: Estimate | null;
  showConfirmDelete: boolean;
  noDueDate: boolean;
}

interface NewEstimate {
  clientId: number | string;
  workplaceId: number | string;
  projectName: string;
  title: string;
  validUntil: string;
  category: string;
  status: string;
  notes: string;
  items: EstimateItem[];
}

const Estimates: React.FC = () => {
  const { 
    clients, 
    estimates, 
    setEstimates, 
    convertEstimateToWorkItems,
    companyInfo,
    units,
    categories
  } = useApp();
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  const { format, parse } = useNumberFormat();
  const modals = useModalState();
  
  // Filters and UI state
  const filters = useFilters();
  const [uiState, setUiState] = useState<UIState>({ selectedIds: [] });

  // Consolidated modal state
  const [modalState, setModalState] = useState<ModalState>({
    showModal: false,
    editingEstimate: null,
    printEstimate: null,
    showConfirmDelete: false,
    noDueDate: false
  });

  const [newEstimate, setNewEstimate] = useState<NewEstimate>({
    clientId: '',
    workplaceId: '',
    projectName: '',
    title: '',
    validUntil: '',
    category: '',
    status: '검토중',
    notes: '',
    items: [
      {
        category: '',
        name: '',
        description: '',
        quantity: '',
        unit: '',
        unitPrice: '',
        notes: ''
      }
    ]
  });
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Calendar hook (유효기한)
  const cal = useCalendar({
    value: newEstimate.validUntil,
    onChange: (d: string) => setNewEstimate(prev => ({ ...prev, validUntil: d })),
  });

  // 공백 정규화: 두 칸 이상 연속 공백을 한 칸으로 축소
  const normalizeSpaces = (s: string): string => (s !== '' ? s.replace(/\u00A0/g, ' ').replace(/\s{2,}/g, ' ').trim() : s);

  const CALENDAR_SUNDAY_INDEX = 0;
  const CALENDAR_SATURDAY_INDEX = 6;

  const renderCalendarRows = (): JSX.Element[] => cal.getCalendarGrid().map((row, idx) => (
    <tr key={idx} className="text-left">
      {row.map((d, i2) => {
        const color = i2 === CALENDAR_SUNDAY_INDEX ? 'text-red-600' : i2 === CALENDAR_SATURDAY_INDEX ? 'text-blue-600' : '';
        const clickable = typeof d === 'number' && d !== 0 && !Number.isNaN(d);
        return (
          <td
            key={i2}
            className={`px-2 py-1 ${color} ${clickable ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
            onClick={() => { if (clickable) cal.pickDate(d as number); }}
          >
            {clickable ? d : ''}
          </td>
        );
      })}
    </tr>
  ));

  // 새 항목 추가 시 견적 항목 리스트 내부로 스크롤 이동
  useEffect(() => {
    if (!modals.isOpen('estimateForm')) return;
    const c = itemsContainerRef.current;
    if (c !== null && c !== undefined) c.scrollTop = c.scrollHeight;
  }, [newEstimate.items.length, modals]);

  const statuses = ['검토중', '승인됨', '거부됨', '수정 요청', '작업 전환됨'];

  // 한국어 status를 데이터베이스 영어 값으로 변환
  const toDbStatus = (koreanStatus: string): string => {
    const statusMap: Record<string, string> = {
      '검토중': 'draft',
      '승인됨': 'approved',
      '거부됨': 'rejected',
      '수정 요청': 'sent',
      '작업 전환됨': 'approved',
    };
    return statusMap[koreanStatus] ?? 'draft';
  };

  // Auto-reset modalState.printEstimate state to prevent UI issues
  useEffect(() => {
    if (modalState.printEstimate === null || modalState.printEstimate === undefined) return;
    const timer = setTimeout(() => {
      setModalState(prev => ({ ...prev, printEstimate: null }));
    }, TIMEOUT.AUTO_SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [modalState.printEstimate]);

  // 선택된 건축주의 작업장 목록
  const getClientWorkplaces = (clientId: number | string) => {
    const client = clients.find(c => c.id === parseInt(String(clientId)));
    return client?.workplaces ?? [];
  };

  // 필터링된 견적서 목록
  const filteredEstimates = estimates.filter(estimate => {
    if (filters.selectedClient !== '' && estimate.clientId !== parseInt(filters.selectedClient)) return false;
    if (filters.selectedStatus !== '' && estimate.status !== filters.selectedStatus) return false;
    return true;
  });

  const allVisibleIds = filteredEstimates.map(e => e.id as ID);
  const allSelected = uiState.selectedIds.length > 0 && uiState.selectedIds.length === allVisibleIds.length;
  const toggleSelectAll = (checked: boolean) =>
    setUiState(prev => ({ ...prev, selectedIds: checked ? allVisibleIds : [] }));
  const toggleSelectOne = (id: ID, checked: boolean) =>
    setUiState(prev => ({
      ...prev,
      selectedIds: checked
        ? Array.from(new Set([...(prev.selectedIds ?? []), id]))
        : (prev.selectedIds ?? []).filter(x => x !== id)
    }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const MIN_VALID_ID = 0;
    const parsedId = parseInt(value);
    const newValue = name === 'clientId' || name === 'workplaceId'
      ? (parsedId !== MIN_VALID_ID && !isNaN(parsedId) ? parsedId : MIN_VALID_ID)
      : value;

    setNewEstimate(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };

      if (name === 'clientId') {
        updated.workplaceId = '';
      }
      if (name === 'workplaceId') {
        const client = clients.find(c => c.id === (typeof prev.clientId === 'string' ? parseInt(prev.clientId) : prev.clientId));
        const wp = client?.workplaces?.find(w => w.id === (typeof newValue === 'string' ? parseInt(newValue) : newValue));
        if (updated.projectName === '' && (wp?.description !== null && wp?.description !== undefined && wp?.description !== '')) {
          updated.projectName = wp.description;
        }
      }

      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof EstimateItem | 'category', value: string) => {
    const updatedItems = [...newEstimate.items];
    const MIN_VALUE = 0;
    const BASE_TEN = 10;

    if (field === 'unitPrice' || field === 'quantity') {
      const digits = String(value ?? '').replace(/[^\d-]/g, '');
      if (digits === '' || digits === '-') {
        updatedItems[index][field] = '';
      } else {
        updatedItems[index][field] = parse(value);
      }
      const qParsed = parseInt(String(updatedItems[index].quantity ?? MIN_VALUE), BASE_TEN);
      const pParsed = parseInt(String(updatedItems[index].unitPrice ?? MIN_VALUE), BASE_TEN);
      const q = (qParsed !== MIN_VALUE && !isNaN(qParsed)) ? qParsed : MIN_VALUE;
      const p = (pParsed !== MIN_VALUE && !isNaN(pParsed)) ? pParsed : MIN_VALUE;
      updatedItems[index].total = q * p;
    } else {
      if (
        field === 'name' ||
        field === 'description' ||
        field === 'unit' ||
        field === 'notes' ||
        field === 'category'
      ) {
        // These keys are string fields on EstimateItem or UI-only 'category'
        (updatedItems[index] as unknown as Record<string, unknown>)[field] = value;
      }
    }

    setNewEstimate(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setNewEstimate(prev => ({
      ...prev,
      items: [...prev.items, {
        category: '',
        name: '',
        description: '',
        quantity: '',
        unit: '',
        unitPrice: '',
        notes: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (newEstimate.items.length > 1) {
      setNewEstimate(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = (): number => {
    const MIN_VALUE = 0;
    const BASE_TEN = 10;
    return newEstimate.items.reduce((sum, item) => {
      const qParsed = parseInt(String(item.quantity ?? MIN_VALUE), BASE_TEN);
      const pParsed = parseInt(String(item.unitPrice ?? MIN_VALUE), BASE_TEN);
      const q = (qParsed !== MIN_VALUE && !isNaN(qParsed)) ? qParsed : MIN_VALUE;
      const p = (pParsed !== MIN_VALUE && !isNaN(pParsed)) ? pParsed : MIN_VALUE;
      return sum + (q * p);
    }, MIN_VALUE);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!modalState.noDueDate) {
      if (newEstimate.validUntil === '' || !/^\d{4}-\d{2}-\d{2}$/.test(String(newEstimate.validUntil))) {
        alert('유효기한을 YYYY-MM-DD 형식으로 입력하세요.');
        return;
      }
    }

    const MIN_VALUE = 0;
    const FIRST_ITEM_INDEX = 1;
    for (let i = 0; i < newEstimate.items.length; i++) {
      const it = newEstimate.items[i];
      const q = it.quantity === '' ? MIN_VALUE : Number(it.quantity ?? MIN_VALUE);
      const p = it.unitPrice === '' ? MIN_VALUE : Number(it.unitPrice ?? MIN_VALUE);
      if (q === MIN_VALUE || isNaN(q) || q <= MIN_VALUE) { alert(`항목 #${i + FIRST_ITEM_INDEX}: 수량을 입력하세요.`); return; }
      if (p === MIN_VALUE || isNaN(p) || p <= MIN_VALUE) { alert(`항목 #${i + FIRST_ITEM_INDEX}: 단가를 입력하세요.`); return; }
    }

    const selectedClientData = clients.find(c => c.id === newEstimate.clientId);
    const selectedWorkplaceData = getClientWorkplaces(newEstimate.clientId).find(wp => wp.id === newEstimate.workplaceId);

    const ESTIMATE_ID_PAD_LENGTH = 3;
    const PAD_CHAR = '0';
    const DEFAULT_QUANTITY = 1;
    const estimateData = {
      id: (modalState.editingEstimate !== null && modalState.editingEstimate !== undefined) ? modalState.editingEstimate.id : `EST-${new Date().getFullYear()}-${String(estimates.length + 1).padStart(ESTIMATE_ID_PAD_LENGTH, PAD_CHAR)}`,
      clientId: Number(newEstimate.clientId),
      workplaceId: Number(newEstimate.workplaceId),
      clientName: selectedClientData?.name ?? '',
      workplaceName: selectedWorkplaceData?.name ?? '',
      workplaceAddress: selectedWorkplaceData?.address ?? '',
      date: (modalState.editingEstimate !== null && modalState.editingEstimate !== undefined) ? modalState.editingEstimate.date : new Date().toISOString().split('T')[0],
      totalAmount: calculateTotal(),
      projectName: newEstimate.projectName,
      title: newEstimate.title,
      validUntil: newEstimate.validUntil,
      status: newEstimate.status,
      notes: newEstimate.notes,
      items: newEstimate.items.map((item, index) => {
        const FIRST_INDEX = 1;
        const priceNum = Number(item.unitPrice);
        const qtyNum = Number(item.quantity);
        const price = (priceNum !== MIN_VALUE && !isNaN(priceNum)) ? priceNum : MIN_VALUE;
        const qty = (qtyNum !== MIN_VALUE && !isNaN(qtyNum)) ? qtyNum : DEFAULT_QUANTITY;
        return {
          ...item,
          id: index + FIRST_INDEX,
          total: price * qty
        };
      })
    } as Estimate;

    if (modalState.editingEstimate !== null && modalState.editingEstimate !== undefined) {
      // 이전 상태 백업 (롤백용)
      const previousEstimates = estimates;

      // 수정: UI 즉시 업데이트 (낙관적 업데이트)
      setEstimates(prev => prev.map(est =>
        est.id === modalState.editingEstimate?.id ? estimateData : est
      ));

      // Supabase에도 즉시 업데이트 (estimates + estimate_items)
      try {
        const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) {
        // Supabase 초기화 실패 시 롤백
        setEstimates(previousEstimates);
        alert('데이터베이스 연결에 실패했습니다.');
        return;
      }

        // 1. estimates 테이블 업데이트
        // workplace_id: 0 또는 NaN은 null로 변환
        const validWorkplaceId = (typeof estimateData.workplaceId === 'number' && estimateData.workplaceId > 0 && !isNaN(estimateData.workplaceId))
          ? estimateData.workplaceId
          : null;

        const { data: updatedEstimate, error: estError } = await supabase
          .from('estimates')
          .update({
            client_id: estimateData.clientId,
            client_name: estimateData.clientName ?? '',
            workplace_id: validWorkplaceId,
            workplace_name: estimateData.workplaceName ?? '',
            project_name: estimateData.projectName ?? '',
            title: estimateData.title ?? '',
            date: estimateData.date,
            valid_until: estimateData.validUntil ?? null,
            status: toDbStatus(estimateData.status),
            notes: estimateData.notes ?? '',
            total_amount: estimateData.totalAmount,
          })
          .eq('estimate_number', estimateData.id)
          .select('estimate_id')
          .single();

        if (estError !== null && estError !== undefined) {
          // 오류 발생 시 롤백
          setEstimates(previousEstimates);
          // eslint-disable-next-line no-console
          console.error('견적서 수정 오류 상세:', {
            message: estError.message,
            details: estError.details,
            hint: estError.hint,
            code: estError.code,
            전송데이터: {
              estimate_number: estimateData.id,
              client_id: estimateData.clientId,
              client_name: estimateData.clientName,
              workplace_id: validWorkplaceId,
              workplace_name: estimateData.workplaceName,
              project_name: estimateData.projectName,
              title: estimateData.title,
              date: estimateData.date,
              valid_until: estimateData.validUntil,
              status: estimateData.status,
              notes: estimateData.notes,
              total_amount: estimateData.totalAmount,
            }
          });
          alert(`견적서 수정 중 오류가 발생했습니다: ${estError.message}\n\n콘솔(F12)을 열어 상세 정보를 확인하세요.`);
          return;
        }

        // 2. 기존 estimate_items 삭제
        if (updatedEstimate === null || updatedEstimate === undefined) {
          setEstimates(previousEstimates);
          alert('견적서 수정 중 오류가 발생했습니다.');
          return;
        }

        await supabase
          .from('estimate_items')
          .delete()
          .eq('estimate_id', updatedEstimate.estimate_id);

        // 3. 새로운 estimate_items 삽입
        const FIRST_INDEX = 1;
        const itemsToInsert = estimateData.items.map((item, index) => ({
          estimate_id: updatedEstimate.estimate_id,
          item_id: index + FIRST_INDEX,
          category: item.category ?? '',
          name: item.name,
          description: item.description ?? '',
          quantity: item.quantity ?? 0,
          unit: item.unit ?? '',
          unit_price: item.unitPrice ?? 0,
          total: item.total ?? 0,
          notes: item.notes ?? '',
        }));

        const { error: itemsError } = await supabase
          .from('estimate_items')
          .insert(itemsToInsert);

        if (itemsError !== null && itemsError !== undefined) {
          // 오류 발생 시 롤백
          setEstimates(previousEstimates);
          alert(`견적서 항목 저장 중 오류가 발생했습니다: ${itemsError.message}`);
          return;
        }
      } catch (err) {
        // 예외 발생 시 롤백
        setEstimates(previousEstimates);
        alert('견적서 수정 중 예상치 못한 오류가 발생했습니다.');
        return;
      }
    } else {
      // 이전 상태 백업 (롤백용)
      const previousEstimates = estimates;

      // 생성: UI 즉시 업데이트 (낙관적 업데이트)
      setEstimates(prev => [...prev, estimateData]);

      // Supabase에도 즉시 생성 (estimates + estimate_items)
      try {
        const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) {
        // Supabase 초기화 실패 시 롤백
        setEstimates(previousEstimates);
        alert('데이터베이스 연결에 실패했습니다.');
        return;
      }
        const { getCurrentUserId } = await import('../services/supabase');
        const userId = await getCurrentUserId();

        // 1. estimates 테이블 삽입
        // workplace_id: 0 또는 NaN은 null로 변환
        const validWorkplaceId = (typeof estimateData.workplaceId === 'number' && estimateData.workplaceId > 0 && !isNaN(estimateData.workplaceId))
          ? estimateData.workplaceId
          : null;

        const { data: insertedEstimate, error: estError } = await supabase
          .from('estimates')
          .insert({
            estimate_number: estimateData.id,
            user_id: userId,
            client_id: estimateData.clientId,
            client_name: estimateData.clientName ?? '',
            workplace_id: validWorkplaceId,
            workplace_name: estimateData.workplaceName ?? '',
            project_name: estimateData.projectName ?? '',
            title: estimateData.title ?? '',
            date: estimateData.date,
            valid_until: estimateData.validUntil ?? null,
            status: toDbStatus(estimateData.status),
            notes: estimateData.notes ?? '',
            total_amount: estimateData.totalAmount,
          })
          .select('estimate_id')
          .single();

        if (estError !== null && estError !== undefined) {
          // 오류 발생 시 롤백
          setEstimates(previousEstimates);
          // eslint-disable-next-line no-console
          console.error('견적서 생성 오류 상세:', {
            message: estError.message,
            details: estError.details,
            hint: estError.hint,
            code: estError.code,
            전송데이터: {
              estimate_number: estimateData.id,
              user_id: userId,
              client_id: estimateData.clientId,
              client_name: estimateData.clientName,
              workplace_id: validWorkplaceId,
              workplace_name: estimateData.workplaceName,
              project_name: estimateData.projectName,
              title: estimateData.title,
              date: estimateData.date,
              valid_until: estimateData.validUntil,
              status: estimateData.status,
              notes: estimateData.notes,
              total_amount: estimateData.totalAmount,
            }
          });
          alert(`견적서 생성 중 오류가 발생했습니다: ${estError.message}\n\n콘솔(F12)을 열어 상세 정보를 확인하세요.`);
          return;
        }

        // 2. estimate_items 삽입
        if (insertedEstimate === null || insertedEstimate === undefined) {
          setEstimates(previousEstimates);
          alert('견적서 생성 중 오류가 발생했습니다.');
          return;
        }

        const FIRST_INDEX_INSERT = 1;
        const itemsToInsert = estimateData.items.map((item, index) => ({
          estimate_id: insertedEstimate.estimate_id,
          item_id: index + FIRST_INDEX_INSERT,
          category: item.category ?? '',
          name: item.name,
          description: item.description ?? '',
          quantity: item.quantity ?? 0,
          unit: item.unit ?? '',
          unit_price: item.unitPrice ?? 0,
          total: item.total ?? 0,
          notes: item.notes ?? '',
        }));

        const { error: itemsError } = await supabase
          .from('estimate_items')
          .insert(itemsToInsert);

        if (itemsError !== null && itemsError !== undefined) {
          // 오류 발생 시 롤백
          setEstimates(previousEstimates);
          alert(`견적서 항목 생성 중 오류가 발생했습니다: ${itemsError.message}`);
          return;
        }
      } catch (err) {
        // 예외 발생 시 롤백
        setEstimates(previousEstimates);
        alert('견적서 생성 중 예상치 못한 오류가 발생했습니다.');
        return;
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewEstimate({
      clientId: '',
      workplaceId: '',
      projectName: '',
      title: '',
      validUntil: '',
      category: '',
      status: '검토중',
      notes: '',
      items: [
        {
          category: '',
          name: '',
          description: '',
          quantity: '',
          unit: '',
          unitPrice: '',
          notes: ''
        }
      ]
    });
    setModalState(prev => ({ ...prev, editingEstimate: null }));
    modals.close('estimateForm');
  };

  const handleEdit = (estimate: Estimate) => {
    setNewEstimate({
      clientId: estimate.clientId,
      workplaceId: (estimate.workplaceId !== null && estimate.workplaceId !== undefined && estimate.workplaceId !== 0 && !isNaN(estimate.workplaceId)) ? estimate.workplaceId : '',
      projectName: (estimate.projectName !== null && estimate.projectName !== undefined && estimate.projectName !== '') ? estimate.projectName : '',
      title: (estimate.title !== null && estimate.title !== undefined && estimate.title !== '') ? estimate.title : '',
      validUntil: estimate.validUntil ?? '',
      category: '',
      status: estimate.status,
      notes: (estimate.notes !== null && estimate.notes !== undefined && estimate.notes !== '') ? estimate.notes : '',
      items: estimate.items.map(item => ({
        category: item.category,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        notes: (item.notes !== null && item.notes !== undefined && item.notes !== '') ? item.notes : ''
      }))
    });

    setModalState(prev => ({
      ...prev,
      editingEstimate: estimate,
      noDueDate: estimate.validUntil === '' || estimate.validUntil === null || estimate.validUntil === undefined
    }));
    modals.open('estimateForm');
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<ID | null>(null);
  const [pendingConvertId, setPendingConvertId] = useState<ID | null>(null);

  const handleDelete = (id: ID) => {
    setPendingDeleteId(id);
  };

  const handleBulkDelete = async () => {
    if (uiState.selectedIds.length === 0) return;

    // UI에서 즉시 제거
    setEstimates(prev => prev.filter(est => !uiState.selectedIds.includes(est.id)));
    setUiState(prev => ({ ...prev, selectedIds: [] }));
    setModalState(prev => ({ ...prev, showConfirmDelete: false }));

    // Supabase에서도 즉시 삭제 (estimate_items도 CASCADE로 자동 삭제됨)
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) return;
      const { error} = await supabase
        .from('estimates')
        .delete()
        .in('estimate_number', uiState.selectedIds);

      if (error !== null && error !== undefined) {
        // 오류 발생
      }
    } catch (err) {
      // 실패
    }
  };

  const handleConvertToWorkItems = (estimateId: ID) => {
    setPendingConvertId(estimateId);
  };

  const confirmDeleteSingle = async () => {
    if (pendingDeleteId == null) return;

    // UI에서 즉시 제거
    setEstimates(prev => prev.filter(estimate => estimate.id !== String(pendingDeleteId)));
    setPendingDeleteId(null);

    // Supabase에서도 즉시 삭제 (estimate_items도 CASCADE로 자동 삭제됨)
    try {
      const { supabase } = await import('../services/supabase');
      if (supabase === null || supabase === undefined) return;
      const { error } = await supabase
        .from('estimates')
        .delete()
        .eq('estimate_number', pendingDeleteId);

      if (error !== null && error !== undefined) {
        // 오류 발생
      }
    } catch (err) {
      // 실패
    }
  };

  const confirmConvertSingle = () => {
    if (pendingConvertId == null) return;
    const convertedItems = convertEstimateToWorkItems(String(pendingConvertId));
    setPendingConvertId(null);
    alert(`${convertedItems.length}개의 작업 항목이 생성되었습니다.`);
    navigate('/work-items');
  };

  const handlePrint = (estimate: Estimate) => {
    try {
      const payload = { estimate, companyInfo };
      try { localStorage.setItem('quotationPrintData', JSON.stringify(payload)); } catch (_) {}
      const estimateJson = JSON.stringify(payload);
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
      const quotationUrl = `${resolveBaseUrl()}/quotation-output.html?id=${estimate.id}&data=${encodeURIComponent(estimateJson)}`;
      const printWindow = window.open(quotationUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      const FOCUS_DELAY_MS = 500;
      if (printWindow === null || printWindow === undefined) { alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.'); return; }
      setTimeout(() => { try { printWindow.focus(); } catch (_) {} }, FOCUS_DELAY_MS);
    } catch (_) {
      alert('출력 화면을 여는 중 오류가 발생했습니다.');
    }
  };

  const handleExportToExcel = () => {
    exportToExcel.estimates(estimates);
  };

  const handleImportFromExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file === null || file === undefined) return;

    try {
      const importedEstimates = await importFromExcel.estimates(file);
      setEstimates(prev => {
        const MIN_VALUE = 0;
        const normalized = (importedEstimates ?? []).map((e: Partial<Estimate>, idx: number) => ({
          id: String(e?.id ?? `EST-IMP-${Date.now()}-${idx}`),
          clientId: Number(e?.clientId ?? MIN_VALUE),
          clientName: e?.clientName ?? '',
          workplaceId: (e?.workplaceId !== null && e?.workplaceId !== undefined) ? Number(e.workplaceId) : undefined,
          workplaceName: e?.workplaceName ?? '',
          workplaceAddress: e?.workplaceAddress ?? '',
          projectName: e?.projectName ?? '',
          title: (e?.title !== null && e?.title !== undefined && e?.title !== '') ? e.title : ((e?.projectName !== null && e?.projectName !== undefined && e?.projectName !== '') ? e.projectName : '견적'),
          date: e?.date,
          validUntil: e?.validUntil,
          status: (e?.status as EstimateStatus) ?? '임시저장',
          totalAmount: Number(e?.totalAmount ?? MIN_VALUE),
          notes: e?.notes ?? '',
          items: Array.isArray(e?.items)
            ? e.items.map((it: Partial<EstimateItem>) => ({
                category: it?.category,
                name: String(it?.name ?? ''),
                description: it?.description,
                quantity: typeof it?.quantity === 'number' || it?.quantity === '' ? it.quantity : MIN_VALUE,
                unit: it?.unit,
                unitPrice: typeof it?.unitPrice === 'number' || it?.unitPrice === '' ? it.unitPrice : MIN_VALUE,
                total: typeof it?.total === 'number' ? it.total : undefined,
                notes: it?.notes,
              }))
            : [],
        }));
        return [...prev, ...normalized];
      });
      alert(`${importedEstimates.length}개의 견적서를 성공적으로 가져왔습니다.`);
    } catch (error) {
      alert('파일을 가져오는 중 오류가 발생했습니다.');
    }

    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    createTemplate.estimates();
  };

  const handleStatusChange = (id: ID, newStatus: string) => {
    setEstimates(prev => prev.map(est =>
      est.id === id ? { ...est, status: newStatus as EstimateStatus } : est
    ));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '검토중': 'bg-yellow-100 text-yellow-800',
      '승인됨': 'bg-green-100 text-green-800',
      '거부됨': 'bg-red-100 text-red-800',
      '수정 요청': 'bg-blue-100 text-blue-800',
      '작업 전환됨': 'bg-purple-100 text-purple-800'
    };
    return (colors[status] !== null && colors[status] !== undefined && colors[status] !== '') ? colors[status] : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">견적서 관리</h1>
            <p className="text-gray-600 dark:text-gray-300">건축주별 견적서를 관리하고 작업 항목으로 변환하세요</p>
          </div>
          <div className="flex space-x-2">
            {uiState.selectedIds.length > 0 && (
              <button
                onClick={() => modals.open('confirmDelete')}
                className="flex items-center justify-center px-4 py-2.5 bg-white border border-red-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium"
              >
                <span className="text-red-600 mr-2">🗑️</span>
                <span className="text-xs font-semibold">삭제 ({uiState.selectedIds.length})</span>
              </button>
            )}

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 dark:text-gray-200 font-medium"
            >
              <span className="text-gray-500 dark:text-gray-400 mr-2">📁</span>
              <span className="text-xs font-semibold">템플릿 다운로드</span>
            </button>

            <button
              onClick={handleExportToExcel}
              className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 dark:text-gray-200 font-medium"
            >
              <span className="text-green-500 dark:text-green-400 mr-2">📥</span>
              <span className="text-xs font-semibold">Excel 내보내기</span>
            </button>

            <label className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 dark:text-gray-200 font-medium cursor-pointer">
              <span className="text-blue-500 dark:text-blue-400 mr-2">📤</span>
              <span className="text-xs font-semibold">Excel 가져오기</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFromExcel}
                className="hidden"
              />
            </label>

            <button
              onClick={() => { setModalState(prev => ({ ...prev, editingEstimate: null })); modals.open('estimateForm'); }}
              className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-300 font-bold"
            >
              <span className="text-yellow-300 mr-2">✨</span>
              <span className="text-xs font-bold">새 견적서</span>
            </button>
          </div>
        </div>
      </div>

      <StatsCards items={filteredEstimates} format={format} />

      <FilterBar
        clients={clients}
        statuses={statuses}
        selectedClient={filters.selectedClient}
        selectedStatus={filters.selectedStatus}
        filteredCount={filteredEstimates.length}
        totalCount={estimates.length}
        onChangeClient={(val) => filters.setSelectedClient(val)}
        onChangeStatus={(val) => filters.setSelectedStatus(val)}
        onReset={() => { filters.reset(); setUiState({ selectedIds: [] }); }}
      />

      <EstimatesTable
        items={filteredEstimates}
        allSelected={allSelected}
        onToggleAll={toggleSelectAll}
        onToggleOne={toggleSelectOne}
        format={format}
        getStatusColor={getStatusColor}
        onEdit={handleEdit}
        onPrint={handlePrint}
        onDelete={handleDelete}
        onConvert={handleConvertToWorkItems}
        onStatusChange={handleStatusChange}
        selectedIds={uiState.selectedIds}
        statuses={statuses}
      />

      {modals.isOpen('confirmDelete') && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">선택 삭제</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">선택된 {uiState.selectedIds.length}개의 견적서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => modals.close('confirmDelete')}>취소</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={handleBulkDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="견적서 삭제"
        message={`이 견적서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmDeleteSingle}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmDialog
        open={pendingConvertId != null}
        title="작업 항목으로 변환"
        message={`이 견적서를 작업 항목으로 변환하시겠습니까?`}
        confirmText="변환"
        cancelText="취소"
        onConfirm={confirmConvertSingle}
        onCancel={() => setPendingConvertId(null)}
      />

      {/* 견적서 추가/편집 모달 */}
      {modals.isOpen('estimateForm') && (
        <div className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-6 mx-auto w-[1100px] max-w-[96vw] shadow-2xl rounded-2xl bg-white/80 dark:bg-gray-800/80 ring-1 ring-black/5">
            <div className="rounded-t-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:bg-gradient-to-br dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 px-8 pt-8 pb-6 text-center">
              <h3 className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                {(modalState.editingEstimate !== null && modalState.editingEstimate !== undefined) ? '견적서 편집' : '새 견적서 작성'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">견적 기본정보와 항목을 입력하세요</p>
            </div>
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* 기본 정보 */}
                <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-4">
                  <div className="flex items-center mb-3 gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">📄</span>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">기본 정보</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">건축주</label>
                      <select
                        name="clientId"
                        value={newEstimate.clientId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">건축주 선택</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">작업장</label>
                      <select
                        name="workplaceId"
                        value={newEstimate.workplaceId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        disabled={typeof newEstimate.clientId === 'string' ? newEstimate.clientId === '' : newEstimate.clientId === 0 || isNaN(newEstimate.clientId)}
                      >
                        <option value="">{(typeof newEstimate.clientId === 'string' ? newEstimate.clientId !== '' : newEstimate.clientId !== 0 && !isNaN(newEstimate.clientId)) ? '작업장 선택' : '작업장 선택(먼저 건축주를 선택하세요)'}</option>
                        {(typeof newEstimate.clientId === 'string' ? newEstimate.clientId !== '' : newEstimate.clientId !== 0 && !isNaN(newEstimate.clientId)) && getClientWorkplaces(newEstimate.clientId).map(workplace => (
                          <option key={workplace.id} value={workplace.id}>
                            {workplace.name} - {workplace.address}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">프로젝트명</label>
                      <input
                        type="text"
                        name="projectName"
                        value={newEstimate.projectName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">견적서 제목</label>
                      <input
                        type="text"
                        name="title"
                        value={newEstimate.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">유효기한</label>
                      <div className="mt-1 relative inline-block" ref={cal.containerRef}>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            name="validUntil"
                            value={newEstimate.validUntil}
                            onChange={handleInputChange}
                            placeholder="YYYY-MM-DD"
                            inputMode="numeric"
                            className="block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                            onFocus={() => !modalState.noDueDate && cal.setOpen(true)}
                            disabled={modalState.noDueDate}
                            required={!modalState.noDueDate}
                          />
                          <button
                            type="button"
                            className="px-2 py-2 text-gray-600 hover:text-gray-800"
                            onClick={() => !modalState.noDueDate && cal.setOpen((v) => !v)}
                            title="달력 열기"
                            disabled={modalState.noDueDate}
                          >
                            📅
                          </button>
              <label className="flex items-center gap-1 text-xs text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={modalState.noDueDate}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setModalState(prev => ({ ...prev, noDueDate: checked }));
                    if (checked) {
                      cal.setOpen(false);
                      setNewEstimate(prev => ({ ...prev, validUntil: '' }));
                    }
                  }}
                />
                유효기간 선택 안함
              </label>
              {modalState.noDueDate && (
                <div className="text-[11px] text-gray-500 mt-1">
                  유효기한 없이 발행됩니다. 견적 조건을 비고에 명시하세요.
                </div>
              )}
                        </div>
                        {cal.open && (
                          <div
                            className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-2 p-3"
                            style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={cal.prevMonth}>◀</button>
                              <div className="text-sm font-medium">
                                {cal.month.getFullYear()}년 {cal.month.getMonth() + 1}월
                              </div>
                              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={cal.nextMonth}>▶</button>
                            </div>
                            <table className="text-xs select-none">
                              <thead>
                                <tr className="text-left text-gray-600">
                                  {['일','월','화','수','목','금','토'].map((d, idx) => (
                                    <th key={d} className={`px-2 py-1 ${idx === CALENDAR_SUNDAY_INDEX ? 'text-red-600' : idx === CALENDAR_SATURDAY_INDEX ? 'text-blue-600' : ''}`}>{d}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {renderCalendarRows()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상태</label>
                      <div className="flex flex-wrap gap-1.5">
                        {statuses.map((s) => {
                          const active = newEstimate.status === s;
                          const classes = active
                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-transparent shadow'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600';
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setNewEstimate(prev => ({ ...prev, status: s }))}
                              className={`px-3 py-1.5 rounded-full text-sm transition ${classes}`}
                              aria-pressed={active}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 견적 항목들 */}
                <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400">🗂️</span>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">견적 항목</h4>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  
                  <div ref={itemsContainerRef} className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {newEstimate.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">항목 #{index + 1}</span>
                          {newEstimate.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">카테고리</label>
                            <select
                              value={item.category}
                              onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            >
                              <option value="">카테고리 선택</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">내용</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">설명</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">수량</label>
                            <input
                              type="text"
                              value={item.quantity === '' ? '' : format(Number(item.quantity))}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="0"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">단가</label>
                            <input
                              type="text"
                              value={(typeof item.unitPrice === 'number' && item.unitPrice !== 0 && !isNaN(item.unitPrice)) ? format(Number(item.unitPrice)) : ''}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="0"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">단위</label>
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            >
                              <option value="">단위 선택</option>
                              {units.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">합계</label>
                            <div className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm">
                              {(() => {
                                const MIN_VALUE = 0;
                                const DEFAULT_QUANTITY = 1;
                                const priceNum = Number(item.unitPrice);
                                const qtyNum = Number(item.quantity);
                                const price = (priceNum !== MIN_VALUE && !isNaN(priceNum)) ? priceNum : MIN_VALUE;
                                const qty = (qtyNum !== MIN_VALUE && !isNaN(qtyNum)) ? qtyNum : DEFAULT_QUANTITY;
                                return format(price * qty);
                              })()}원
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">비고</label>
                          <textarea
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            rows={2}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded">
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        총 견적 금액: {format(calculateTotal())}원
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">특이사항 및 조건</label>
                  <textarea
                    name="notes"
                    value={newEstimate.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="부가세 별도, 설계 변경 시 추가 견적 등..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow"
                  >
                    {(modalState.editingEstimate !== null && modalState.editingEstimate !== undefined) ? '수정' : '작성'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF 인쇄용 숨겨진 컴포넌트 (Tailwind 템플릿) */}
      <div style={{ display: 'none' }}>
        {(modalState.printEstimate !== null && modalState.printEstimate !== undefined) && (
          <div ref={componentRef} className="max-w-4xl mx-auto p-6 text-gray-800">
            <div className="bg-white shadow-xl rounded-xl">
              {/* Header */}
              <header className="p-6 border-b border-gray-200 relative overflow-hidden">
                <div className="absolute -top-16 -left-16 w-40 h-40 bg-blue-500/10 rounded-full" aria-hidden="true"></div>
                <div className="absolute -bottom-24 -right-12 w-40 h-40 bg-blue-500/10 rounded-full rotate-45" aria-hidden="true"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-extrabold text-blue-600">견적서 (Quotation)</h2>
                  <p className="mt-2 text-sm text-gray-500">Quotation ID: {modalState.printEstimate.id}</p>
                  <p className="text-sm text-gray-500">Date: {modalState.printEstimate.date}</p>
                </div>
              </header>

              {/* Info panels */}
              <section className="grid md:grid-cols-2 gap-4 p-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 border-b-2 border-blue-500 pb-1">발주처 정보 (Client)</h3>
                  <div className="space-y-1 text-sm leading-5">
                    <p><strong>건축주명:</strong> {normalizeSpaces(String(modalState.printEstimate.clientName ?? ''))}</p>
                    <p><strong>프로젝트명:</strong> {modalState.printEstimate.projectName ?? '-'}</p>
                    <p><strong>작업장 주소:</strong> {modalState.printEstimate.workplaceAddress ?? '-'}</p>
                    {(modalState.printEstimate.validUntil !== null && modalState.printEstimate.validUntil !== undefined && modalState.printEstimate.validUntil !== '') && (<p><strong>유효기한:</strong> {modalState.printEstimate.validUntil}</p>)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 border-b-2 border-blue-500 pb-1">시공업체 정보 (Contractor)</h3>
                  <div className="space-y-1 text-sm leading-5">
                    <p><strong>업체명:</strong> {companyInfo.name}</p>
                    {(companyInfo.representative !== null && companyInfo.representative !== undefined && companyInfo.representative !== '') && (<p><strong>대표자:</strong> {companyInfo.representative}</p>)}
                    {(companyInfo.phone !== null && companyInfo.phone !== undefined && companyInfo.phone !== '') && (<p><strong>연락처:</strong> {companyInfo.phone}</p>)}
                    {(companyInfo.address !== null && companyInfo.address !== undefined && companyInfo.address !== '') && (<p><strong>주소:</strong> {companyInfo.address}</p>)}
                    {(companyInfo.businessNumber !== null && companyInfo.businessNumber !== undefined && companyInfo.businessNumber !== '') && (<p><strong>사업자번호:</strong> {companyInfo.businessNumber}</p>)}
                  </div>
                </div>
              </section>

              {/* Items table */}
              <section className="p-6 pt-0">
                <h3 className="text-xl font-bold text-gray-900 mb-3">견적 내역 (Quotation Details)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 font-semibold text-gray-700">순번</th>
                        <th className="p-3 font-semibold text-gray-700">구분</th>
                        <th className="p-3 font-semibold text-gray-700 w-1/3">공종 및 내용</th>
                        <th className="p-3 font-semibold text-gray-700">수량</th>
                        <th className="p-3 font-semibold text-gray-700">단위</th>
                        <th className="p-3 font-semibold text-gray-700 text-right">단가</th>
                        <th className="p-3 font-semibold text-gray-700 text-right">금액</th>
                        <th className="p-3 font-semibold text-gray-700">비고</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(modalState.printEstimate.items ?? []).map((item, idx) => {
                        const MIN_VALUE = 0;
                        const FIRST_INDEX = 1;
                        const qtyNum = Number(item.quantity);
                        const priceNum = Number(item.unitPrice);
                        const qty = (qtyNum !== MIN_VALUE && !isNaN(qtyNum)) ? qtyNum : MIN_VALUE;
                        const price = (priceNum !== MIN_VALUE && !isNaN(priceNum)) ? priceNum : MIN_VALUE;
                        const total = qty * price;
                        return (
                          <tr key={idx}>
                            <td className="p-3">{idx + FIRST_INDEX}</td>
                            <td className="p-3">{item.category ?? '-'}</td>
                            <td className="p-3">
                              <div className="font-medium">{item.name}</div>
                              {(item.description !== null && item.description !== undefined && item.description !== '') && (<div className="text-xs text-gray-500">{item.description}</div>)}
                            </td>
                            <td className="p-3">{qty}</td>
                            <td className="p-3">{item.unit ?? '-'}</td>
                            <td className="p-3 text-right">{format(price)}원</td>
                            <td className="p-3 text-right">{format(total)}원</td>
                            <td className="p-3">{item.notes ?? ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="p-3 text-right font-bold" colSpan={6}>총 합계</td>
                        <td className="p-3 text-right font-bold">{format(calculateTotal())}원</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* Total in Korean + notes */}
              <section className="px-6 pb-6">
                <div className="mt-3 text-sm text-gray-700 font-semibold">
                  총 견적금액 : 금 {numberToKorean(modalState.printEstimate.totalAmount)} 원정
                </div>
                {(modalState.printEstimate.notes !== null && modalState.printEstimate.notes !== undefined && modalState.printEstimate.notes !== '') && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-1">특이사항 및 조건</h4>
                    <div className="text-sm whitespace-pre-wrap">{modalState.printEstimate.notes}</div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estimates;
