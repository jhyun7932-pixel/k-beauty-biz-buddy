import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Ingredient } from '@/types';

interface OCRResult {
  ingredients: Ingredient[];
  warnings: string[];
  rawText: string;
}

interface OCRState {
  loading: boolean;
  error: string | null;
  result: OCRResult | null;
}

export function useOCR() {
  const [state, setState] = useState<OCRState>({
    loading: false,
    error: null,
    result: null,
  });

  // 이미지를 Base64로 변환
  const imageToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/...;base64, 부분 제거
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // 이미지에서 성분 추출
  const extractFromImage = useCallback(async (file: File) => {
    setState({ loading: true, error: null, result: null });

    try {
      const base64 = await imageToBase64(file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-extract`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64 }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'OCR 처리에 실패했습니다');
      }

      const data = await response.json();
      
      setState({
        loading: false,
        error: null,
        result: {
          ingredients: data.ingredients || [],
          warnings: data.warnings || [],
          rawText: data.rawText || '',
        },
      });

      return { data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다';
      setState({ loading: false, error: message, result: null });
      return { error: message };
    }
  }, [imageToBase64]);

  // 텍스트에서 성분 추출 (수동 입력 또는 복사/붙여넣기)
  const extractFromText = useCallback(async (text: string) => {
    setState({ loading: true, error: null, result: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-extract`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ rawText: text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '성분 분석에 실패했습니다');
      }

      const data = await response.json();
      
      setState({
        loading: false,
        error: null,
        result: {
          ingredients: data.ingredients || [],
          warnings: data.warnings || [],
          rawText: data.rawText || text,
        },
      });

      return { data };
    } catch (error) {
      const message = error instanceof Error ? error.message : '성분 분석 중 오류가 발생했습니다';
      setState({ loading: false, error: message, result: null });
      return { error: message };
    }
  }, []);

  // 이미지 URL에서 성분 추출
  const extractFromUrl = useCallback(async (imageUrl: string) => {
    setState({ loading: true, error: null, result: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-extract`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ imageUrl }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'OCR 처리에 실패했습니다');
      }

      const data = await response.json();
      
      setState({
        loading: false,
        error: null,
        result: {
          ingredients: data.ingredients || [],
          warnings: data.warnings || [],
          rawText: data.rawText || '',
        },
      });

      return { data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다';
      setState({ loading: false, error: message, result: null });
      return { error: message };
    }
  }, []);

  // Storage에 이미지 업로드
  const uploadImage = useCallback(async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-labels')
      .upload(fileName, file);

    if (uploadError) {
      return { error: uploadError };
    }

    // Signed URL 생성 (private bucket이므로)
    const { data: signedData } = await supabase.storage
      .from('product-labels')
      .createSignedUrl(fileName, 3600); // 1시간 유효

    return { 
      data: { 
        path: fileName,
        signedUrl: signedData?.signedUrl,
      } 
    };
  }, []);

  // 상태 초기화
  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null });
  }, []);

  return {
    ...state,
    extractFromImage,
    extractFromText,
    extractFromUrl,
    uploadImage,
    reset,
  };
}
