import React, { useState } from 'react';
import { FileText, Check, Package, AlertCircle, Store, MapPin, ListChecks, Download, FileType, Loader2, Eye } from 'lucide-react';
import type { BuyerPackFile, BuyerGoal, SalesChannel } from '@/types';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { EmptyStateCard } from './EmptyStateCard';
import { ExportBar } from '@/components/export/ExportBar';
import { DocumentPreviewModal } from '@/components/export/DocumentPreviewModal';
import { getTranslations, getChannelChecklist } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { downloadSinglePDF, downloadSingleWord } from '@/lib/export/pdfExport';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BuyerPackageTabProps {
  files: BuyerPackFile[];
  goal: BuyerGoal | null;
  onExport: (type: 'pdf' | 'zip' | 'link') => void;
  isSampleMode?: boolean;
}

export function BuyerPackageTab({ files, goal, onExport, isSampleMode }: BuyerPackageTabProps) {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<BuyerPackFile | null>(null);
  const { toast } = useToast();
  const fileIcons: Record<string, React.ReactNode> = {
    one_pager: <FileText className="h-5 w-5" />,
    summary: <FileText className="h-5 w-5" />,
    quality_cert: <FileText className="h-5 w-5" />,
    terms: <FileText className="h-5 w-5" />,
    email_template: <FileText className="h-5 w-5" />,
    channel_checklist: <ListChecks className="h-5 w-5" />,
  };

  const handleDownloadFile = async (file: BuyerPackFile, format: 'pdf' | 'word') => {
    if (!goal || !file.ready) return;
    
    setDownloadingFile(`${file.id}-${format}`);
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
      setDownloadingFile(null);
    }
  };

  // 목표가 없는 경우
  if (!goal) {
    return <EmptyStateCard type="no_goal" />;
  }

  // 패키지가 없는 경우
  if (files.length === 0) {
    return <EmptyStateCard type="no_package" />;
  }

  const readyCount = files.filter(f => f.ready).length;
  const packageReady = readyCount === files.length;
  const t = getTranslations(goal.language);
  const channelChecklist = goal.channel ? getChannelChecklist(goal.language, goal.channel) : [];
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';

  return (
    <div className="flex flex-col h-full">
      <StatusBanner status="draft" />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header with Goal Badge */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">바이어에게 보낼 패키지</h2>
          <div className="flex items-center gap-2">
            {isSampleMode && <span className="badge-sample">샘플</span>}
            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {goal.countries.join('/')} · {channelLabel}
            </span>
          </div>
        </div>

        {/* Current Goal Summary */}
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="text-sm">
            <span className="text-foreground font-medium">{goal.countries.join(' · ')}</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-foreground">{channelLabel}</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-muted-foreground">{goal.language} · {goal.currency}</span>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-3">
          {files.map((file) => {
            const isDownloading = downloadingFile?.startsWith(file.id);
            
            return (
              <div 
                key={file.id}
                className={`card-elevated p-4 flex items-center gap-4 ${
                  file.ready ? 'cursor-pointer hover:border-primary/50 transition-colors' : 'opacity-60'
                }`}
                onClick={() => file.ready && setPreviewFile(file)}
              >
                <div className={`p-2 rounded-lg ${file.ready ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground'}`}>
                  {fileIcons[file.type] || <FileText className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{file.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {file.ready ? '클릭하여 미리보기' : '준비 필요'}
                  </p>
                </div>
                {file.countryBadge && (
                  <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded hidden sm:inline">
                    {file.countryBadge}
                  </span>
                )}
                
                {/* 미리보기 버튼 */}
                {file.ready && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 hidden sm:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span>미리보기</span>
                  </Button>
                )}
                
                {/* 개별 다운로드 버튼 */}
                {file.ready && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5"
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">다운로드</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDownloadFile(file, 'pdf')}
                        disabled={isDownloading}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF로 저장
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDownloadFile(file, 'word')}
                        disabled={isDownloading}
                      >
                        <FileType className="h-4 w-4 mr-2" />
                        Word로 저장
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {file.ready ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </div>
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning" />
                )}
              </div>
            );
          })}
        </div>

        {/* Channel-specific Checklist */}
        {goal.channel && channelChecklist.length > 0 && (
          <div className="card-elevated p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-accent-mint" />
              {channelLabel} {t.channelChecklist}
              <span className="badge-confirm ml-auto">{goal.channel === 'online_market' ? '리스팅' : goal.channel === 'retail' ? '입점' : '도매'}</span>
            </h3>
            <div className="space-y-2">
              {channelChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full border-2 border-muted/50 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ZIP Contents Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/10 rounded-lg">
          <p className="font-medium mb-1">ZIP 패키지 구성:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>One-page.pdf (브랜드 소개서)</li>
            <li>Catalog.pdf (제품 카탈로그)</li>
            <li>Readiness_Summary.pdf (수출 준비 요약)</li>
            <li>Deal_Sheet.pdf (거래 조건 요약표)</li>
            <li>Email_Templates.pdf (이메일 문구)</li>
            {goal.channel && <li>{channelLabel}_Checklist.pdf</li>}
          </ul>
        </div>
      </div>

      {/* Export Bar */}
      <ExportBar 
        onExport={onExport} 
        packageReady={readyCount > 0} 
        goal={goal}
        files={files}
      />
      
      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewFile !== null}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        goal={goal}
      />
    </div>
  );
}
