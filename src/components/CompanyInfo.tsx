import { useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { checkStorageAvailable, getStorageInfo, imageToBase64, saveStampImage, removeStampImage } from '../utils/imageStorage';
import { storage } from '../services/storage';
import type { CompanyInfo as CompanyInfoType } from '../types/domain';
import ConfirmDialog from './ConfirmDialog';

type StorageInfo = { used: string; stampImageSize: string; folderPath?: string };

export default function CompanyInfo(): JSX.Element {
  const { companyInfo, setCompanyInfo, units, setUnits, categories, setCategories, stampImage, setStampImage } = useApp();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<CompanyInfoType>({ ...companyInfo });

  const [newUnit, setNewUnit] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [storageInfo, setStorageInfoState] = useState<StorageInfo>({ used: '0 KB', stampImageSize: '0 KB' });
  const [dataDir, setDataDir] = useState<string>('');
  const [browserDirName, setBrowserDirName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUnit, setPendingUnit] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [showConfirmRemoveStamp, setShowConfirmRemoveStamp] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      // 저장소 정보 업데이트
      if (checkStorageAvailable()) {
        const info = await getStorageInfo();
        setStorageInfoState(info);
      }

      // 데이터 디렉토리 정보
      try {
        if (window.cms !== undefined && typeof window.cms.getBaseDir === 'function') {
          const dir = await window.cms.getBaseDir();
          if (dir !== undefined) setDataDir(dir);
        }
      } catch (_) {}
      try {
        const info = await storage.getBrowserDirectoryInfo?.();
        if (info?.name !== undefined) setBrowserDirName(info.name);
      } catch (_) {}
    })();
  }, [stampImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value } as CompanyInfoType));
  };

  const handleSave = () => {
    setCompanyInfo(editForm);
    setIsEditing(false);
    alert('건축업체 정보가 저장되었습니다.');
  };

  const handleCancel = () => {
    setEditForm({ ...companyInfo });
    setIsEditing(false);
  };

  const handleAddUnit = () => {
    const v = newUnit.trim();
    if (v.length > 0 && !units.includes(v)) {
      setUnits(prev => [...prev, v]);
      setNewUnit('');
      alert('새로운 단위가 추가되었습니다.');
    } else if (units.includes(v)) {
      alert('이미 존재하는 단위입니다.');
    }
  };

  const handleRemoveUnit = (unit: string) => {
    setPendingUnit(unit);
  };
  const confirmRemoveUnit = () => {
    if (pendingUnit === null) return;
    setUnits(prev => prev.filter(u => u !== pendingUnit));
    setPendingUnit(null);
    alert('단위가 삭제되었습니다.');
  };

  const handleAddCategory = () => {
    const v = newCategory.trim();
    if (v.length > 0 && !categories.includes(v)) {
      setCategories(prev => [...prev, v]);
      setNewCategory('');
      alert('새로운 카테고리가 추가되었습니다.');
    } else if (categories.includes(v)) {
      alert('이미 존재하는 카테고리입니다.');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setPendingCategory(category);
  };
  const confirmRemoveCategory = () => {
    if (pendingCategory === null) return;
    setCategories(prev => prev.filter(c => c !== pendingCategory));
    setPendingCategory(null);
    alert('카테고리가 삭제되었습니다.');
  };

  const KB_SIZE = 1024;
  const MB_SIZE = 1024;
  const MAX_FILE_SIZE_MB = 2;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * KB_SIZE * MB_SIZE; // 2MB
  const BYTES_TO_KB = KB_SIZE;

  const handleStampImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files ?? [])[0];
    if (file === undefined) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다. (JPG, PNG, GIF 등)');
      if (fileInputRef.current !== null) fileInputRef.current.value = '';
      return;
    }

    // 파일 크기 검증 (2MB로 제한)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`이미지 파일 크기는 2MB를 초과할 수 없습니다.\n현재 파일 크기: ${Math.round(file.size / BYTES_TO_KB)}KB`);
      if (fileInputRef.current !== null) fileInputRef.current.value = '';
      return;
    }
    
    try {
      const imageDataUrl = await imageToBase64(file);

      // 1. Supabase에 저장 (companyInfo 업데이트하면 자동 저장)
      setCompanyInfo({ ...companyInfo, stampImage: imageDataUrl });
      setStampImage(imageDataUrl);

      // 2. IndexedDB에도 백업 저장 (옵션)
      await saveStampImage(imageDataUrl);

      // 저장소 정보 업데이트
      if (checkStorageAvailable()) {
        const info = await getStorageInfo();
        setStorageInfoState(info);
      }
      alert('도장 이미지가 성공적으로 저장되었습니다.');
    } catch (error) {
      alert('이미지 처리 중 오류가 발생했습니다.\n파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.');
      if (fileInputRef.current !== null) fileInputRef.current.value = '';
    }
  };

  const requestRemoveStampImage = () => setShowConfirmRemoveStamp(true);
  const confirmRemoveStampImage = async () => {
    try {
      // 1. Supabase에서 삭제 (companyInfo 업데이트하면 자동 저장)
      setCompanyInfo({ ...companyInfo, stampImage: undefined });
      setStampImage(null);

      // 2. IndexedDB에서도 삭제
      await removeStampImage();

      if (fileInputRef.current !== null) fileInputRef.current.value = '';
      alert('도장 이미지가 완전히 삭제되었습니다.');
    } catch (error) {
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
    setShowConfirmRemoveStamp(false);
  };


  return (
    <>
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">환경설정</h1>
        <p className="text-gray-600">건축업체 정보와 시스템 설정을 관리하세요</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-8 mb-8">
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">업체 정보 관리</h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">수정</button>
            ) : (
              <div className="space-x-2">
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">저장</button>
                <button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">취소</button>
              </div>
            )}
          </div>

          <div className="p-6 flex-1">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">업체명 *</label>
                  {isEditing ? (
                    <input type="text" name="name" value={editForm.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">사업자등록번호 *</label>
                  {isEditing ? (
                    <input type="text" name="businessNumber" value={editForm.businessNumber ?? ''} onChange={handleInputChange} placeholder="000-00-00000" className="w-full border border-gray-300 rounded-md px-3 py-2" required />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.businessNumber}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">대표자명 *</label>
                  {isEditing ? (
                    <input type="text" name="representative" value={editForm.representative ?? ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.representative}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">전화번호 *</label>
                  {isEditing ? (
                    <input type="tel" name="phone" value={editForm.phone ?? ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                {isEditing ? (
                  <input type="email" name="email" value={editForm.email ?? ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                ) : (
                  <p className="text-gray-900 py-2">{companyInfo.email ?? '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주소 *</label>
                {isEditing ? (
                  <input type="text" name="address" value={editForm.address ?? ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
                ) : (
                  <p className="text-gray-900 py-2">{companyInfo.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                  {isEditing ? (
                    <input type="text" name="bankAccount" value={editForm.bankAccount ?? ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.bankAccount ?? '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">예금주명</label>
                  {isEditing ? (
                    <input type="text" name="accountHolder" value={editForm.accountHolder ?? ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                  ) : (
                    <p className="text-gray-900 py-2">{companyInfo.accountHolder ?? '-'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">여기서 설정한 정보는 생성되는 모든 청구서/견적서에 자동으로 포함됩니다. 정확한 정보를 입력해주세요.</p>
            </div>
          </div>
        </div>

        {/* 시스템 설정 */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">시스템 설정</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* 단위 관리 */}
            <div>
              <h3 className="font-medium mb-2">단위 관리</h3>
              <div className="flex gap-2">
                <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="새 단위 입력" className="border rounded px-3 py-2 text-sm flex-1" />
                <button onClick={handleAddUnit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm">추가</button>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {units.map(u => (
                  <span key={u} className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {u}
                    <button onClick={() => handleRemoveUnit(u)} className="ml-2 text-red-600">✕</button>
                  </span>
                ))}
              </div>
            </div>

            {/* 카테고리 관리 */}
            <div>
              <h3 className="font-medium mb-2">카테고리 관리</h3>
              <div className="flex gap-2">
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="새 카테고리 입력" className="border rounded px-3 py-2 text-sm flex-1" />
                <button onClick={handleAddCategory} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm">추가</button>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {categories.map(c => (
                  <span key={c} className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {c}
                    <button onClick={() => handleRemoveCategory(c)} className="ml-2 text-red-600">✕</button>
                  </span>
                ))}
              </div>
            </div>

            {/* 도장 이미지 */}
            <div>
              <h3 className="font-medium mb-2">도장 이미지</h3>
              <input 
                ref={fileInputRef} 
                id="stamp-image" 
                type="file" 
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                onChange={handleStampImageChange} 
                className="hidden" 
              />
              <div className="flex items-center gap-2 mb-3">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  📷 이미지 선택
                </button>
                {stampImage !== null && (
                  <button 
                    onClick={requestRemoveStampImage} 
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    🗑️ 삭제
                  </button>
                )}
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                {stampImage !== null ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={stampImage} 
                      alt="업로드된 도장 이미지" 
                      className="w-20 h-20 object-contain border border-gray-200 rounded bg-white shadow-sm" 
                    />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-green-600 mb-1">✅ 도장 이미지가 등록되었습니다</p>
                      <p>청구서 출력 시 자동으로 표시됩니다</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">도장 이미지가 등록되지 않았습니다</p>
                    <p className="text-xs text-gray-400">JPG, PNG, GIF 파일 (최대 2MB)</p>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                💡 <strong>팁:</strong> 투명 배경의 PNG 파일을 사용하면 더 깔끔하게 표시됩니다
              </div>
            </div>

            {/* 저장소 정보 및 디렉토리 설정 */}
            <div className="space-y-2">
              <div className="text-xs text-gray-600">저장소 사용량: {storageInfo.used} | 도장 이미지: {storageInfo.stampImageSize}</div>
              <div className="space-y-1">
                {dataDir.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm">현재 디렉토리: <span className="font-mono">{dataDir}</span></div>
                    <button
                      onClick={async () => {
                        try {
                          const dir = await window.cms?.chooseBaseDir?.();
                          if (dir !== undefined) {
                            setDataDir(dir);
                            alert('데이터 저장 위치가 변경되었습니다.');
                          }
                        } catch (_) {
                          alert('디렉토리 선택 중 오류가 발생했습니다.');
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm"
                    >
                      디렉토리 변경(Electron)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">브라우저 저장 방식</div>
                    {browserDirName.length > 0 ? (
                      <div className="text-sm">선택된 폴더: <span className="font-mono bg-gray-50 border rounded px-2 py-1">{browserDirName}</span></div>
                    ) : (
                      <div className="text-sm text-gray-500">기본 저장소(localStorage)를 사용 중입니다.</div>
                    )}
                    {'showDirectoryPicker' in window ? (
                      <button
                        onClick={async () => {
                          const ok = await storage.chooseBrowserDirectory?.();
                          if (ok === true) {
                            const info = await storage.getBrowserDirectoryInfo?.();
                            setBrowserDirName(info?.name ?? '');
                            alert('브라우저 폴더가 설정되었습니다.');
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm"
                      >
                        브라우저 폴더 선택(Edge/Chrome)
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500">이 브라우저는 폴더 선택을 지원하지 않습니다.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ConfirmDialog
      open={pendingUnit != null}
      title="단위 삭제"
      message={`'${pendingUnit ?? ''}' 단위를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      confirmText="삭제"
      cancelText="취소"
      onConfirm={confirmRemoveUnit}
      onCancel={() => setPendingUnit(null)}
    />
    <ConfirmDialog
      open={pendingCategory != null}
      title="카테고리 삭제"
      message={`'${pendingCategory ?? ''}' 카테고리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      confirmText="삭제"
      cancelText="취소"
      onConfirm={confirmRemoveCategory}
      onCancel={() => setPendingCategory(null)}
    />
    <ConfirmDialog
      open={showConfirmRemoveStamp}
      title="도장 이미지 삭제"
      message="도장 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      confirmText="삭제"
      cancelText="취소"
      onConfirm={confirmRemoveStampImage}
      onCancel={() => setShowConfirmRemoveStamp(false)}
    />
    </>
  );
}
