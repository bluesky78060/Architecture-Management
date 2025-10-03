import React, { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, importFromExcel, createTemplate } from '../utils/excelUtils';
import { WrenchScrewdriverIcon, CheckCircleIcon, ExclamationTriangleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

function WorkItems() {
  const { clients, setClients, workItems, setWorkItems, invoices, setInvoices, getCompletedWorkItemsByClient, addWorkItemToInvoice, units, categories } = useApp();
  const navigate = useNavigate();
  

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const fileInputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    clientId: '',
    workplaceId: '',
    name: '',
    category: '',
    defaultPrice: 0,
    quantity: 1,
    unit: '',
    description: '',
    projectName: '',
    status: '예정',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    // 간단 인부: 인원 × 단가 (선택)
    laborPersons: '',
    laborUnitRate: '',
    // 일반 인부: 인원 × 단가 (선택)
    laborPersonsGeneral: '',
    laborUnitRateGeneral: ''
  });

  const [showCustomProject, setShowCustomProject] = useState(false);

  // 일괄 입력용 상태
  const [bulkItems, setBulkItems] = useState([
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
      laborUnitRate: ''
    }
  ]);

  const [bulkBaseInfo, setBulkBaseInfo] = useState({
    clientId: '',
    workplaceId: '',
    projectName: '',
    date: new Date().toISOString().split('T')[0],
    // 공통 인부(선택)
    bulkLaborPersons: '',
    bulkLaborUnitRate: ''
  });

  const [showBulkCustomProject, setShowBulkCustomProject] = useState(false);

  const statuses = ['예정', '진행중', '완료', '보류'];
  const [bulkStatus, setBulkStatus] = useState('');

  // Calendar (single new item)
  const calContainerRefSingle = useRef(null);
  const calendarRefSingle = useRef(null);
  const [calendarOpenSingle, setCalendarOpenSingle] = useState(false);
  const [calendarMonthSingle, setCalendarMonthSingle] = useState(() => new Date());

  useEffect(() => {
    // Initialize month to selected date
    if (newItem.date) {
      const [y, m] = newItem.date.split('-').map(Number);
      if (y && m) setCalendarMonthSingle(new Date(y, m - 1, 1));
    }
  }, [newItem.date]);

  // Close single calendar when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (calContainerRefSingle.current && !calContainerRefSingle.current.contains(e.target)) {
        setCalendarOpenSingle(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const prevMonthSingle = () => setCalendarMonthSingle((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonthSingle = () => setCalendarMonthSingle((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const pad2 = (n) => String(n).padStart(2, '0');
  const pickDateSingle = (day) => {
    if (!day) return;
    const y = calendarMonthSingle.getFullYear();
    const m = calendarMonthSingle.getMonth() + 1;
    const value = `${y}-${pad2(m)}-${pad2(day)}`;
    setNewItem((prev) => ({ ...prev, date: value }));
    setCalendarOpenSingle(false);
  };
  const renderCalendarRowsSingle = () => {
    const first = new Date(calendarMonthSingle.getFullYear(), calendarMonthSingle.getMonth(), 1);
    const startDay = first.getDay();
    const days = new Date(calendarMonthSingle.getFullYear(), calendarMonthSingle.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows.map((row, idx) => (
      <tr key={idx} className="text-left">
        {row.map((d, i2) => {
          const color = i2 === 0 ? 'text-red-600' : i2 === 6 ? 'text-blue-600' : '';
          return (
            <td
              key={i2}
              className={`px-2 py-1 ${color} ${d ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
              onClick={() => pickDateSingle(d)}
            >
              {d || ''}
            </td>
          );
        })}
      </tr>
    ));
  };

  // Calendar (bulk base info)
  const calContainerRefBulk = useRef(null);
  const calendarRefBulk = useRef(null);
  const [calendarOpenBulk, setCalendarOpenBulk] = useState(false);
  const [calendarMonthBulk, setCalendarMonthBulk] = useState(() => new Date());

  useEffect(() => {
    if (bulkBaseInfo.date) {
      const [y, m] = bulkBaseInfo.date.split('-').map(Number);
      if (y && m) setCalendarMonthBulk(new Date(y, m - 1, 1));
    }
  }, [bulkBaseInfo.date]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (calContainerRefBulk.current && !calContainerRefBulk.current.contains(e.target)) {
        setCalendarOpenBulk(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const prevMonthBulk = () => setCalendarMonthBulk((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonthBulk = () => setCalendarMonthBulk((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const pickDateBulk = (day) => {
    if (!day) return;
    const y = calendarMonthBulk.getFullYear();
    const m = calendarMonthBulk.getMonth() + 1;
    const value = `${y}-${pad2(m)}-${pad2(day)}`;
    setBulkBaseInfo((prev) => ({ ...prev, date: value }));
    setCalendarOpenBulk(false);
  };
  const renderCalendarRowsBulk = () => {
    const first = new Date(calendarMonthBulk.getFullYear(), calendarMonthBulk.getMonth(), 1);
    const startDay = first.getDay();
    const days = new Date(calendarMonthBulk.getFullYear(), calendarMonthBulk.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows.map((row, idx) => (
      <tr key={idx} className="text-left">
        {row.map((d, i2) => {
          const color = i2 === 0 ? 'text-red-600' : i2 === 6 ? 'text-blue-600' : '';
          return (
            <td
              key={i2}
              className={`px-2 py-1 ${color} ${d ? 'cursor-pointer hover:bg-gray-100 rounded' : ''}`}
              onClick={() => pickDateBulk(d)}
            >
              {d || ''}
            </td>
          );
        })}
      </tr>
    ));
  };

  // 선택된 건축주의 프로젝트 목록 가져오기 (작업항목 + 건축주.projects + 작업장 설명 기반)
  const getClientProjects = (clientId) => {
    if (!clientId) return [];
    const cid = parseInt(clientId);
    const fromWorkItems = workItems
      .filter(item => item.clientId === cid)
      .map(item => item.projectName)
      .filter(Boolean);
    const client = clients.find(c => c.id === cid);
    const fromClientProjects = (client?.projects || []).filter(Boolean);
    const fromWorkplaces = (client?.workplaces || [])
      .map(wp => wp.description)
      .filter(Boolean);
    return Array.from(new Set([
      ...fromWorkItems,
      ...fromClientProjects,
      ...fromWorkplaces
    ]));
  };

  // 모든 프로젝트 목록 가져오기
  const getAllProjects = () => {
    const allProjects = [...new Set(workItems.map(item => item.projectName).filter(p => p))];
    return allProjects.sort();
  };

  // 필터링된 작업 항목
  const filteredWorkItems = workItems.filter(item => {
    if (selectedClient && item.clientId !== parseInt(selectedClient)) return false;
    if (selectedProject && item.projectName !== selectedProject) return false;
    return true;
  });

  // 선택된 건축주의 작업장 목록
  const getClientWorkplaces = (clientId) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    return client?.workplaces || [];
  };

  // 숫자에 콤마 포맷팅 함수
  const formatNumberWithCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 인부비 계산: (기술자 + 일반) 각각 인원 × 단가 합산
  const getLaborCost = (item) => {
    const skilledPersons = parseInt(item?.laborPersons ?? 0, 10) || 0;
    const skilledRate = parseInt(item?.laborUnitRate ?? 0, 10) || 0;
    const generalPersons = parseInt(item?.laborPersonsGeneral ?? 0, 10) || 0;
    const generalRate = parseInt(item?.laborUnitRateGeneral ?? 0, 10) || 0;
    return (skilledPersons * skilledRate) + (generalPersons * generalRate);
  };

  // 콤마 제거하고 숫자만 추출
  // eslint-disable-next-line no-unused-vars
  const removeCommas = (str) => {
    return str.replace(/,/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'defaultPrice' || name === 'quantity' || name === 'laborPersons' || name === 'laborUnitRate' || name === 'laborPersonsGeneral' || name === 'laborUnitRateGeneral') {
      // 숫자만 추출하고 포맷팅
      const numbersOnly = value.replace(/[^\d]/g, '');
       // 입력값이 비어있으면 상태도 비워줍니다.
         if (numbersOnly === '') {
           setNewItem(prev => ({
            ...prev,
            [name]: '' // 빈 문자열로 설정하여 placeholder가 보이도록 함
          }));
        } else {
           // 입력값이 있으면 숫자로 변환하여 상태를 업데이트합니다.
          const numericValue = parseInt(numbersOnly, 10);
          setNewItem(prev => ({
            ...prev,
            [name]: numericValue
          }));
        }
    } else {
      const newValue = name === 'clientId' || name === 'workplaceId' 
        ? parseInt(value) || 0 
        : value;
      
      setNewItem(prev => {
        const updated = {
          ...prev,
          [name]: newValue
        };
    
        // 건축주가 변경되면 작업장/프로젝트 초기화
        if (name === 'clientId') {
          updated.workplaceId = '';
          updated.projectName = '';
          setShowCustomProject(false);
        }

        // 프로젝트명이 "custom"이면 커스텀 입력 모드로 변경
        if (name === 'projectName') {
          if (value === 'custom') {
            setShowCustomProject(true);
            updated.projectName = '';
          } else {
            setShowCustomProject(false);
          }
        }

        // 작업장 선택 시, 작업장 설명을 프로젝트명으로 자동 채움(있을 경우)
        if (name === 'workplaceId') {
          const wp = getClientWorkplaces(updated.clientId).find(w => w.id === parseInt(value));
          const suggested = (wp?.description || '').trim();
          if (suggested) {
            updated.projectName = suggested;
          }
        }
        
        return updated;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedClientData = clients.find(c => c.id === newItem.clientId);
    
    if (editingItem) {
      // 수정
      const selectedWorkplaceData = getClientWorkplaces(newItem.clientId).find(wp => wp.id === newItem.workplaceId);
      setWorkItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              ...newItem,
              clientName: selectedClientData?.name || item.clientName,
              workplaceName: selectedWorkplaceData?.name || item.workplaceName
            }
          : item
      ));
      // 클라이언트의 프로젝트 목록에 반영
      if (newItem.projectName) {
        setClients(prev => prev.map(c => c.id === newItem.clientId
          ? { ...c, projects: Array.from(new Set([...(c.projects || []), newItem.projectName])) }
          : c
        ));
      }
    } else {
      // 새 항목 추가
      const selectedWorkplaceData = getClientWorkplaces(newItem.clientId).find(wp => wp.id === newItem.workplaceId);
      const item = {
        ...newItem,
        id: Math.max(...workItems.map(i => i.id)) + 1,
        clientName: selectedClientData?.name || '',
        workplaceName: selectedWorkplaceData?.name || '',
        date: newItem.date || new Date().toISOString().split('T')[0]
      };
      setWorkItems(prev => [...prev, item]);
      // 클라이언트의 프로젝트 목록에 반영
      if (newItem.projectName) {
        setClients(prev => prev.map(c => c.id === newItem.clientId
          ? { ...c, projects: Array.from(new Set([...(c.projects || []), newItem.projectName])) }
          : c
        ));
      }
    }
    
    resetForm();
  };

  const resetForm = () => {
    setNewItem({
      clientId: '',
      workplaceId: '',
      name: '',
      category: '',
      defaultPrice: 0,
      quantity: 1,
      unit: '',
      description: '',
      projectName: '',
      status: '예정',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      laborPersons: '',
      laborUnitRate: ''
    });
    setEditingItem(null);
    setShowModal(false);
    setShowCustomProject(false);
  };

  // 일괄 입력 관련 함수들
  const handleBulkBaseInfoChange = (e) => {
    const { name, value } = e.target;
    setBulkBaseInfo(prev => ({
      ...prev,
      [name]: (name === 'clientId' || name === 'workplaceId')
        ? (parseInt(value) || '')
        : (name === 'bulkLaborPersons' || name === 'bulkLaborUnitRate')
          ? (value.replace(/[^\d]/g, '') === '' ? '' : parseInt(value.replace(/[^\d]/g, ''), 10))
          : value
    }));
    
    if (name === 'clientId') {
      setBulkBaseInfo(prev => ({ ...prev, workplaceId: '' }));
    }

    // 프로젝트명이 "custom"이면 커스텀 입력 모드로 변경
    if (name === 'projectName') {
      if (value === 'custom') {
        setShowBulkCustomProject(true);
        setBulkBaseInfo(prev => ({ ...prev, projectName: '' }));
      } else {
        setShowBulkCustomProject(false);
      }
    }
  };

  const handleBulkItemChange = (index, field, value) => {
     const updatedItems = [...bulkItems];
   
     // 숫자 필드 처리
     if (field === 'defaultPrice' || field === 'quantity' || field === 'laborPersons' || field === 'laborUnitRate') {
       const numbersOnly = String(value).replace(/[^\d]/g,'');
      
       // 입력값이 비어있으면 상태도 비워줍니다.
        if (numbersOnly === '') {
         updatedItems[index][field] = '';
        } else {
          // 숫자가 있다면 숫자로 변환하여 설정합니다.
          updatedItems[index][field] = parseInt(numbersOnly,10);
        }
      } else {
        // 다른 필드는 값을 그대로 반영합니다.
        updatedItems[index][field] = value;
      }
    
      setBulkItems(updatedItems);
    };


  const removeBulkItem = (index) => {
    if (bulkItems.length > 1) {
      setBulkItems(prev => prev.filter((_, i) => i !== index));
    }
  };
const addBulkItem = () => {
        setBulkItems(prev => [...prev, {
          name: '',
          category: '',
          defaultPrice: 0,
         quantity: 1,
          unit: '',
          description: '',
          status: '예정',
          notes: '',
          laborPersons: '',
          laborUnitRate: ''
        }]);
      };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    
    const selectedClientData = clients.find(c => c.id === bulkBaseInfo.clientId);
    const selectedWorkplaceData = getClientWorkplaces(bulkBaseInfo.clientId).find(wp => wp.id === bulkBaseInfo.workplaceId);
    
    const newItems = bulkItems.map((item, index) => ({
      ...item,
      id: Math.max(...workItems.map(i => i.id)) + index + 1,
      clientId: bulkBaseInfo.clientId,
      clientName: selectedClientData?.name || '',
      workplaceId: bulkBaseInfo.workplaceId,
      workplaceName: selectedWorkplaceData?.name || '',
      projectName: bulkBaseInfo.projectName,
      date: bulkBaseInfo.date || new Date().toISOString().split('T')[0],
      // 공통 인부(일반)는 별도 필드로 저장하여 합산
      laborPersonsGeneral: (bulkBaseInfo.bulkLaborPersons !== '' && bulkBaseInfo.bulkLaborPersons != null) ? bulkBaseInfo.bulkLaborPersons : '',
      laborUnitRateGeneral: (bulkBaseInfo.bulkLaborUnitRate !== '' && bulkBaseInfo.bulkLaborUnitRate != null) ? bulkBaseInfo.bulkLaborUnitRate : '',
      // 항목별 인부(기술자)는 기존 필드 유지
      laborPersons: (item.laborPersons !== '' && item.laborPersons != null) ? item.laborPersons : '',
      laborUnitRate: (item.laborUnitRate !== '' && item.laborUnitRate != null) ? item.laborUnitRate : ''
    }));
    
    setWorkItems(prev => [...prev, ...newItems]);
    // 클라이언트의 프로젝트 목록에 반영
    if (bulkBaseInfo.projectName) {
      setClients(prev => prev.map(c => c.id === bulkBaseInfo.clientId
        ? { ...c, projects: Array.from(new Set([...(c.projects || []), bulkBaseInfo.projectName])) }
        : c
      ));
    }
    
    // 폼 초기화
    setBulkItems([{
      name: '',
      category: '',
      defaultPrice: 0,
      quantity: 1,
      unit: '',
      description: '',
      status: '예정',
      notes: '',
      laborPersons: '',
      laborUnitRate: ''
    }]);
    setBulkBaseInfo({
      clientId: '',
      workplaceId: '',
      projectName: '',
      date: new Date().toISOString().split('T')[0],
      bulkLaborPersons: '',
      bulkLaborUnitRate: ''
    });
    setShowBulkModal(false);
    setShowBulkCustomProject(false);
    
    alert(`${newItems.length}개의 작업 항목이 추가되었습니다.`);
  };

  const handleEdit = (item) => {
    const allProjects = getAllProjects();
    const isExistingProject = allProjects.includes(item.projectName);
    
    setNewItem({
      clientId: item.clientId,
      workplaceId: item.workplaceId || '',
      name: item.name,
      category: item.category,
      defaultPrice: item.defaultPrice,
      quantity: item.quantity || 1,
      unit: item.unit,
      description: item.description,
      projectName: item.projectName,
      status: item.status,
      notes: item.notes || '',
      date: item.date || new Date().toISOString().split('T')[0],
      laborPersons: item.laborPersons || '',
      laborUnitRate: item.laborUnitRate || '',
      laborPersonsGeneral: item.laborPersonsGeneral || '',
      laborUnitRateGeneral: item.laborUnitRateGeneral || ''
    });
    setEditingItem(item);
    setShowCustomProject(!isExistingProject);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setWorkItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // 체크박스 선택 관리 (통합)
  const handleItemSelect = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(filteredWorkItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // 선택된 항목들 일괄 삭제
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      alert('삭제할 작업 항목을 선택해주세요.');
      return;
    }

    if (window.confirm(`선택된 ${selectedItems.length}개의 작업 항목을 정말 삭제하시겠습니까?`)) {
      setWorkItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      alert(`${selectedItems.length}개의 작업 항목이 삭제되었습니다.`);
    }
  };

  // 선택된 항목들로 청구서 생성
  const handleCreateBulkInvoice = () => {
    if (selectedItems.length === 0) {
      alert('청구서에 포함할 작업 항목을 선택해주세요.');
      return;
    }

    // 선택된 작업 항목들 가져오기
    const selectedWorkItems = workItems.filter(item => selectedItems.includes(item.id));
    
    // 완료된 항목만 필터링
    const completedSelectedItems = selectedWorkItems.filter(item => item.status === '완료');
    
    if (completedSelectedItems.length === 0) {
      alert('선택된 항목 중 완료된 작업 항목이 없습니다. 완료된 작업 항목만 청구서에 포함할 수 있습니다.');
      return;
    }

    if (completedSelectedItems.length < selectedItems.length) {
      const incompleteCount = selectedItems.length - completedSelectedItems.length;
      if (!window.confirm(`선택된 항목 중 ${incompleteCount}개는 완료되지 않아 청구서에 포함되지 않습니다. 완료된 ${completedSelectedItems.length}개 항목으로 청구서를 생성하시겠습니까?`)) {
        return;
      }
    }

    // 같은 건축주인지 확인
    const firstClientId = completedSelectedItems[0].clientId;
    const sameClient = completedSelectedItems.every(item => item.clientId === firstClientId);
    
    if (!sameClient) {
      alert('같은 건축주의 작업 항목만 하나의 청구서로 생성할 수 있습니다.');
      return;
    }

    // 이미 청구서에 포함된 항목 확인
    const unbilledItems = completedSelectedItems.filter(item => {
      return !invoices.some(invoice => 
        invoice.workItems.some(workItemInInvoice => 
          workItemInInvoice.name === item.name && 
          invoice.client === item.clientName
        )
      );
    });

    if (unbilledItems.length === 0) {
      alert('선택된 항목들이 이미 청구서에 포함되어 있습니다.');
      return;
    }

    // 작업장 정보 가져오기 (첫 번째 항목 기준)
    const firstItem = unbilledItems[0];
    const client = clients.find(c => c.id === firstItem.clientId);
    const workplace = client?.workplaces.find(w => w.id === firstItem.workplaceId);

    // 새로운 청구서 생성
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const workItemsForInvoice = unbilledItems.map(item => addWorkItemToInvoice(item));
    const totalAmount = workItemsForInvoice.reduce((sum, item) => sum + item.total, 0);

    const newInvoice = {
      id: newInvoiceId,
      client: firstItem.clientName,
      project: firstItem.projectName,
      workplaceAddress: workplace?.address || '',
      amount: totalAmount,
      status: '발송대기',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      workItems: workItemsForInvoice
    };

    // 청구서 추가
    setInvoices(prev => [...prev, newInvoice]);
    
    // 선택 항목 초기화
    setSelectedItems([]);

    // 성공 메시지와 함께 청구서 관리 페이지로 이동
    alert(`청구서 ${newInvoiceId}가 생성되었습니다! (${unbilledItems.length}개 항목 포함)`);
    navigate('/invoices');
  };

  // 개별 청구서 생성 함수 (기존 유지)
  const handleCreateInvoice = (workItem) => {
    // 해당 건축주의 완료된 작업 항목들을 가져옴
    const completedItems = getCompletedWorkItemsByClient(workItem.clientId);
    
    // 아직 청구서에 포함되지 않은 완료된 작업 항목들만 필터링
    const unbilledItems = completedItems.filter(item => {
      // 기존 청구서들을 확인해서 이미 청구된 작업인지 체크
      return !invoices.some(invoice => 
        invoice.workItems.some(workItemInInvoice => 
          workItemInInvoice.name === item.name && 
          invoice.client === item.clientName
        )
      );
    });

    if (unbilledItems.length === 0) {
      alert('청구 가능한 완료된 작업 항목이 없습니다.');
      return;
    }

    // 작업장 정보 가져오기
    const client = clients.find(c => c.id === workItem.clientId);
    const workplace = client?.workplaces.find(w => w.id === workItem.workplaceId);

    // 새로운 청구서 생성
    const newInvoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    const workItemsForInvoice = unbilledItems.map(item => addWorkItemToInvoice(item));
    const totalAmount = workItemsForInvoice.reduce((sum, item) => sum + item.total, 0);

    const newInvoice = {
      id: newInvoiceId,
      client: workItem.clientName,
      project: workItem.projectName,
      workplaceAddress: workplace?.address || '',
      amount: totalAmount,
      status: '발송대기',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14일 후
      workItems: workItemsForInvoice
    };

    // 청구서 추가
    setInvoices(prev => [...prev, newInvoice]);

    // 성공 메시지와 함께 청구서 관리 페이지로 이동
    alert(`청구서 ${newInvoiceId}가 생성되었습니다! 청구서 관리 페이지로 이동합니다.`);
    navigate('/invoices');
  };

  // Excel 관련 함수들
  const handleExportToExcel = () => {
    exportToExcel.workItems(filteredWorkItems);
  };

  const handleImportFromExcel = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const importedWorkItems = await importFromExcel.workItems(file);
        // ID 충돌 방지: 기존 최대 ID 이후로 재할당
        setWorkItems(prev => {
          const currentMax = prev.length ? Math.max(...prev.map(i => Number(i.id) || 0)) : 0;
          const remapped = importedWorkItems.map((it, idx) => ({
            ...it,
            id: currentMax + idx + 1
          }));
          return [...prev, ...remapped];
        });
        alert(`${importedWorkItems.length}개의 작업 항목을 가져왔습니다.`);
      } catch (error) {
        alert('Excel 파일을 가져오는 중 오류가 발생했습니다: ' + error.message);
      }
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    createTemplate.workItems();
  };

  const getCategoryColor = (category) => {
    const colors = {
      '토목공사': 'bg-brown-100 text-brown-800',
      '구조공사': 'bg-gray-100 text-gray-800',
      '철거공사': 'bg-red-100 text-red-800',
      '마감공사': 'bg-blue-100 text-blue-800',
      '설비공사': 'bg-yellow-100 text-yellow-800',
      '내부공사': 'bg-green-100 text-green-800',
      '기타': 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
    <div className="p-2 md:p-3">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">작업 항목 관리</h1>
            <p className="text-gray-600">작업 항목을 관리하고 진행을 확인하세요</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium tracking-tighter"
            >
              <span className="text-gray-500 mr-2">📁</span>
              <span className="text-xs font-semibold">템플릿 다운로드</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium tracking-tighter"
            >
              <span className="text-blue-500 mr-2">📤</span>
              <span className="text-xs font-semibold">Excel 가져오기</span>
            </button>
            <button
              onClick={handleExportToExcel}
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium tracking-tighter"
            >
              <span className="text-green-500 mr-2">📥</span>
              <span className="text-xs font-semibold">Excel 내보내기</span>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 font-medium tracking-tighter"
            >
              <span className="text-purple-500 mr-2">📋</span>
              <span className="text-xs font-semibold">일괄 작업 항목 추가</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-300 font-bold tracking-tighter"
            >
              <span className="text-yellow-300 mr-2">✨</span>
              <span className="text-xs font-bold">새 작업 항목</span>
            </button>
          </div>
        </div>
        
        {/* 건축주 및 프로젝트 필터 */}
        <div className="bg-white rounded-md shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-wrap">
              <span className="text-xs font-medium text-gray-500">필터:</span>
              
              <div className="relative inline-flex items-center">
                <select
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value);
                    setSelectedProject(''); // 건축주 변경시 프로젝트 필터 초기화
                  }}
                  className="border border-gray-300 rounded-md px-3 pr-8 py-1.5 bg-white text-xs text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0"
                >
                  <option value="">전체 건축주</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="relative inline-flex items-center">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className={`border border-gray-300 rounded-md px-3 pr-8 py-1.5 bg-white text-xs hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer min-w-0 ${
                    !selectedClient ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                  }`}
                  disabled={!selectedClient}
                >
                  <option value="">
                    {selectedClient ? '전체 프로젝트' : '건축주 선택 후'}
                  </option>
                  {selectedClient && getClientProjects(selectedClient).map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>
              
              <span className="text-xs text-gray-500">
                {(selectedClient || selectedProject) ? 
                  `${filteredWorkItems.length}개` : 
                  `총 ${workItems.length}개`
                }
              </span>
              
              {(selectedClient || selectedProject) && (
                <button
                  onClick={() => {
                    setSelectedClient('');
                    setSelectedProject('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  초기화
                </button>
              )}
            </div>

            {/* 일괄 작업 버튼들 */}
            <div className="flex items-center space-x-2">
              {selectedItems.length > 0 && (
                <>
                  <div className="flex items-center space-x-2 mr-2">
                    <label className="text-xs text-gray-600">상태 일괄 변경</label>
                    <select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">상태 선택</option>
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!bulkStatus) {
                          alert('변경할 상태를 선택하세요.');
                          return;
                        }
                        setWorkItems(prev => prev.map(item =>
                          selectedItems.includes(item.id) ? { ...item, status: bulkStatus } : item
                        ));
                        setBulkStatus('');
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-2 rounded flex items-center text-xs leading-none"
                    >
                      적용
                    </button>
                  </div>
                  <button
                    onClick={handleCreateBulkInvoice}
                    className="flex items-center justify-center px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 text-xs leading-none"
                  >
                    <span className="text-green-600 mr-1.5">📈</span>
                    <span className="font-semibold">청구서 생성 ({selectedItems.length})</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center justify-center px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 text-gray-700 text-xs leading-none"
                  >
                    <span className="text-red-600 mr-1.5">🗑️</span>
                    <span className="font-semibold">삭제 ({selectedItems.length})</span>
                  </button>
                </>
              )}
            </div>
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
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">
                {(selectedClient || selectedProject) ? '필터된 작업' : '총 작업 항목'}
              </p>
              <p className="text-base font-bold text-gray-900">{filteredWorkItems.length}건</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <WrenchScrewdriverIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
        
        <div className="bg-green-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">완료된 작업</p>
              <p className="text-base font-bold text-gray-900">
                {filteredWorkItems.filter(item => item.status === '완료').length}건
              </p>
            </div>
            <div className="bg-green-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
        
        <div className="bg-purple-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">진행 중인 작업</p>
              <p className="text-base font-bold text-gray-900">
                {filteredWorkItems.filter(item => item.status === '진행중').length}건
              </p>
            </div>
            <div className="bg-purple-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
        
        <div className="bg-orange-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 mb-2">총 작업 금액</p>
              <p className="text-base font-bold text-gray-900">
                {filteredWorkItems.reduce((sum, item) => sum + ((item.defaultPrice || 0) * (item.quantity || 1)) + getLaborCost(item), 0).toLocaleString()}원
              </p>
            </div>
            <div className="bg-orange-500 rounded-full p-3 text-white text-xl ml-4 flex items-center justify-center w-12 h-12">
              <CurrencyDollarIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* 작업 항목 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedItems.length > 0 && selectedItems.length === filteredWorkItems.length}
                  className="w-4 h-4 rounded border-gray-300"
                  title="전체 선택"
                />
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                건&nbsp;축&nbsp;주
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-52">
                내&nbsp;&nbsp;&nbsp;&nbsp;용
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
작 업 장
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-28">
                프로젝트
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-20">
카테고리
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-32">
                단가/수량
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-16">
                상&nbsp;&nbsp;&nbsp;&nbsp;태
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                날&nbsp;&nbsp;&nbsp;&nbsp;짜
              </th>
              <th className="px-3 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider w-32">
                작&nbsp;&nbsp;&nbsp;&nbsp;업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWorkItems.map((item, idx) => (
              <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    title="항목 선택"
                  />
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate w-16">{item.clientName}</div>
                </td>
                <td className="px-2 py-3 w-52">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.description}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate w-24">{item.workplaceName}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate w-28">{item.projectName}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-32 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {item.defaultPrice.toLocaleString()}원
                  </div>
                  <div className="text-xs text-gray-500">
                    × {item.quantity || 1} {item.unit}
                  </div>
                  <div className="text-xs text-gray-700 font-medium">
                    {(((item.defaultPrice || 0) * (item.quantity || 1)) + getLaborCost(item)).toLocaleString()}원
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-16">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === '완료' ? 'bg-green-100 text-green-800' :
                    item.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                    item.status === '보류' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap w-24">
                  <div className="text-sm text-gray-900">{item.date}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium w-24">
                  <div className="flex space-x-2">
                    <Tooltip label="편집">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="작업 항목 편집"
                      >
                        ✏️
                      </button>
                    </Tooltip>
                    <Tooltip label="삭제">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs leading-none bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-700"
                        title="작업 항목 삭제"
                      >
                        <span className="text-red-600">🗑️</span>
                      </button>
                    </Tooltip>
                    {item.status === '완료' && (
                      <Tooltip label="청구서 생성">
                        <button 
                          onClick={() => handleCreateInvoice(item)}
                          className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs leading-none bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-700"
                          title="청구서 생성"
                        >
                          <span className="text-green-600">🧾</span>
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* 작업 항목 추가/편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? '작업 항목 편집' : '새 작업 항목 추가'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">건축주</label>
                    <select
                      name="clientId"
                      value={newItem.clientId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">건축주 선택</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">작업장</label>
                    <select
                      name="workplaceId"
                      value={newItem.workplaceId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                      disabled={!newItem.clientId}
                    >
                      <option value="">작업장 선택</option>
                      {newItem.clientId && getClientWorkplaces(newItem.clientId).map(workplace => (
                        <option key={workplace.id} value={workplace.id}>
                          {workplace.name} - {workplace.address}
                        </option>
                      ))}
                    </select>
                    {!newItem.clientId && (
                      <p className="text-xs text-gray-500 mt-1">먼저 건축주를 선택하세요</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">프로젝트명</label>
                    {!showCustomProject ? (
                      <select
                        name="projectName"
                        value={newItem.projectName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                        disabled={!newItem.clientId}
                      >
                        <option value="">프로젝트 선택</option>
                        {newItem.clientId && getClientProjects(newItem.clientId).map(project => (
                          <option key={project} value={project}>{project}</option>
                        ))}
                        <option value="custom">+ 새 프로젝트 입력</option>
                      </select>
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="projectName"
                          value={newItem.projectName}
                          onChange={handleInputChange}
                          placeholder="새 프로젝트명 입력"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomProject(false);
                            setNewItem(prev => ({ ...prev, projectName: '' }));
                          }}
                          className="mt-1 px-2 py-2 text-gray-400 hover:text-gray-600"
                          title="기존 프로젝트 선택으로 돌아가기"
                        >
                          ↩
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">카테고리</label>
                    <select
                      name="category"
                      value={newItem.category}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* 작업일자 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">작업일자</label>
                  <div className="mt-1 relative inline-block" ref={calContainerRefSingle}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="date"
                        value={newItem.date || ''}
                        onChange={handleInputChange}
                        placeholder="YYYY-MM-DD"
                        inputMode="numeric"
                        className="block w-full border border-gray-300 rounded-md px-3 py-2"
                        onFocus={() => setCalendarOpenSingle(true)}
                        required
                      />
                      <button
                        type="button"
                        className="px-2 py-2 text-gray-600 hover:text-gray-800"
                        onClick={() => setCalendarOpenSingle((v) => !v)}
                        title="달력 열기"
                      >
                        📅
                      </button>
                    </div>
                    {calendarOpenSingle && (
                      <div
                        ref={calendarRefSingle}
                        className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-2 p-3"
                        style={{ transform: 'scale(2)', transformOrigin: 'top left' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={prevMonthSingle}>◀</button>
                          <div className="text-sm font-medium">
                            {calendarMonthSingle.getFullYear()}년 {calendarMonthSingle.getMonth() + 1}월
                          </div>
                          <button type="button" className="px-2 py-1 text-sm border rounded" onClick={nextMonthSingle}>▶</button>
                        </div>
                        <table className="text-xs select-none">
                          <thead>
                            <tr className="text-left text-gray-600">
                              {['일','월','화','수','목','금','토'].map((d, idx) => (
                                <th key={d} className={`px-2 py-1 ${idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : ''}`}>{d}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {renderCalendarRowsSingle()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">내용</label>
                    <input
                      type="text"
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">수량</label>
                    <input
                      type="text"
                      name="quantity"
                      value={newItem.quantity || ''}
                      onChange={handleInputChange}
                      placeholder="1"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">단위</label>
                    <select
                      name="unit"
                      value={newItem.unit}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">단위 선택</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">기본 단가</label>
                    <input
                      type="text"
                      name="defaultPrice"
                      value={newItem.defaultPrice ? formatNumberWithCommas(newItem.defaultPrice) : ''}
                      onChange={handleInputChange}
                      placeholder="예: 1,000,000"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">세부 작업</label>
                    <textarea
                      name="description"
                      value={newItem.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">비고</label>
                    <textarea
                      name="notes"
                      value={newItem.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="추가적인 메모나 특이사항을 입력하세요"
                    />
                  </div>
                </div>
                {/* 인부(선택) */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">일반 인부 인원(선택)</label>
                    <input
                      type="text"
                      name="laborPersonsGeneral"
                      value={newItem.laborPersonsGeneral || ''}
                      onChange={handleInputChange}
                      placeholder="예: 2"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">일반 인부 단가(선택)</label>
                    <input
                      type="text"
                      name="laborUnitRateGeneral"
                      value={newItem.laborUnitRateGeneral ? formatNumberWithCommas(newItem.laborUnitRateGeneral) : ''}
                      onChange={handleInputChange}
                      placeholder="예: 200,000"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">숙련 인부 인원(선택)</label>
                    <input
                      type="text"
                      name="laborPersons"
                      value={newItem.laborPersons || ''}
                      onChange={handleInputChange}
                      placeholder="예: 1"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">숙련 인부 단가(선택)</label>
                    <input
                      type="text"
                      name="laborUnitRate"
                      value={newItem.laborUnitRate ? formatNumberWithCommas(newItem.laborUnitRate) : ''}
                      onChange={handleInputChange}
                      placeholder="예: 300,000"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                {(getLaborCost(newItem) > 0) && (
                  <div className="text-sm text-gray-600">
                    인부비 소계: {getLaborCost(newItem).toLocaleString()}원
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <select
                    name="status"
                    value={newItem.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    {editingItem ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 작업 항목 추가 모달 */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">일괄 작업 항목 추가</h3>
              <form onSubmit={handleBulkSubmit} className="space-y-6">
                
                {/* 공통 정보 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800 mb-3">공통 정보</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">건축주</label>
                      <select
                        name="clientId"
                        value={bulkBaseInfo.clientId}
                        onChange={handleBulkBaseInfoChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        <option value="">건축주 선택</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">작업장</label>
                      <select
                        name="workplaceId"
                        value={bulkBaseInfo.workplaceId}
                        onChange={handleBulkBaseInfoChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                        disabled={!bulkBaseInfo.clientId}
                      >
                        <option value="">작업장 선택</option>
                        {bulkBaseInfo.clientId && getClientWorkplaces(bulkBaseInfo.clientId).map(workplace => (
                          <option key={workplace.id} value={workplace.id}>
                            {workplace.name} - {workplace.address}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">프로젝트명</label>
                      {!showBulkCustomProject ? (
                        <select
                          name="projectName"
                          value={bulkBaseInfo.projectName}
                          onChange={handleBulkBaseInfoChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                          disabled={!bulkBaseInfo.clientId}
                        >
                          <option value="">프로젝트 선택</option>
                          {bulkBaseInfo.clientId && getClientProjects(bulkBaseInfo.clientId).map(project => (
                            <option key={project} value={project}>{project}</option>
                          ))}
                          <option value="custom">+ 새 프로젝트 입력</option>
                        </select>
                      ) : (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            name="projectName"
                            value={bulkBaseInfo.projectName}
                            onChange={handleBulkBaseInfoChange}
                            placeholder="새 프로젝트명 입력"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowBulkCustomProject(false);
                              setBulkBaseInfo(prev => ({ ...prev, projectName: '' }));
                            }}
                            className="mt-1 px-2 py-2 text-gray-400 hover:text-gray-600"
                            title="기존 프로젝트 선택으로 돌아가기"
                          >
                            ↩
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">작업일자</label>
                      <div className="mt-1 relative inline-block" ref={calContainerRefBulk}>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            name="date"
                            value={bulkBaseInfo.date || ''}
                            onChange={handleBulkBaseInfoChange}
                            placeholder="YYYY-MM-DD"
                            inputMode="numeric"
                            className="block w-full border border-gray-300 rounded-md px-3 py-2"
                            onFocus={() => setCalendarOpenBulk(true)}
                            required
                          />
                          <button
                            type="button"
                            className="px-2 py-2 text-gray-600 hover:text-gray-800"
                            onClick={() => setCalendarOpenBulk((v) => !v)}
                            title="달력 열기"
                          >
                            📅
                          </button>
                        </div>
                        {calendarOpenBulk && (
                          <div
                            ref={calendarRefBulk}
                            className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-2 p-3"
                            style={{ transform: 'scale(2)', transformOrigin: 'top left' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={prevMonthBulk}>◀</button>
                              <div className="text-sm font-medium">
                                {calendarMonthBulk.getFullYear()}년 {calendarMonthBulk.getMonth() + 1}월
                              </div>
                              <button type="button" className="px-2 py-1 text-sm border rounded" onClick={nextMonthBulk}>▶</button>
                            </div>
                            <table className="text-xs select-none">
                              <thead>
                                <tr className="text-left text-gray-600">
                                  {['일','월','화','수','목','금','토'].map((d, idx) => (
                                    <th key={d} className={`px-2 py-1 ${idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : ''}`}>{d}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {renderCalendarRowsBulk()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* 공통 인부(선택) - 일반 작업자 */}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">공통 인부 인원(일반·선택)</label>
                      <input
                        type="text"
                        name="bulkLaborPersons"
                        value={bulkBaseInfo.bulkLaborPersons || ''}
                        onChange={handleBulkBaseInfoChange}
                        placeholder="예: 2"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">공통 인부 단가(일반·선택)</label>
                      <input
                        type="text"
                        name="bulkLaborUnitRate"
                        value={bulkBaseInfo.bulkLaborUnitRate ? formatNumberWithCommas(bulkBaseInfo.bulkLaborUnitRate) : ''}
                        onChange={handleBulkBaseInfoChange}
                        placeholder="예: 200,000"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                {/* 작업 항목들 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-800">작업 항목들</h4>
                    <button
                      type="button"
                      onClick={addBulkItem}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {bulkItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">작업 항목 #{index + 1}</span>
                          {bulkItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBulkItem(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">내용</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleBulkItemChange(index, 'name', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                            <select
                              value={item.category}
                              onChange={(e) => handleBulkItemChange(index, 'category', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            >
                              <option value="">카테고리 선택</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">수량</label>
                            <input
                              type="text"
                              value={item.quantity || ''}
                              onChange={(e) => handleBulkItemChange(index, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
                            <select
                              value={item.unit}
                              onChange={(e) => handleBulkItemChange(index, 'unit', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            >
                              <option value="">단위 선택</option>
                              {units.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">기본 단가</label>
                            <input
                              type="text"
                              value={item.defaultPrice ? formatNumberWithCommas(item.defaultPrice) : ''}
                              onChange={(e) => handleBulkItemChange(index, 'defaultPrice', e.target.value)}
                              placeholder="예: 1,000,000"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상태</label>
                            <select
                              value={item.status}
                              onChange={(e) => handleBulkItemChange(index, 'status', e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 인부(선택) - 기술자 */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">인부 인원(기술자·선택)</label>
                            <input
                              type="text"
                              value={item.laborPersons || ''}
                              onChange={(e) => handleBulkItemChange(index, 'laborPersons', e.target.value)}
                              placeholder="예: 2"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">인부 단가(기술자·선택)</label>
                            <input
                              type="text"
                              value={item.laborUnitRate ? formatNumberWithCommas(item.laborUnitRate) : ''}
                              onChange={(e) => handleBulkItemChange(index, 'laborUnitRate', e.target.value)}
                              placeholder="예: 200,000"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                        </div>

                        {/* 인부 합계 미리보기 (일반 + 기술자) */}
                        {(getLaborCost(item) > 0) && (
                          <div className="text-xs text-gray-600">
                            인부비 소계: {getLaborCost({
                              ...item,
                              laborPersonsGeneral: item.laborPersonsGeneral ?? bulkBaseInfo.bulkLaborPersons,
                              laborUnitRateGeneral: item.laborUnitRateGeneral ?? bulkBaseInfo.bulkLaborUnitRate,
                            }).toLocaleString()}원
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">세부 작업</label>
                            <textarea
                              value={item.description}
                              onChange={(e) => handleBulkItemChange(index, 'description', e.target.value)}
                              rows="2"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
                            <textarea
                              value={item.notes}
                              onChange={(e) => handleBulkItemChange(index, 'notes', e.target.value)}
                              rows="2"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="추가적인 메모나 특이사항을 입력하세요"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    {bulkItems.length}개 항목 일괄 추가
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default WorkItems;
