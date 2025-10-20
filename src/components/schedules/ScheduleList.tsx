/* eslint-disable */
import { useApp } from '../../contexts/AppContext';
import type { Schedule } from '../../types/domain';
import { getFileIcon } from '../../services/fileUploadService';

interface Props {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
}

export default function ScheduleList({ schedules, onEdit }: Props) {
  const { deleteSchedule, saveSchedule } = useApp();

  /* eslint-disable no-console */
  console.log('📅 [ScheduleList] Schedules data:', schedules);
  /* eslint-enable no-console */

  const getTypeBadge = (type: string) => {
    const styles = {
      construction: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      consultation: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
      meeting: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400',
      other: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400',
    };
    const labels = {
      construction: '공사',
      consultation: '상담',
      meeting: '회의',
      other: '기타',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const handleDelete = (id: number) => {
    if (window.confirm('일정을 삭제하시겠습니까?')) {
      deleteSchedule(id);
    }
  };

  const handleStatusChange = async (schedule: Schedule, newStatus: string) => {
    const updatedSchedule = {
      ...schedule,
      status: newStatus as Schedule['status'],
      updatedAt: new Date().toISOString(),
    };
    await saveSchedule(updatedSchedule);
  };

  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">등록된 일정이 없습니다.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          상단의 &quot;+ 일정 추가&quot; 버튼을 눌러 일정을 등록하세요.
        </p>
      </div>
    );
  }

  // 빈 상태 표시
  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">등록된 일정이 없습니다.</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">상단의 "일정 추가" 버튼을 클릭해서 새 일정을 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule: Schedule) => (
        <div
          key={schedule.id}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getTypeBadge(schedule.scheduleType)}

                {/* 상태 변경 드롭다운 */}
                <select
                  value={schedule.status}
                  onChange={(e) => handleStatusChange(schedule, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2 py-1 text-xs rounded-full border-0 cursor-pointer ${
                    schedule.status === 'scheduled' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                    schedule.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                    schedule.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}
                >
                  <option value="scheduled">📅 예정</option>
                  <option value="in_progress">⏳ 진행중</option>
                  <option value="completed">✅ 완료</option>
                  <option value="cancelled">❌ 취소</option>
                </select>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {schedule.title}
              </h3>

              {schedule.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {schedule.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>{schedule.startDate}</span>
                  {schedule.startTime && <span>{schedule.startTime}</span>}
                </div>

                {schedule.clientName && (
                  <div className="flex items-center gap-1">
                    <span>👤</span>
                    <span>{schedule.clientName}</span>
                  </div>
                )}

                {schedule.location && (
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{schedule.location}</span>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {schedule.attachments && schedule.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📎 첨부파일 ({schedule.attachments.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schedule.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <span>{getFileIcon(attachment.name)}</span>
                        <span className="max-w-[200px] truncate">{attachment.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(schedule)}
                className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              >
                편집
              </button>
              <button
                onClick={() => handleDelete(schedule.id)}
                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
