import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  /* eslint-disable no-console */
  console.log('🔵 [Settings] Component rendering...');
  /* eslint-enable no-console */

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="mt-2 text-gray-600">계정 정보를 관리하세요</p>
      </div>

      {/* 현재 사용자 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <UserCircleIcon className="w-6 h-6 mr-2 text-blue-600" />
          테스트 페이지
        </h2>
        <div className="space-y-3">
          <p className="text-gray-900">설정 페이지가 정상적으로 표시됩니다.</p>
          <p className="text-gray-600">콘솔을 확인해주세요.</p>
          <p className="text-sm text-gray-500">
            ✅ Settings 컴포넌트가 정상적으로 렌더링되고 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
