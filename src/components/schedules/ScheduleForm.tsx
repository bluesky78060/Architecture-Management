/* eslint-disable */
import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import type { Schedule, ScheduleType, ScheduleStatus, SchedulePriority, Client } from '../../types/domain';
import { detectScheduleConflicts, formatConflictMessage } from '../../utils/scheduleConflict';
import { uploadFile, getFileIcon } from '../../services/fileUploadService';
import type { Attachment } from '../../types/domain';
import { supabase } from '../../services/supabase';

interface Props {
  schedule: Schedule | null;
  onClose: () => void;
}

export default function ScheduleForm({ schedule, onClose }: Props) {
  const { saveSchedule, clients, schedules } = useApp();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('construction');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [clientId, setClientId] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ScheduleStatus>('scheduled');
  const [priority, setPriority] = useState<SchedulePriority>('normal');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);

  // Conflict detection
  const [conflicts, setConflicts] = useState<Schedule[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);

  // Load existing schedule data
  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title);
      setDescription(schedule.description || '');
      setScheduleType(schedule.scheduleType);
      setStartDate(schedule.startDate);
      setStartTime(schedule.startTime || '');
      setEndDate(schedule.endDate || '');
      setEndTime(schedule.endTime || '');
      setAllDay(schedule.allDay);
      setClientId(schedule.clientId || '');
      setLocation(schedule.location || '');
      setStatus(schedule.status);
      setPriority(schedule.priority);
      setNotes(schedule.notes || '');
      setReminderEnabled(schedule.reminderEnabled);
      setReminderMinutesBefore(schedule.reminderMinutesBefore || 30);
      setIsRecurring(schedule.isRecurring);
      if (schedule.recurrenceRule) {
        setRecurrenceFrequency(schedule.recurrenceRule.frequency);
        setRecurrenceInterval(schedule.recurrenceRule.interval);
        setRecurrenceEndDate(schedule.recurrenceRule.endDate || '');
        setRecurrenceDaysOfWeek(schedule.recurrenceRule.daysOfWeek || []);
      }
      setAttachments(schedule.attachments || []);
    }
  }, [schedule]);

  // Detect schedule conflicts
  useEffect(() => {
    // Skip conflict detection if missing required fields
    if (!title.trim() || !startDate) {
      setConflicts([]);
      return;
    }

    // Create temporary schedule for conflict checking
    const tempSchedule: Schedule = {
      id: schedule?.id || 0,
      userId: '',
      title: title.trim(),
      description: description.trim() || undefined,
      scheduleType,
      startDate,
      startTime: allDay ? undefined : startTime || undefined,
      endDate: endDate || undefined,
      endTime: allDay ? undefined : endTime || undefined,
      allDay,
      clientId: clientId || undefined,
      clientName: undefined,
      status,
      priority,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      reminderEnabled,
      reminderMinutesBefore: reminderEnabled ? reminderMinutesBefore : undefined,
      isRecurring,
      recurrenceRule: isRecurring ? {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        endDate: recurrenceEndDate || undefined,
        daysOfWeek: recurrenceFrequency === 'weekly' && recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : undefined,
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Filter out current schedule if editing
    const otherSchedules = schedule
      ? schedules.filter(s => s.id !== schedule.id)
      : schedules;

    // Detect conflicts
    const detectedConflicts = detectScheduleConflicts(tempSchedule, otherSchedules);
    setConflicts(detectedConflicts);
    setShowConflictWarning(detectedConflicts.length > 0);
  }, [
    title, startDate, startTime, endDate, endTime, allDay,
    isRecurring, recurrenceFrequency, recurrenceInterval, recurrenceEndDate, recurrenceDaysOfWeek,
    schedules, schedule, scheduleType, clientId, status, priority, location, notes,
    reminderEnabled, reminderMinutesBefore, description
  ]);

  // File upload handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);

    try {
      if (!supabase) {
        alert('데이터베이스 연결 오류');
        return;
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        alert('로그인이 필요합니다.');
        return;
      }

      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile(file, user.data.user.id, schedule?.id || 0);

        if (result.success && result.url && result.path) {
          newAttachments.push({
            name: file.name,
            url: result.url,
            type: file.type,
          });
        } else {
          alert(`파일 업로드 실패: ${file.name}\n${result.error}`);
        }
      }

      setAttachments([...attachments, ...newAttachments]);
    } catch (error: any) {
      console.error('File upload error:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingFiles(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleRemoveAttachment = async (index: number) => {
    // Note: We don't delete from storage here because the file path is embedded in the URL
    // and we would need to store the path separately. For now, just remove from state.

    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !startDate) {
      alert('제목과 시작일은 필수입니다.');
      return;
    }

    const clientName = clientId ? clients.find((c: Client) => c.id === clientId)?.name : undefined;

    const newSchedule: Schedule = {
      id: schedule?.id || 0,
      userId: '', // Will be set by AppContext
      title: title.trim(),
      description: description.trim() || undefined,
      scheduleType,
      startDate,
      startTime: allDay ? undefined : startTime || undefined,
      endDate: endDate || undefined,
      endTime: allDay ? undefined : endTime || undefined,
      allDay,
      clientId: clientId || undefined,
      clientName,
      status,
      priority,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      reminderEnabled: reminderEnabled,
      reminderMinutesBefore: reminderEnabled ? reminderMinutesBefore : undefined,
      isRecurring: isRecurring,
      recurrenceRule: isRecurring ? {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        endDate: recurrenceEndDate || undefined,
        daysOfWeek: recurrenceFrequency === 'weekly' && recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : undefined,
      } : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: schedule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveSchedule(newSchedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-800/50 dark:bg-gray-900/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto w-[980px] max-w-[95vw] shadow-2xl rounded-2xl bg-white/80 dark:bg-gray-800/90 ring-1 ring-black/5 dark:ring-white/10 mb-8">
        <div className="rounded-t-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-gray-800 px-8 pt-5 pb-3">
          <div className="text-center">
            <h3 className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
              {schedule ? '일정 수정' : '일정 추가'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              공사 일정과 상담 일정을 등록하고 관리하세요
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-4">
          {/* 충돌 경고 */}
          {showConflictWarning && conflicts.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ 일정 충돌 감지
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>{formatConflictMessage(conflicts)}</p>
                    <div className="mt-2">
                      <p className="font-medium">충돌하는 일정:</p>
                      <ul className="mt-1 list-disc list-inside">
                        {conflicts.map(conflict => (
                          <li key={conflict.id}>
                            {conflict.title} ({conflict.startDate}{conflict.startTime ? ` ${conflict.startTime}` : ''})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowConflictWarning(false)}
                      className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
                    >
                      무시하고 계속하기 →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 기본 정보 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3 gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">📝</span>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">기본 정보</h4>
            </div>

            {/* 제목 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* 설명 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* 일정 유형 & 상태 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  유형 *
                </label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="construction">공사</option>
                  <option value="consultation">상담</option>
                  <option value="meeting">회의</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  상태
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="scheduled">예정</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>
            </div>
          </div>

          {/* 일시 정보 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3 gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">📅</span>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">일시 정보</h4>
            </div>

            {/* 종일 체크박스 */}
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="allDay"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="allDay" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                종일
              </label>
            </div>

            {/* 시작 날짜/시간 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  시작일 *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {!allDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* 종료 날짜/시간 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {!allDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 관련 정보 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3 gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">👥</span>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">관련 정보</h4>
            </div>

            {/* 건축주 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                건축주
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">선택 안함</option>
                {clients.map((client: Client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 장소 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                장소
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* 우선순위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                우선순위
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SchedulePriority)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
          </div>

          {/* 추가 정보 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3 gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">📌</span>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">추가 정보</h4>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                메모
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 알림 설정 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="reminderEnabled"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="reminderEnabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                🔔 알림 받기
              </label>
            </div>

            {reminderEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  알림 시간
                </label>
                <select
                  value={reminderMinutesBefore}
                  onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={15}>15분 전</option>
                  <option value={30}>30분 전</option>
                  <option value={60}>1시간 전</option>
                  <option value={120}>2시간 전</option>
                  <option value={1440}>1일 전</option>
                </select>
              </div>
            )}
          </div>

          {/* 반복 일정 설정 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                🔄 반복 일정
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-3">
                {/* 반복 유형 & 간격 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      반복 유형
                    </label>
                    <select
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                      <option value="yearly">매년</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      간격
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* 요일 선택 (주간 반복인 경우만) */}
                {recurrenceFrequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      요일 선택
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (recurrenceDaysOfWeek.includes(index)) {
                              setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter(d => d !== index));
                            } else {
                              setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, index]);
                            }
                          }}
                          className={`px-3 py-1 rounded-md text-sm ${
                            recurrenceDaysOfWeek.includes(index)
                              ? 'bg-blue-600 text-white dark:bg-blue-500'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 종료일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    반복 종료일 (선택)
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 첨부파일 섹션 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📎 첨부파일
            </label>

            {/* File input */}
            <div className="mb-3">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploadingFiles}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-medium cursor-pointer
                  ${uploadingFiles
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                {uploadingFiles ? '업로드 중...' : '파일 선택'}
              </label>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                최대 10MB
              </span>
            </div>

            {/* Attachments list */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl">{getFileIcon(attachment.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {attachment.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                      >
                        다운로드
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-md transition font-bold"
            >
              {schedule ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
