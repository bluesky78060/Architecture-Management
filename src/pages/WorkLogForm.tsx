import { logger } from '../utils/logger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

interface WorkLogData {
  project_id: number;
  work_date: string;
  area: string;
  weather: string;
  process_status: string;
  notes: string;
}

interface WorkItemData {
  task_code: string;
  task_name: string;
  specification: string;
  quantity: number;
  unit: string;
  progress_rate: number;
}

interface LaborData {
  trade: string;
  persons: number;
  hours: number;
  rate_type: 'daily' | 'hourly';
  unit_rate: number;
  _rec?: {
    recommended_rate: number;
    rate_type: 'daily' | 'hourly';
    sample_size: number;
    historical_median?: number | null;
    p25?: number | null;
    p75?: number | null;
    standard_reference?: number | null;
    confidence: number;
    notes: string[];
  };
}

interface EquipmentData {
  equipment_name: string;
  specification: string;
  units: number;
  hours: number;
  hourly_rate: number;
  mobilization_fee: number;
}

interface MaterialData {
  material_name: string;
  specification: string;
  quantity: number;
  unit: string;
  unit_price: number;
  supplier: string;
}

export default function WorkLogForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<WorkLogData>();
  const [workItems, setWorkItems] = useState<WorkItemData[]>([]);
  const [laborEntries, setLaborEntries] = useState<LaborData[]>([]);
  const [equipmentEntries] = useState<EquipmentData[]>([]);
  const [materialEntries] = useState<MaterialData[]>([]);

  const addWorkItem = () => {
    setWorkItems([...workItems, {
      task_code: '',
      task_name: '',
      specification: '',
      quantity: 0,
      unit: '',
      progress_rate: 100
    }]);
  };

  const addLaborEntry = () => {
    setLaborEntries([...laborEntries, {
      trade: '',
      persons: 0,
      hours: 8,
      rate_type: 'daily',
      unit_rate: 0
    }]);
  };

  // Helpers for adding equipment/material entries were unused; remove to satisfy TS6133.

  const onSubmit = async (data: WorkLogData) => {
    const fullWorkLogData = {
      ...data,
      work_items: workItems,
      labor_entries: laborEntries,
      equipment_entries: equipmentEntries,
      material_entries: materialEntries,
    };

    try {
      await api.post('/work_logs/', fullWorkLogData);
      alert('작업일지가 성공적으로 저장되었습니다.');
      // Optionally, reset form or redirect
    } catch (error) {
      logger.error('Error saving work log:', error);
      alert('작업일지 저장 중 오류가 발생했습니다.');
    }
  };

  const fetchLaborRecommendation = async (index: number) => {
    const labor = laborEntries[index];
    if (!labor.trade) {
      alert('먼저 직종을 선택하세요.');
      return;
    }
    try {
      const pidRaw = watch('project_id') as unknown as string | number | undefined;
      const pid = pidRaw ? Number(pidRaw) : undefined;
      const params: Record<string, string | number> = {
        trade: labor.trade,
        rate_type: labor.rate_type,
      };
      if (pid && !Number.isNaN(pid)) params.project_id = pid;

      const res = await api.get('/recommendations/labor', { params });
      const rec = res.data as LaborData['_rec'];

      const newLabor = [...laborEntries];
      newLabor[index].unit_rate = Number(rec?.recommended_rate ?? newLabor[index].unit_rate);
      newLabor[index]._rec = {
        recommended_rate: Number(rec?.recommended_rate ?? 0),
        rate_type: labor.rate_type,
        sample_size: Number(rec?.sample_size ?? 0),
        historical_median: rec?.historical_median ?? null,
        p25: rec?.p25 ?? null,
        p75: rec?.p75 ?? null,
        standard_reference: rec?.standard_reference ?? null,
        confidence: Number(rec?.confidence ?? 0),
        notes: Array.isArray(rec?.notes) ? rec!.notes : [],
      };
      setLaborEntries(newLabor);
    } catch (e) {
      logger.error(e);
      alert('추천 단가 조회 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">작업일지 입력</h1>
        <p className="mt-2 text-sm text-gray-600">
          현장 작업 내용과 투입 인력, 장비, 자재를 입력하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 기본 정보 */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">기본 정보</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현장 선택
              </label>
              <select {...register('project_id', { required: '현장을 선택하세요' })} className="input-field">
                <option value="">현장을 선택하세요</option>
                <option value="1">아파트 신축공사 A동</option>
                <option value="2">오피스텔 B동</option>
              </select>
              {errors.project_id && <p className="mt-1 text-sm text-red-600">{errors.project_id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업일자
              </label>
              <input 
                type="date" 
                {...register('work_date', { required: '작업일자를 입력하세요' })}
                className="input-field"
              />
              {errors.work_date && <p className="mt-1 text-sm text-red-600">{errors.work_date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업구역
              </label>
              <input 
                type="text" 
                {...register('area')}
                placeholder="예: 15층, A동 지하1층"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날씨
              </label>
              <select {...register('weather')} className="input-field">
                <option value="">날씨 선택</option>
                <option value="맑음">맑음</option>
                <option value="흐림">흐림</option>
                <option value="비">비</option>
                <option value="눈">눈</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공정상태
              </label>
              <input 
                type="text" 
                {...register('process_status')}
                placeholder="예: 타일부착공사 진행 중"
                className="input-field"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비고사항
            </label>
            <textarea 
              {...register('notes')}
              rows={3}
              placeholder="특이사항이나 추가 설명을 입력하세요"
              className="input-field"
            />
          </div>
        </div>

        {/* 작업 항목 */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">작업 항목</h3>
            <button 
              type="button" 
              onClick={addWorkItem}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              항목 추가
            </button>
          </div>

          {workItems.map((item, index) => (
            <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용
                  </label>
                  <input 
                    type="text" 
                    value={item.task_name}
                    onChange={(e) => {
                      const newItems = [...workItems];
                      newItems[index].task_name = e.target.value;
                      setWorkItems(newItems);
                    }}
                    placeholder="예: 타일부착공사"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    규격/치수
                  </label>
                  <input 
                    type="text" 
                    value={item.specification}
                    onChange={(e) => {
                      const newItems = [...workItems];
                      newItems[index].specification = e.target.value;
                      setWorkItems(newItems);
                    }}
                    placeholder="예: 300×600mm"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수량
                  </label>
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...workItems];
                      newItems[index].quantity = Number(e.target.value);
                      setWorkItems(newItems);
                    }}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    단위
                  </label>
                  <input 
                    type="text" 
                    value={item.unit}
                    onChange={(e) => {
                      const newItems = [...workItems];
                      newItems[index].unit = e.target.value;
                      setWorkItems(newItems);
                    }}
                    placeholder="예: m², EA, m"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button 
                  type="button"
                  onClick={() => {
                    const newItems = workItems.filter((_, i) => i !== index);
                    setWorkItems(newItems);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 인부 투입 */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">인부 투입</h3>
            <button 
              type="button" 
              onClick={addLaborEntry}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              인부 추가
            </button>
          </div>

          {laborEntries.map((labor, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">직종</label>
                  <select 
                    value={labor.trade}
                    onChange={(e) => {
                      const newLabor = [...laborEntries];
                      newLabor[index].trade = e.target.value;
                      setLaborEntries(newLabor);
                    }}
                    className="input-field"
                  >
                    <option value="">직종 선택</option>
                    <option value="목공">목공</option>
                    <option value="철근공">철근공</option>
                    <option value="타일공">타일공</option>
                    <option value="미장공">미장공</option>
                    <option value="보통인부">보통인부</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">인원</label>
                  <input 
                    type="number" 
                    value={labor.persons}
                    onChange={(e) => {
                      const newLabor = [...laborEntries];
                      newLabor[index].persons = Number(e.target.value);
                      setLaborEntries(newLabor);
                    }}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                  <input 
                    type="number" 
                    value={labor.hours}
                    onChange={(e) => {
                      const newLabor = [...laborEntries];
                      newLabor[index].hours = Number(e.target.value);
                      setLaborEntries(newLabor);
                    }}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">단가구분</label>
                  <select 
                    value={labor.rate_type}
                    onChange={(e) => {
                      const newLabor = [...laborEntries];
                      newLabor[index].rate_type = e.target.value as 'daily' | 'hourly';
                      setLaborEntries(newLabor);
                    }}
                    className="input-field"
                  >
                    <option value="daily">일당</option>
                    <option value="hourly">시급</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">단가</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number" 
                      value={labor.unit_rate}
                      onChange={(e) => {
                        const newLabor = [...laborEntries];
                        newLabor[index].unit_rate = Number(e.target.value);
                        setLaborEntries(newLabor);
                      }}
                      className="input-field flex-1"
                    />
                    <button 
                      type="button" 
                      className="btn-secondary whitespace-nowrap"
                      onClick={() => fetchLaborRecommendation(index)}
                    >
                      추천 단가
                    </button>
                  </div>
                  {labor._rec && (
                    <div className="mt-2 text-xs text-gray-600">
                      추천: ₩{labor._rec.recommended_rate.toLocaleString()} ({labor._rec.rate_type === 'daily' ? '일당' : '시급'}) · 샘플 {labor._rec.sample_size}건 · 신뢰도 {(labor._rec.confidence * 100).toFixed(0)}%
                      {typeof labor._rec.standard_reference === 'number' && (
                        <>
                          {' '}· 표준 ₩{Number(labor._rec.standard_reference).toLocaleString()}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  총 노무비: ₩{(labor.persons * labor.hours * labor.unit_rate).toLocaleString()}
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const newLabor = laborEntries.filter((_, i) => i !== index);
                    setLaborEntries(newLabor);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-3">
          <button type="button" className="btn-secondary">
            취소
          </button>
          <button type="submit" className="btn-primary">
            작업일지 저장
          </button>
        </div>
      </form>
    </div>
  );
}
