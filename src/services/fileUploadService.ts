/* eslint-disable */
import { supabase } from './supabase';

const STORAGE_BUCKET = 'schedule-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 파일 업로드 서비스
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * 파일을 Supabase Storage에 업로드합니다.
 * @param file 업로드할 파일
 * @param userId 사용자 ID
 * @param scheduleId 일정 ID
 * @returns 업로드 결과
 */
export async function uploadFile(
  file: File,
  userId: string,
  scheduleId: number
): Promise<UploadResult> {
  try {
    // 파일 크기 체크
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: '파일 크기는 10MB를 초과할 수 없습니다.',
      };
    }

    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${scheduleId}/${fileName}`;

    // Supabase Storage에 업로드
    if (!supabase) {
      return {
        success: false,
        error: '데이터베이스 연결 오류',
      };
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ File upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Public URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('❌ Unexpected file upload error:', error);
    return {
      success: false,
      error: error.message || '파일 업로드 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Supabase Storage에서 파일을 삭제합니다.
 * @param filePath 파일 경로
 * @returns 삭제 성공 여부
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return false;
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('❌ File delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected file delete error:', error);
    return false;
  }
}

/**
 * 파일명에서 확장자를 제외한 원본 이름을 추출합니다.
 * @param fileName 파일명
 * @returns 원본 파일명
 */
export function getOriginalFileName(fileName: string): string {
  // timestamp와 random string 제거
  const parts = fileName.split('-');
  if (parts.length >= 2) {
    return parts.slice(1).join('-');
  }
  return fileName;
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환합니다.
 * @param bytes 바이트 크기
 * @returns 포맷된 문자열
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 파일 타입에 따른 아이콘을 반환합니다.
 * @param fileName 파일명
 * @returns 아이콘 문자열
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    // 이미지
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    // 문서
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📊',
    pptx: '📊',
    // 압축
    zip: '📦',
    rar: '📦',
    // 기타
    txt: '📃',
  };

  return iconMap[ext || ''] || '📎';
}
