import React, { useState, useRef } from 'react';
import { sanitizeHTML } from '@/lib/sanitize';
import { 
  CheckCircle2, 
  Download, 
  Mail, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut,
  X,
  FileText,
  Edit3,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentInstance, DOC_METADATA } from '@/stores/projectStore';
import { toast } from 'sonner';

interface DocumentPreviewPanelProps {
  document: DocumentInstance | null;
  onFinalize?: (docId: string) => void;
  onDownload?: (docId: string, format: 'pdf' | 'word') => void;
  className?: string;
}

export function DocumentPreviewPanel({
  document,
  onFinalize,
  onDownload,
  className = '',
}: DocumentPreviewPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!document) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-center p-8 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">문서를 선택하세요</h3>
        <p className="text-sm text-muted-foreground">
          좌측에서 문서를 클릭하면<br />미리보기가 표시됩니다.
        </p>
      </div>
    );
  }

  const meta = DOC_METADATA[document.docKey];
  const isFinal = document.status === 'final';

  const handleZoomIn = () => setZoom(prev => Math.min(200, prev + 20));
  const handleZoomOut = () => setZoom(prev => Math.max(50, prev - 20));
  const handleZoomReset = () => setZoom(100);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${document.title}</title>
            <style>
              body { font-family: 'Noto Sans KR', Arial, sans-serif; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${sanitizeHTML(document.html)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleFinalize = () => {
    if (onFinalize) {
      onFinalize(document.id);
    }
  };

  const handleDownload = (format: 'pdf' | 'word') => {
    if (onDownload) {
      onDownload(document.id, format);
    } else {
      toast.info('다운로드 기능 준비 중입니다.');
    }
  };

  const PreviewContent = ({ fullscreen = false }: { fullscreen?: boolean }) => (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-3 border-b bg-card flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{meta?.icon || '📄'}</span>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{document.title}</h3>
            <p className="text-xs text-muted-foreground">
              {isFinal ? '최종 확정됨 - 수정 불가' : '초안 - 편집 가능'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 mr-2 border-r pr-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button 
              onClick={handleZoomReset}
              className="text-xs text-muted-foreground w-10 text-center hover:text-foreground transition-colors"
            >
              {zoom}%
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Fullscreen toggle */}
          {!fullscreen && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(true)}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Print */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-2 border-b bg-muted/30 flex items-center gap-2 flex-shrink-0">
        {!isFinal ? (
          <>
            <Badge variant="secondary" className="gap-1">
              <Edit3 className="h-3 w-3" />
              초안
            </Badge>
            <div className="flex-1" />
            <Button size="sm" onClick={handleFinalize} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              최종 확정
            </Button>
          </>
        ) : (
          <>
            <Badge className="gap-1 bg-green-600 text-primary-foreground hover:bg-green-700">
              <CheckCircle2 className="h-3 w-3" />
              최종본
            </Badge>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => handleDownload('pdf')} className="gap-1.5">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDownload('word')} className="gap-1.5">
              <Download className="h-4 w-4" />
              Word
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Mail className="h-4 w-4" />
              이메일
            </Button>
          </>
        )}
      </div>

      {/* Preview content with scroll - Fixed height container */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ 
          height: fullscreen ? 'calc(100vh - 180px)' : 'calc(100vh - 280px)',
          minHeight: 0,
        }}
      >
        <div className="bg-muted/20 min-h-full p-4">
          <div 
            className="bg-white transition-transform"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              width: zoom > 100 ? `${100 / (zoom / 100)}%` : '100%',
            }}
          >
            <div 
              className="shadow-lg rounded-lg overflow-visible mx-auto"
              style={{ maxWidth: '800px' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(document.html) }}
            />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      {!isFinal && (
        <div className="p-2 border-t bg-muted/20 text-center flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            💡 채팅에서 "MOQ를 1000으로 바꿔줘" 같은 명령으로 수정할 수 있어요
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={`flex flex-col overflow-hidden ${className}`}>
        <PreviewContent />
      </div>

      {/* Fullscreen modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-3 border-b flex-shrink-0 flex-row items-center justify-between space-y-0">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{meta?.icon || '📄'}</span>
              {document.title}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <PreviewContent fullscreen />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
