import React, { useState, useEffect } from 'react';
import { Download, FileText, FileType, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { BuyerGoal, BuyerPackFile } from '@/types';
import { getPreviewHTML } from '@/lib/export/pdfExport';
import { downloadSinglePDF, downloadSingleWord } from '@/lib/export/pdfExport';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHTML } from '@/lib/sanitize';

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  file: BuyerPackFile | null;
  goal: BuyerGoal | null;
}

export function DocumentPreviewModal({ open, onClose, file, goal }: DocumentPreviewModalProps) {
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'word' | null>(null);
  const [zoom, setZoom] = useState(100);
  const { toast } = useToast();

  useEffect(() => {
    if (open && file && goal) {
      setLoading(true);
      // 비동기적으로 HTML 생성
      setTimeout(() => {
        const html = getPreviewHTML(goal, file.type);
        setPreviewHTML(html);
        setLoading(false);
      }, 100);
    } else {
      setPreviewHTML('');
      setZoom(100);
    }
  }, [open, file, goal]);

  const handleDownload = async (format: 'pdf' | 'word') => {
    if (!file || !goal) return;
    
    setDownloading(format);
    try {
      if (format === 'pdf') {
        await downloadSinglePDF(goal, file.type, file.name);
      } else {
        await downloadSingleWord(goal, file.type, file.name);
      }
      toast({
        title: `${format.toUpperCase()} 다운로드 완료!`,
        description: `${file.name}이(가) 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: '다운로드 실패',
        description: '파일 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(150, Math.max(50, prev + delta)));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {file?.name || '문서 미리보기'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustZoom(-10)}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustZoom(10)}
                  disabled={zoom >= 150}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Download Buttons */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleDownload('pdf')}
                disabled={downloading !== null || loading}
              >
                {downloading === 'pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleDownload('word')}
                disabled={downloading !== null || loading}
              >
                {downloading === 'word' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileType className="h-4 w-4" />
                )}
                Word
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">문서 로딩 중...</p>
              </div>
            </div>
          ) : (
            <div 
              className="bg-white rounded-lg shadow-lg mx-auto transition-transform origin-top"
              style={{ 
                transform: `scale(${zoom / 100})`,
                maxWidth: '800px',
                transformOrigin: 'top center'
              }}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(previewHTML) }}
                className="document-preview"
              />
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-border bg-muted/20 text-center flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            ⓘ 이 문서는 초안입니다. 최종 제출 전 내용을 반드시 확인해 주세요.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
