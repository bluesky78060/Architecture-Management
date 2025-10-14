import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useSelection } from '../hooks/useSelection';
import { Client } from '../types/domain';
import type { Id } from '../hooks/useSelection';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';
import Tooltip from './Tooltip';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { PHONE_FORMAT, BUSINESS_NUMBER_FORMAT } from '../constants/formatting';

interface BusinessInfo {
  businessName: string;
  representative: string;
  businessNumber: string;
  businessType: string;
  businessItem: string;
  businessAddress: string;
  taxEmail: string;
}

interface Workplace {
  id?: string | number;
  name: string;
  address?: string;
  description?: string;
}

interface NewClient {
  type: 'PERSON' | 'BUSINESS';
  name: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  notes: string;
  business: BusinessInfo;
  workplaces: Workplace[];
}

// 한국 전화번호 자동 하이픈 포매터
function formatPhoneKR(input: string): string {
  const digits = String(input !== '' ? input : '').replace(/\D/g, '');
  if (digits.startsWith('02')) {
    if (digits.length <= PHONE_FORMAT.SEOUL_AREA_CODE_LENGTH) return digits;
    if (digits.length <= PHONE_FORMAT.MIN_DIGITS_FOR_AREA_CODE + PHONE_FORMAT.SEOUL_AREA_CODE_LENGTH) {
      return `${digits.slice(0, PHONE_FORMAT.SEOUL_AREA_CODE_LENGTH)}-${digits.slice(PHONE_FORMAT.SEOUL_AREA_CODE_LENGTH)}`;
    }
    if (digits.length <= PHONE_FORMAT.SEOUL_DIGITS_THRESHOLD) {
      return `${digits.slice(0, PHONE_FORMAT.SEOUL_AREA_CODE_LENGTH)}-${digits.slice(PHONE_FORMAT.SEOUL_MIDDLE_START, digits.length - PHONE_FORMAT.LAST_FOUR_DIGITS)}-${digits.slice(digits.length - PHONE_FORMAT.LAST_FOUR_DIGITS)}`;
    }
    return `${digits.slice(0, PHONE_FORMAT.SEOUL_AREA_CODE_LENGTH)}-${digits.slice(PHONE_FORMAT.SEOUL_MIDDLE_START, PHONE_FORMAT.SEOUL_MIDDLE_END)}-${digits.slice(PHONE_FORMAT.SEOUL_MIDDLE_END, PHONE_FORMAT.SEOUL_TOTAL_MAX)}`; // 02-xxxx-xxxx
  }
  // 모바일(010 등) 및 기타 지역번호(3자리)
  if (digits.length <= PHONE_FORMAT.STANDARD_AREA_CODE_LENGTH) return digits;
  if (digits.length <= PHONE_FORMAT.MIN_DIGITS_FOR_FIRST_HYPHEN) {
    return `${digits.slice(0, PHONE_FORMAT.STANDARD_AREA_CODE_LENGTH)}-${digits.slice(PHONE_FORMAT.STANDARD_AREA_CODE_LENGTH)}`;
  }
  if (digits.length <= PHONE_FORMAT.MAX_PHONE_DIGITS) {
    return `${digits.slice(0, PHONE_FORMAT.STANDARD_AREA_CODE_LENGTH)}-${digits.slice(PHONE_FORMAT.STANDARD_AREA_CODE_LENGTH, digits.length - PHONE_FORMAT.LAST_FOUR_DIGITS)}-${digits.slice(digits.length - PHONE_FORMAT.LAST_FOUR_DIGITS)}`;
  }
  return `${digits.slice(0, PHONE_FORMAT.STANDARD_AREA_CODE_LENGTH)}-${digits.slice(PHONE_FORMAT.STANDARD_MIDDLE_START, PHONE_FORMAT.STANDARD_MIDDLE_END)}-${digits.slice(PHONE_FORMAT.STANDARD_MIDDLE_END, PHONE_FORMAT.MAX_PHONE_DIGITS)}`; // 최대 11자리
}

const Clients: React.FC = () => {
  const { clients, setClients, invoices, workItems } = useApp();
  const allClientIds = useMemo(() => clients.map(c => c.id), [clients]);
  const selection = useSelection(allClientIds);

  const [showModal, setShowModal] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const bizNameInputRef = useRef<HTMLInputElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  // BUSINESS 선택 시 일반 주소(연락처/주소 카드의 주소)를 별도로 받을지 여부
  const [showAltAddress, setShowAltAddress] = useState<boolean>(false);
  const [newClient, setNewClient] = useState<NewClient>({
    type: 'PERSON',
    name: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    notes: '',
    business: {
      businessName: '',
      representative: '',
      businessNumber: '',
      businessType: '',
      businessItem: '',
      businessAddress: '',
      taxEmail: ''
    },
    workplaces: [{ name: '', address: '', description: '' }]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // 일괄 선택/삭제 상태 및 핸들러
  const allSelected = selection.allSelected;
  const toggleSelectAll = (checked: boolean) => selection.toggleAll(checked);
  const toggleSelectOne = (id: Id, checked: boolean) => selection.toggleOne(id, checked);
  
  /** 선택된 건축주 일괄 삭제 */
  const handleBulkDelete = () => {
    if (selection.selected.length === 0) return;
    setClients(prev => prev.filter(c => !selection.selected.includes(c.id)));
    selection.clear();
    setShowConfirmDelete(false);
  };

  /** 개별 건축주 삭제 */
  const handleDelete = (id: Id) => {
    if (window.confirm('이 건축주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  // Excel 관련 함수들
  const handleExportToExcel = () => {
    exportToExcel.clients(clients);
  };

  const handleImportFromExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file !== null && file !== undefined) {
      try {
        const importedClients = await importFromExcel.clients(file);
        setClients(prev => {
          const baseMax = prev.length > 0 ? Math.max(...prev.map(c => (Number(c.id) !== 0 ? Number(c.id) : 0))) : 0;
          const normalized = (importedClients !== null && importedClients !== undefined ? importedClients : []).map((c: Partial<Client>, idx: number) => {
            const workplaces = Array.isArray(c?.workplaces)
              ? c.workplaces.map((wp: Partial<Workplace>, i: number) => ({
                  id: Number(wp?.id ?? i + 1),
                  name: String(wp?.name !== '' && wp?.name !== null && wp?.name !== undefined ? wp.name : ''),
                  address: wp?.address !== '' && wp?.address !== null && wp?.address !== undefined ? wp.address : '',
                  description: wp?.description !== '' && wp?.description !== null && wp?.description !== undefined ? wp.description : '',
                }))
              : [];
            return {
              id: Number(c?.id ?? baseMax + idx + 1),
              name: String(c?.name !== '' && c?.name !== null && c?.name !== undefined ? c.name : ''),
              phone: c?.phone !== '' && c?.phone !== null && c?.phone !== undefined ? c.phone : '',
              mobile: c?.mobile !== '' && c?.mobile !== null && c?.mobile !== undefined ? c.mobile : '',
              email: c?.email !== '' && c?.email !== null && c?.email !== undefined ? c.email : '',
              address: c?.address !== '' && c?.address !== null && c?.address !== undefined ? c.address : '',
              type: c?.type,
              business: c?.business,
              workplaces,
              projects: Array.isArray(c?.projects) ? c.projects.map((p: unknown) => String(p !== '' && p !== null && p !== undefined ? p : '').trim()).filter((s): s is string => s !== '') : [],
              totalBilled: Number(c?.totalBilled !== 0 && c?.totalBilled !== null && c?.totalBilled !== undefined ? c.totalBilled : 0),
              outstanding: Number(c?.outstanding !== 0 && c?.outstanding !== null && c?.outstanding !== undefined ? c.outstanding : 0),
              notes: c?.notes !== '' && c?.notes !== null && c?.notes !== undefined ? c.notes : '',
            } as Client;
          });
          return [...prev, ...normalized];
        });
        alert(`${importedClients.length}개의 건축주 정보를 가져왔습니다.`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        alert('Excel 파일을 가져오는 중 오류가 발생했습니다: ' + msg);
      }
      // 파일 입력 초기화
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    createTemplate.clients();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const next = (name === 'phone' || name === 'mobile') ? formatPhoneKR(value) : value;
    setNewClient(prev => ({
      ...prev,
      [name]: next
    }));
  };

  // 개인/사업자 전환 시 필드 자연스러운 이관
  const handleTypeChange = (type: 'PERSON' | 'BUSINESS') => {
    setNewClient(prev => {
      // 개인 -> 사업자: 이름을 상호로 이관(상호가 비어 있을 때에만)
      if (type === 'BUSINESS') {
        // 사업자로 전환 시, 기본값으로 일반 주소 입력은 숨김
        setShowAltAddress(false);
        const businessName = (prev.business?.businessName !== '' && prev.business?.businessName !== null && prev.business?.businessName !== undefined)
          ? prev.business.businessName
          : (prev.name !== '' && prev.name !== null && prev.name !== undefined ? prev.name : '');
        return {
          ...prev,
          type: 'BUSINESS',
          business: {
            ...prev.business,
            businessName
          }
        };
      }
      // 사업자 -> 개인: 상호를 이름으로 이관(이름이 비어 있을 때에만)
      if (type === 'PERSON') {
        // 개인 전환 시에는 일반 주소 입력을 다시 노출
        setShowAltAddress(false);
        const name = (prev.name !== '' && prev.name !== null && prev.name !== undefined)
          ? prev.name
          : (prev.business?.businessName !== '' && prev.business?.businessName !== null && prev.business?.businessName !== undefined ? prev.business.businessName : '');
        return {
          ...prev,
          type: 'PERSON',
          name
        };
      }
      return { ...prev, type };
    });
    // 전환 후 적절한 필드로 포커스 이동
    setTimeout(() => {
      if (type === 'BUSINESS') bizNameInputRef.current?.focus();
      if (type === 'PERSON') nameInputRef.current?.focus();
    }, 0);
  };

  const formatBizNo = (val: string): string => {
    const d = String(val !== '' ? val : '').replace(/\D/g, '').slice(0, BUSINESS_NUMBER_FORMAT.MAX_DIGITS);
    if (d.length <= BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH) return d;
    if (d.length <= BUSINESS_NUMBER_FORMAT.SECOND_PART_LENGTH) {
      return `${d.slice(0, BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH)}-${d.slice(BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH)}`;
    }
    return `${d.slice(0, BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH)}-${d.slice(BUSINESS_NUMBER_FORMAT.FIRST_PART_LENGTH, BUSINESS_NUMBER_FORMAT.SECOND_PART_LENGTH)}-${d.slice(BUSINESS_NUMBER_FORMAT.SECOND_PART_LENGTH)}`;
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const v = name === 'businessNumber' ? formatBizNo(value) : value;
    setNewClient(prev => ({
      ...prev,
      business: {
        ...prev.business,
        [name]: v
      }
    }));
  };

  // BUSINESS + 별도 주소 미사용 시, 일반 주소를 사업장 주소와 동기화
  useEffect(() => {
    if (newClient?.type === 'BUSINESS' && showAltAddress === false) {
      const bizAddr = newClient?.business?.businessAddress !== '' && newClient?.business?.businessAddress !== null && newClient?.business?.businessAddress !== undefined ? newClient.business.businessAddress : '';
      if ((newClient.address !== '' && newClient.address !== null && newClient.address !== undefined ? newClient.address : '') !== bizAddr) {
        setNewClient(prev => ({ ...prev, address: bizAddr }));
      }
    }
  }, [newClient?.type, showAltAddress, newClient?.business?.businessAddress, newClient.address]);

  const handleWorkplaceChange = (index: number, field: keyof Workplace, value: string) => {
    const updatedWorkplaces = [...newClient.workplaces];
    updatedWorkplaces[index] = { ...(updatedWorkplaces[index] !== null && updatedWorkplaces[index] !== undefined ? updatedWorkplaces[index] : {}), [field]: value } as Workplace;
    setNewClient(prev => ({
      ...prev,
      workplaces: updatedWorkplaces
    }));
  };

  const addWorkplace = () => {
    setNewClient(prev => ({
      ...prev,
      workplaces: [...prev.workplaces, { name: '', address: '', description: '' }]
    }));
  };

  const removeWorkplace = (index: number) => {
    if (newClient.workplaces.length > 1) {
      const updatedWorkplaces = newClient.workplaces.filter((_, i) => i !== index);
      setNewClient(prev => ({
        ...prev,
        workplaces: updatedWorkplaces
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { ...newClient };
    if (payload.type === 'BUSINESS') {
      // 기본 표시 이름 보정: 상호를 이름으로 사용
      if ((payload.name === '' || payload.name === null || payload.name === undefined) &&
          payload.business?.businessName !== '' && payload.business?.businessName !== null && payload.business?.businessName !== undefined) {
        payload.name = payload.business.businessName;
      }
      // 간단한 사업자번호 길이 검증(선택): 10자리 숫자
      const digits = String(payload.business?.businessNumber !== '' && payload.business?.businessNumber !== null && payload.business?.businessNumber !== undefined ? payload.business.businessNumber : '').replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== BUSINESS_NUMBER_FORMAT.MAX_DIGITS) {
        alert('사업자등록번호는 숫자 10자리여야 합니다.');
        return;
      }
    }

    if (isEditing === true) {
      // 편집 모드
      const updatedClient: Partial<Client> = {
        ...payload,
        id: editingClientId!,
        workplaces: newClient.workplaces.map((wp, index) => ({
          ...wp,
          id: (wp.id !== null && wp.id !== undefined && Number(wp.id) !== 0) ? wp.id : index + 1
        })),
        projects: Array.from(new Set((newClient.workplaces !== null && newClient.workplaces !== undefined ? newClient.workplaces : [])
          .map(wp => (wp.description !== '' && wp.description !== null && wp.description !== undefined ? wp.description : '').trim())
          .filter((s): s is string => s !== '')))
      };
      setClients(prev => prev.map(client => 
        client.id === editingClientId 
          ? { ...client, ...updatedClient, totalBilled: client.totalBilled, outstanding: client.outstanding }
          : client
      ));
    } else {
      // 새로 추가 모드
      const client: Client = {
        ...payload,
        id: clients.length + 1,
        workplaces: newClient.workplaces.map((wp, index) => ({
          ...wp,
          id: index + 1
        })),
        projects: Array.from(new Set((newClient.workplaces !== null && newClient.workplaces !== undefined ? newClient.workplaces : [])
          .map(wp => (wp.description !== '' && wp.description !== null && wp.description !== undefined ? wp.description : '').trim())
          .filter((s): s is string => s !== ''))),
        totalBilled: 0,
        outstanding: 0
      };
      setClients(prev => [...prev, client]);
    }
    
    // 상태 초기화
    setNewClient({
      type: 'PERSON',
      name: '',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      notes: '',
      business: {
        businessName: '',
        representative: '',
        businessNumber: '',
        businessType: '',
        businessItem: '',
        businessAddress: '',
        taxEmail: ''
      },
      workplaces: [{ name: '', address: '', description: '' }]
    });
    setShowModal(false);
    setIsEditing(false);
    setEditingClientId(null);
  };

  const viewClientDetails = (client: Client) => {
    setSelectedClient(client);
  };

  const handleEditClient = (client: Client) => {
    setIsEditing(true);
    setEditingClientId(Number(client.id));
    setNewClient({
      type: (client.type !== null && client.type !== undefined) ? client.type : 'PERSON',
      name: client.name,
      phone: (client.phone !== '' && client.phone !== null && client.phone !== undefined) ? client.phone : '',
      mobile: (client.mobile !== '' && client.mobile !== null && client.mobile !== undefined) ? client.mobile : '',
      email: (client.email !== '' && client.email !== null && client.email !== undefined) ? client.email : '',
      address: (client.address !== '' && client.address !== null && client.address !== undefined) ? client.address : '',
      notes: (client.notes !== '' && client.notes !== null && client.notes !== undefined) ? client.notes : '',
      business: (client.business !== null && client.business !== undefined) ? client.business : {
        businessName: '',
        representative: '',
        businessNumber: '',
        businessType: '',
        businessItem: '',
        businessAddress: '',
        taxEmail: ''
      },
      workplaces: (client.workplaces !== null && client.workplaces !== undefined) ? client.workplaces : [{ id: 0, name: '', address: '', description: '' }]
    });
    setShowModal(true);
  };

  // 계산: 청구액/미수금 (invoices 기반, clientId 우선/이름 보조)
  const totalsByClientId = useMemo(() => {
    const map = new Map<number, { total: number; outstanding: number }>();
    clients.forEach(c => map.set(Number(c.id), { total: 0, outstanding: 0 }));
    (invoices !== null && invoices !== undefined ? invoices : []).forEach(inv => {
      const amount = (Number(inv.amount) !== 0 && !isNaN(Number(inv.amount))) ? Number(inv.amount) : 0;
      let cid = (inv.clientId !== null && inv.clientId !== undefined) ? parseInt(String(inv.clientId)) : null;
      if (cid === null) {
        const match = clients.find(c => c.name === inv.client);
        cid = (match !== null && match !== undefined) ? Number(match.id) : null;
      }
      if (cid === null) return;
      const agg = (map.get(cid) !== null && map.get(cid) !== undefined) ? map.get(cid)! : { total: 0, outstanding: 0 };
      agg.total += amount;
      if (inv.status !== '결제완료') agg.outstanding += amount;
      map.set(cid, agg);
    });
    return map;
  }, [clients, invoices]);

  const grandTotals = useMemo(() => {
    let total = 0;
    let outstanding = 0;
    (invoices !== null && invoices !== undefined ? invoices : []).forEach(inv => {
      const amount = (Number(inv.amount) !== 0 && !isNaN(Number(inv.amount))) ? Number(inv.amount) : 0;
      total += amount;
      if (inv.status !== '결제완료') outstanding += amount;
    });
    return { total, outstanding };
  }, [invoices]);

  // 프로젝트 수: clients.projects + workItems.projectName + invoices.project에서 고유값 집계
  const projectCountsByClientId = useMemo(() => {
    const sets = new Map<number, Set<string>>();
    const ensureSet = (id: number) => {
      if (sets.has(id) === false) sets.set(id, new Set());
      return sets.get(id)!;
    };

    // 기존 client.projects 반영
    clients.forEach(c => {
      const s = ensureSet(Number(c.id));
      (c.projects !== null && c.projects !== undefined ? c.projects : []).forEach(p => {
        const v = (p !== '' && p !== null && p !== undefined ? p : '').trim();
        if (v !== '') s.add(v);
      });
    });

    // workItems.projectName 반영
    (workItems !== null && workItems !== undefined ? workItems : []).forEach(wi => {
      if (wi === null || wi === undefined) return;
      const cid = wi.clientId;
      if (cid === 0 || cid === null || cid === undefined) return;
      const v = (wi.projectName !== '' && wi.projectName !== null && wi.projectName !== undefined ? wi.projectName : '').trim();
      if (v === '') return;
      ensureSet(cid).add(v);
    });

    // invoices.project 반영 (clientId 우선, 없으면 이름 매칭)
    (invoices !== null && invoices !== undefined ? invoices : []).forEach(inv => {
      const v = (inv.project !== '' && inv.project !== null && inv.project !== undefined ? inv.project : '').trim();
      if (v === '') return;
      let cid = (inv.clientId !== null && inv.clientId !== undefined) ? parseInt(String(inv.clientId)) : null;
      if (cid === null) {
        const match = clients.find(c => c.name === inv.client);
        cid = (match !== null && match !== undefined) ? Number(match.id) : null;
      }
      if (cid === null) return;
      ensureSet(cid).add(v);
    });

    // 크기 맵으로 변환
    const counts = new Map<number, number>();
    for (const [id, set] of sets.entries()) counts.set(id, set.size);
    return counts;
  }, [clients, workItems, invoices]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">건축주 관리</h1>
          <p className="text-gray-600">건축주 정보를 관리하고 프로젝트 이력을 추적하세요</p>
        </div>
        <div className="flex space-x-2">
          {selection.selected.length > 0 && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium"
              title="선택된 건축주 일괄 삭제"
            >
              <span className="text-red-600 mr-2">🗑️</span>
              <span className="text-xs font-semibold">선택 삭제({selection.selected.length})</span>
            </button>
          )}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium"
          >
            <span className="text-gray-500 mr-2">📁</span>
            <span className="text-xs font-semibold">템플릿 다운로드</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium"
          >
            <span className="text-blue-500 mr-2">📤</span>
            <span className="text-xs font-semibold">Excel 가져오기</span>
          </button>
          <button
            onClick={handleExportToExcel}
            className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium"
          >
            <span className="text-green-500 mr-2">📥</span>
            <span className="text-xs font-semibold">Excel 내보내기</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-300 font-bold"
          >
            <span className="text-yellow-300 mr-2">👥</span>
            <span className="text-xs font-bold">새 건축주</span>
          </button>
        </div>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFromExcel}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">총 건축주</p>
              <p className="text-base font-bold text-gray-900">{clients.length}명</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <UsersIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">총 청구금액 :</p>
              <p className="text-base font-bold text-gray-900">
                {grandTotals.total.toLocaleString()}원
              </p>
            </div>
            <div className="bg-green-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <CurrencyDollarIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
        
        <div className="bg-red-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">미수금</p>
              <p className="text-base font-bold text-gray-900">
                {grandTotals.outstanding.toLocaleString()}원
              </p>
            </div>
            <div className="bg-red-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">미수금 건수</p>
              <p className="text-base font-bold text-gray-900">
                {clients.filter(c => ((totalsByClientId.get(Number(c.id))?.outstanding !== 0 && totalsByClientId.get(Number(c.id))?.outstanding !== null && totalsByClientId.get(Number(c.id))?.outstanding !== undefined) ? totalsByClientId.get(Number(c.id))!.outstanding : 0) > 0).length}건
              </p>
            </div>
            <div className="bg-amber-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <ClipboardDocumentIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* 건축주 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div>
          <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  title="전체 선택"
                />
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-40">
                이&nbsp;&nbsp;&nbsp;&nbsp;름
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-32">
연 락 처
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-36">
                주&nbsp;&nbsp;&nbsp;&nbsp;소
              </th>
              <th className="px-2 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-16 whitespace-nowrap">
프로젝트
              </th>
              <th className="px-2 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                총 청구액
              </th>
              <th className="px-2 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-20">
미 수 금
              </th>
              <th className="px-2 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-20">
                작&nbsp;&nbsp;&nbsp;&nbsp;업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300"
                    checked={selection.selected.includes(client.id)}
                    onChange={(e) => toggleSelectOne(client.id, e.target.checked)}
                    title="항목 선택"
                  />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900">
                        {client.name}
                        {client.type === 'BUSINESS' && (
                          <span className="ml-1 text-xs px-1 py-0.5 rounded bg-yellow-100 text-yellow-800">사업자</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {client.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(client.phone !== '' && client.phone !== null && client.phone !== undefined) && <div className="truncate">{client.phone}</div>}
                    {(client.mobile !== '' && client.mobile !== null && client.mobile !== undefined) && <div className="truncate">{client.mobile}</div>}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div className="text-sm text-gray-900 truncate max-w-36" title={client.address}>{client.address}</div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 text-center">{((projectCountsByClientId.get(Number(client.id)) !== 0 && projectCountsByClientId.get(Number(client.id)) !== null && projectCountsByClientId.get(Number(client.id)) !== undefined) ? projectCountsByClientId.get(Number(client.id))! : 0)}개</div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {((totalsByClientId.get(Number(client.id))?.total !== 0 && totalsByClientId.get(Number(client.id))?.total !== null && totalsByClientId.get(Number(client.id))?.total !== undefined) ? totalsByClientId.get(Number(client.id))!.total : 0).toLocaleString()}원
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-right">
                  <div className={`text-sm font-medium ${
                    ((totalsByClientId.get(Number(client.id))?.outstanding !== 0 && totalsByClientId.get(Number(client.id))?.outstanding !== null && totalsByClientId.get(Number(client.id))?.outstanding !== undefined) ? totalsByClientId.get(Number(client.id))!.outstanding : 0) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {((totalsByClientId.get(Number(client.id))?.outstanding !== 0 && totalsByClientId.get(Number(client.id))?.outstanding !== null && totalsByClientId.get(Number(client.id))?.outstanding !== undefined) ? totalsByClientId.get(Number(client.id))!.outstanding : 0).toLocaleString()}원
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex justify-center">
                    <Tooltip label="상세보기">
                      <button
                        onClick={() => viewClientDetails(client)}
                        className="text-blue-600 hover:text-blue-900 mx-2"
                        title="건축주 상세보기"
                      >
                        🔍
                      </button>
                    </Tooltip>
                    <Tooltip label="편집">
                      <button
                        className="text-blue-600 hover:text-blue-900 mx-2"
                        onClick={() => handleEditClient(client)}
                        title="건축주 편집"
                      >
                        ✏️
                      </button>
                    </Tooltip>
                    <Tooltip label="삭제">
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-900 mx-2"
                        title="건축주 삭제"
                      >
                        🗑️
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* 선택 삭제 확인 모달 */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선택 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">선택된 {selection.selected.length}명의 건축주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowConfirmDelete(false)}>취소</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50" disabled={selection.selected.length === 0} onClick={handleBulkDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 새 건축주 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? '건축주 정보 수정' : '새 건축주 추가'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* 섹션: 기본 정보 */}
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">기본 정보</h4>
                  </div>
                  {/* 유형 + 이름/상호 카드 내부 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                      <div className="flex items-center gap-5">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input type="radio" name="type" value="PERSON" checked={newClient.type === 'PERSON'} onChange={() => handleTypeChange('PERSON')} />
                          개인
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input type="radio" name="type" value="BUSINESS" checked={newClient.type === 'BUSINESS'} onChange={() => handleTypeChange('BUSINESS')} />
                          사업자
                        </label>
                      </div>
                    </div>
                    {newClient.type !== 'BUSINESS' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">이름</label>
                        <input ref={nameInputRef} type="text" name="name" value={newClient.name} onChange={handleInputChange} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" required={newClient.type === 'PERSON'} />
                      </div>
                    )}
                  </div>
                  {newClient.type === 'BUSINESS' && (
                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-center gap-2 mb-2 text-yellow-800">
                        <BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="text-sm font-medium">사업자 정보</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">상호</label>
                        <input ref={bizNameInputRef} type="text" name="businessName" value={newClient.business.businessName} onChange={handleBusinessChange} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" required={newClient.type === 'BUSINESS'} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">대표자</label>
                          <input type="text" name="representative" value={newClient.business.representative} onChange={handleBusinessChange} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" required={newClient.type === 'BUSINESS'} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">사업자등록번호</label>
                          <input type="text" name="businessNumber" value={newClient.business.businessNumber} onChange={handleBusinessChange} placeholder="000-00-00000" className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" required={newClient.type === 'BUSINESS'} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">발행 이메일</label>
                          <input type="email" name="taxEmail" value={newClient.business.taxEmail} onChange={handleBusinessChange} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" required={newClient.type === 'BUSINESS'} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">업태</label>
                          <input type="text" name="businessType" value={newClient.business.businessType} onChange={handleBusinessChange} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">업종</label>
                          <input type="text" name="businessItem" value={newClient.business.businessItem} onChange={handleBusinessChange} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">사업장 주소</label>
                          <input type="text" name="businessAddress" value={newClient.business.businessAddress} onChange={handleBusinessChange} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 섹션: 연락처 / 주소 */}
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-50">
                      <PhoneIcon className="h-4 w-4 text-slate-600" aria-hidden="true" />
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">연락처 / 주소</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">전화번호</label>
                      <input type="tel" name="phone" value={newClient.phone} onChange={handleInputChange} placeholder="02-1234-5678" className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">휴대전화</label>
                      <input type="tel" name="mobile" value={newClient.mobile} onChange={handleInputChange} placeholder="010-1234-5678" className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이메일</label>
                      <input type="email" name="email" value={newClient.email} onChange={handleInputChange} placeholder="선택사항" className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-1"><MapPinIcon className="h-4 w-4 text-slate-600" />주소</label>
                        {newClient.type === 'BUSINESS' && (
                          <label className="text-xs text-gray-600 inline-flex items-center gap-1">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={showAltAddress}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setShowAltAddress(checked);
                                if (checked === true) {
                                  setNewClient(prev => ({
                                    ...prev,
                                    address: (prev.business?.businessAddress !== '' && prev.business?.businessAddress !== null && prev.business?.businessAddress !== undefined) ? prev.business.businessAddress : ''
                                  }));
                                }
                              }}
                            />
                            사업장 주소와 다른 주소 입력
                          </label>
                        )}
                      </div>
                      {(newClient.type !== 'BUSINESS' || showAltAddress) && (
                        <textarea name="address" value={newClient.address} onChange={handleInputChange} rows={1} placeholder="선택사항" className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">메모</label>
                      <textarea name="notes" value={newClient.notes} onChange={handleInputChange} rows={2} className="mt-0.5 block w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                  </div>
                </div>
                
                
                {/* 작업장 정보 */}
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-50">
                        <UsersIcon className="h-4 w-4 text-slate-600" aria-hidden="true" />
                      </span>
                      <label className="text-sm font-semibold text-gray-900">작업장 정보</label>
                    </div>
                    <button type="button" onClick={addWorkplace} className="text-blue-600 hover:text-blue-800 text-sm">+ 작업장 추가</button>
                  </div>
                  {newClient.workplaces.map((workplace, index) => (
                    <div key={index} className="border rounded-md p-3 mb-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">작업장 {index + 1}</span>
                        {newClient.workplaces.length > 1 && (
                          <button type="button" onClick={() => removeWorkplace(index)} className="text-red-600 hover:text-red-800 text-sm">삭제</button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input type="text" placeholder="작업장명 (예: 신축 주택, 카페 인테리어 등)" value={workplace.name} onChange={(e) => handleWorkplaceChange(index, 'name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" required />
                        <input type="text" placeholder="작업장 주소" value={workplace.address} onChange={(e) => handleWorkplaceChange(index, 'address', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" required />
                        <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
                        <textarea placeholder="프로젝트 (필수사항)" value={workplace.description} onChange={(e) => handleWorkplaceChange(index, 'description', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" rows={2} required />
                        <p className="mt-1 text-xs text-red-600">필수사항: 프로젝트명을 입력해주세요.</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setIsEditing(false);
                      setEditingClientId(null);
                      setNewClient({
                        type: 'PERSON',
                        name: '',
                        phone: '',
                        mobile: '',
                        email: '',
                        address: '',
                        notes: '',
                        business: {
                          businessName: '',
                          representative: '',
                          businessNumber: '',
                          businessType: '',
                          businessItem: '',
                          businessAddress: '',
                          taxEmail: ''
                        },
                        workplaces: [{ name: '', address: '', description: '' }]
                      });
                    }}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    {isEditing ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 건축주 상세보기 모달 */}
      {(selectedClient !== null && selectedClient !== undefined) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">건축주 상세 정보 - {selectedClient.name}</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3">기본 정보</h4>
                  <p className="mb-2"><strong>이름:</strong> {selectedClient.name}</p>
                  {(selectedClient.phone !== '' && selectedClient.phone !== null && selectedClient.phone !== undefined) && <p className="mb-2"><strong>전화번호:</strong> {selectedClient.phone}</p>}
                  {(selectedClient?.mobile !== '' && selectedClient?.mobile !== null && selectedClient?.mobile !== undefined) && <p className="mb-2"><strong>휴대전화:</strong> {selectedClient.mobile}</p>}
                  {(selectedClient.email !== '' && selectedClient.email !== null && selectedClient.email !== undefined) && <p className="mb-2"><strong>이메일:</strong> {selectedClient.email}</p>}
                  <p><strong>주소:</strong> {selectedClient.address}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-3">재무 정보</h4>
                  <p className="mb-2"><strong>총 청구액:</strong> {((selectedClient.totalBilled !== 0 && selectedClient.totalBilled !== null && selectedClient.totalBilled !== undefined) ? selectedClient.totalBilled : 0).toLocaleString()}원</p>
                  <p className="mb-2"><strong>미수금:</strong>
                    <span className={((selectedClient.outstanding !== 0 && selectedClient.outstanding !== null && selectedClient.outstanding !== undefined) ? selectedClient.outstanding : 0) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {((selectedClient.outstanding !== 0 && selectedClient.outstanding !== null && selectedClient.outstanding !== undefined) ? selectedClient.outstanding : 0).toLocaleString()}원
                    </span>
                  </p>
                  <p><strong>완료 프로젝트:</strong> {(selectedClient.projects !== null && selectedClient.projects !== undefined ? selectedClient.projects : []).length}개</p>
                </div>
              </div>

              {(selectedClient?.type === 'BUSINESS') && (
                <div className="border rounded-md p-4 bg-yellow-50 mb-6">
                  <h4 className="font-medium mb-3">사업자 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>상호:</strong> {(selectedClient.business?.businessName !== '' && selectedClient.business?.businessName !== null && selectedClient.business?.businessName !== undefined) ? selectedClient.business.businessName : '-'}</p>
                    <p><strong>대표자:</strong> {(selectedClient.business?.representative !== '' && selectedClient.business?.representative !== null && selectedClient.business?.representative !== undefined) ? selectedClient.business.representative : '-'}</p>
                    <p><strong>사업자등록번호:</strong> {(selectedClient.business?.businessNumber !== '' && selectedClient.business?.businessNumber !== null && selectedClient.business?.businessNumber !== undefined) ? selectedClient.business.businessNumber : '-'}</p>
                    <p><strong>발행 이메일:</strong> {(selectedClient.business?.taxEmail !== '' && selectedClient.business?.taxEmail !== null && selectedClient.business?.taxEmail !== undefined) ? selectedClient.business.taxEmail : '-'}</p>
                    <p><strong>업태:</strong> {(selectedClient.business?.businessType !== '' && selectedClient.business?.businessType !== null && selectedClient.business?.businessType !== undefined) ? selectedClient.business.businessType : '-'}</p>
                    <p><strong>업종:</strong> {(selectedClient.business?.businessItem !== '' && selectedClient.business?.businessItem !== null && selectedClient.business?.businessItem !== undefined) ? selectedClient.business.businessItem : '-'}</p>
                    <p className="col-span-2"><strong>사업장 주소:</strong> {(selectedClient.business?.businessAddress !== '' && selectedClient.business?.businessAddress !== null && selectedClient.business?.businessAddress !== undefined) ? selectedClient.business.businessAddress : '-'}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">작업장 정보</h4>
                {(selectedClient.workplaces !== null && selectedClient.workplaces !== undefined && selectedClient.workplaces.length > 0) ? (
                  <div className="space-y-3">
                    {selectedClient.workplaces.map((workplace, index) => (
                      <div key={index} className="bg-white rounded border p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{workplace.name}</h5>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            작업장 {index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>주소:</strong> {workplace.address}
                        </p>
                        {(workplace.description !== '' && workplace.description !== null && workplace.description !== undefined) && (
                          <p className="text-sm text-gray-600">
                            <strong>프로젝트:</strong> {workplace.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">등록된 작업장이 없습니다.</p>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">프로젝트 이력</h4>
                {((selectedClient.projects !== null && selectedClient.projects !== undefined ? selectedClient.projects : []).length > 0) ? (
                  <ul className="bg-white rounded border p-3">
                    {selectedClient.projects!.map((project, index) => (
                      <li key={index} className="py-1 border-b last:border-b-0">
                        • {project}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">진행된 프로젝트가 없습니다.</p>
                )}
              </div>

              {(selectedClient.notes !== '' && selectedClient.notes !== null && selectedClient.notes !== undefined) && (
                <div>
                  <h4 className="font-medium mb-2">메모</h4>
                  <p className="bg-white rounded border p-3">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
