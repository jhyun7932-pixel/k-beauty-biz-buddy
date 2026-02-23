import React, { useState } from 'react';
import { Download, FileArchive, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareModal } from './ShareModal';
import { downloadAllAsZip, downloadSinglePDF } from '@/lib/export/pdfExport';
import type { BuyerGoal, BuyerPackFile } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ExportBarProps {
  onExport: (type: 'pdf' | 'zip' | 'link') => void;
  disabled?: boolean;
  packageReady?: boolean;
  goal: BuyerGoal | null;
  files: BuyerPackFile[];
}

export function ExportBar({ onExport, disabled, packageReady, goal, files }: ExportBarProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'zip' | null>(null);
  const { toast } = useToast();

  const handleExport = async (type: 'pdf' | 'zip') => {
    if (!goal) {
      toast({
        title: '목표 설정 필요',
        description: '먼저 보낼 나라/채널을 선택해 주세요.',
        variant: 'destructive',
      });
      return;
    }

    setExporting(type);
    
    try {
      if (type === 'pdf') {
        // 첫 번째 준비된 파일을 PDF로 다운로드
        const readyFile = files.find(f => f.ready);
        if (readyFile) {
          await downloadSinglePDF(goal, readyFile.type, readyFile.name);
        }
      } else {
        // 모든 파일을 ZIP으로 다운로드
        await downloadAllAsZip(goal, files);
      }
      
      onExport(type);
      toast({
        title: type === 'pdf' ? 'PDF 다운로드 완료!' : 'ZIP 다운로드 완료!',
        description: '파일이 성공적으로 생성되었습니다.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: '다운로드 실패',
        description: '파일 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <div className="sticky bottom-0 p-4 bg-card border-t border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            disabled={disabled || !packageReady || exporting !== null}
            onClick={() => handleExport('pdf')}
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF로 저장
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            disabled={disabled || !packageReady || exporting !== null}
            onClick={() => handleExport('zip')}
          >
            {exporting === 'zip' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileArchive className="h-4 w-4" />
            )}
            ZIP로 받기
          </Button>
          
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            disabled={disabled || !packageReady}
            onClick={() => setShowShareModal(true)}
          >
            <Link2 className="h-4 w-4" />
            링크로 공유
          </Button>
        </div>

        {packageReady && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            ⓘ 초안입니다. 최종 제출 전 확인이 필요합니다.
          </p>
        )}
      </div>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        onConfirm={() => {
          onExport('link');
          setShowShareModal(false);
        }}
      />
    </>
  );
}
