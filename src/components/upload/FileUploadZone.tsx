import React, { useRef, useState, useCallback } from 'react';
import { Upload, FileText, Image, X, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOCR } from '@/hooks/useOCR';
import type { Ingredient } from '@/types';

interface FileUploadZoneProps {
  onFilesUploaded: (files: File[]) => void;
  onIngredientsExtracted?: (ingredients: Ingredient[]) => void;
  type: 'company' | 'product';
}

export function FileUploadZone({ onFilesUploaded, onIngredientsExtracted, type }: FileUploadZoneProps) {
  const { isAuthenticated, user } = useAuth();
  const { extractFromImage, uploadImage, loading: ocrLoading, error: ocrError } = useOCR();
  
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const config = {
    company: {
      label: '회사소개서(PDF) 업로드',
      accept: '.pdf',
      icon: FileText,
      hint: 'PDF 파일을 올려주세요',
      enableOCR: false,
    },
    product: {
      label: '제품 성분표/라벨 사진 업로드',
      accept: '.pdf,.jpg,.jpeg,.png,.webp',
      icon: Image,
      hint: '사진은 글자가 또렷할수록 정확해져요',
      enableOCR: true,
    },
  };

  const { label, accept, icon: Icon, hint, enableOCR } = config[type];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = async (newFiles: File[]) => {
    setError(null);
    const validFiles = newFiles.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      if (type === 'company' && ext !== 'pdf') {
        setError('파일을 읽기 어려워요. PDF 파일로 다시 올려주세요.');
        return false;
      }
      // 파일 크기 제한: 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      onFilesUploaded(validFiles);
      
      // 이미지 파일이고 OCR이 활성화된 경우 자동 추출
      if (enableOCR && onIngredientsExtracted) {
        for (const file of validFiles) {
          if (file.type.startsWith('image/')) {
            await processImageWithOCR(file);
          }
        }
      }
    }
  };

  const processImageWithOCR = async (file: File) => {
    setProcessingFile(file.name);
    
    // 인증된 사용자라면 Storage에 업로드
    if (isAuthenticated && user) {
      await uploadImage(file, user.id);
    }
    
    // OCR 추출
    const result = await extractFromImage(file);
    
    if (result.data && result.data.ingredients) {
      onIngredientsExtracted?.(result.data.ingredients);
      setProcessedFiles(prev => new Set([...prev, file.name]));
    }
    
    setProcessingFile(null);
  };

  const removeFile = (index: number) => {
    const removedFile = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    setProcessedFiles(prev => {
      const next = new Set(prev);
      next.delete(removedFile.name);
      return next;
    });
  };

  const displayError = error || ocrError;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`dropzone p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging ? 'dropzone-active' : 'hover:border-primary/50 hover:bg-primary/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-full ${isDragging ? 'bg-accent-mint/20' : 'bg-muted/20'}`}>
            {isDragging ? (
              <Upload className="h-6 w-6 text-accent-mint" />
            ) : (
              <Icon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isDragging ? '여기에 놓으세요!' : '여기로 파일을 끌어다 놓으세요'}
          </p>
          <p className="text-xs text-muted-foreground/70">
            ⓘ {hint}
          </p>
          {enableOCR && (
            <p className="text-xs text-primary/70">
              ✨ AI가 자동으로 성분을 추출합니다
            </p>
          )}
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {displayError}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const isProcessing = processingFile === file.name;
            const isProcessed = processedFiles.has(file.name);
            
            return (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isProcessed 
                    ? 'bg-success/10 border-success/30' 
                    : isProcessing 
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted/20 border-border'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                  ) : isProcessed ? (
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm text-foreground truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isProcessing && (
                    <span className="text-xs text-primary">AI 분석 중...</span>
                  )}
                  {isProcessed && (
                    <span className="text-xs text-success">추출 완료</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
