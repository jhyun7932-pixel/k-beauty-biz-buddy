import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  CheckSquare, 
  FolderOpen, 
  History, 
  FileText, 
  Download,
  Check,
  Circle,
  AlertTriangle,
  Loader2,
  Package
} from 'lucide-react';
import { DealStagePreset, PRESET_CONFIGS, DocumentTile, Task } from '@/hooks/usePresetState';
import { cn } from '@/lib/utils';
import { DocumentPreview } from './DocumentPreview';
import type { ActiveDocument } from '@/hooks/useDocumentRunner';
import type { CrossCheckResult, DocumentSet } from '@/lib/crosscheck/crossCheckEngine';
import type { ConfirmationQuestion, ConfirmationAnswer } from '@/lib/crosscheck/confirmationQuestions';

interface WorkAreaProps {
  selectedPreset: DealStagePreset;
  completedTasks: string[];
  generatedDocs: string[];
  onGenerateDoc: (docId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onExportPackage: () => void;
  isGenerating?: boolean;
  currentGeneratingDoc?: string;
  // New props for document runner
  activeDoc?: ActiveDocument | null;
  onFinalizeDoc?: () => void;
  onSaveToDocStore?: () => void;
  onPrintDoc?: () => void;
  onEditDoc?: () => void;
  onCloseDoc?: () => void;
  hasBlockingIssues?: boolean;
  // Cross-check specific props
  isCrossCheckReport?: boolean;
  onApplyAllFixes?: () => void;
  onAskAI?: (questions: ConfirmationQuestion[], answers: ConfirmationAnswer[]) => void;
  onApplyFix?: (findingId: string, actionIndex: number) => void;
  crossCheckResult?: CrossCheckResult | null;
  documentSet?: DocumentSet | null;
  projectName?: string;
  brandName?: string;
  // Cross-check gating
  requiresCrossCheckGate?: boolean;
  crossCheckCompleted?: boolean;
}

export function WorkArea({
  selectedPreset,
  completedTasks,
  generatedDocs,
  onGenerateDoc,
  onCompleteTask,
  onExportPackage,
  isGenerating = false,
  currentGeneratingDoc,
  activeDoc = null,
  onFinalizeDoc = () => {},
  onSaveToDocStore = () => {},
  onPrintDoc = () => {},
  onEditDoc = () => {},
  onCloseDoc = () => {},
  hasBlockingIssues = false,
  isCrossCheckReport = false,
  onApplyAllFixes,
  onAskAI,
  onApplyFix,
  crossCheckResult,
  documentSet,
  projectName,
  brandName,
  requiresCrossCheckGate = false,
  crossCheckCompleted = false,
}: WorkAreaProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const config = PRESET_CONFIGS[selectedPreset];

  const taskProgress = (completedTasks.length / config.tasks.length) * 100;
  const docProgress = (generatedDocs.length / config.documents.filter(d => !d.optional).length) * 100;

  // Handle document click - generate and switch to preview
  const handleDocClick = (docId: string, isGenerated: boolean) => {
    if (!isGenerated && !isGenerating) {
      onGenerateDoc(docId);
      // Auto-switch to preview tab when generating
      setActiveTab('preview');
    } else if (isGenerated) {
      // If already generated, switch to preview
      setActiveTab('preview');
    }
  };


  const getPreviewContent = () => {
    switch (selectedPreset) {
      case 'PROPOSAL':
        return {
          title: 'Company/Brand Deck',
          subtitle: '표지 + 목차 미리보기',
          badge: null,
        };
      case 'SAMPLE':
        return {
          title: 'Sample PI',
          subtitle: '견적서 첫 페이지',
          badge: null,
        };
      case 'BULK':
        return {
          title: 'Final PI',
          subtitle: '최종 견적서',
          badge: '실수 체크 필요',
        };
      default:
        return {
          title: '문서 미리보기',
          subtitle: '프리셋을 선택하세요',
          badge: null,
        };
    }
  };

  const previewContent = getPreviewContent();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with progress */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{config.ctaLabel}</span>
          </div>
          <Button 
            size="sm" 
            onClick={onExportPackage}
            disabled={docProgress < 50}
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            ZIP 내보내기
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-1">
            <span>문서</span>
            <Progress value={docProgress} className="h-1.5 flex-1" />
            <span>{generatedDocs.length}/{config.documents.filter(d => !d.optional).length}</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span>작업</span>
            <Progress value={taskProgress} className="h-1.5 flex-1" />
            <span>{completedTasks.length}/{config.tasks.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card px-2 h-10 shrink-0">
          <TabsTrigger value="preview" className="gap-1.5 text-xs data-[state=active]:bg-background">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5 text-xs data-[state=active]:bg-background">
            <CheckSquare className="h-3.5 w-3.5" />
            Checklist
            {completedTasks.length < config.tasks.length && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {config.tasks.length - completedTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5 text-xs data-[state=active]:bg-background">
            <FolderOpen className="h-3.5 w-3.5" />
            Files
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {generatedDocs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs data-[state=active]:bg-background">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Preview Tab - Now uses DocumentPreview */}
        <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
          {activeDoc ? (
            <DocumentPreview
              activeDoc={activeDoc}
              onFinalize={onFinalizeDoc}
              onSaveToDocs={onSaveToDocStore}
              onPrint={onPrintDoc}
              onEdit={onEditDoc}
              onClose={onCloseDoc}
              hasBlockingIssues={hasBlockingIssues}
              isCrossCheckReport={isCrossCheckReport}
              onApplyAllFixes={onApplyAllFixes}
              onAskAI={onAskAI}
              onApplyFix={onApplyFix}
              crossCheckResult={crossCheckResult}
              documentSet={documentSet}
              projectName={projectName}
              brandName={brandName}
              requiresCrossCheckGate={requiresCrossCheckGate}
              crossCheckCompleted={crossCheckCompleted}
            />
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/30">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI가 생성 중…</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-primary">Generate</span>
                  <span>→</span>
                  <span>Edit</span>
                  <span>→</span>
                  <span>Finalize</span>
                </div>
                {currentGeneratingDoc && (
                  <p className="text-xs text-muted-foreground mt-2">
                    현재: {config.documents.find(d => d.id === currentGeneratingDoc)?.nameKr}
                  </p>
                )}
              </div>
            </div>
          ) : generatedDocs.length > 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/30">
              <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{previewContent.title}</h3>
                      <p className="text-xs text-muted-foreground">{previewContent.subtitle}</p>
                    </div>
                    {previewContent.badge && (
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {previewContent.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Mock document preview */}
                  <div className="aspect-[3/4] bg-muted/50 rounded border border-dashed border-border flex items-center justify-center">
                    <div className="text-center p-4">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        문서를 선택하면 미리보기가 표시됩니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/30">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Eye className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-muted-foreground mb-2">아직 생성된 문서가 없어요</h3>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Files 탭에서 문서를 선택하면 여기에 Generate → Edit → Finalize 플로우가 시작됩니다
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <div className="text-xs text-muted-foreground mb-3">
                Top 5 작업 ({completedTasks.length}/{config.tasks.length} 완료)
              </div>
              {config.tasks.map((task) => {
                const isCompleted = completedTasks.includes(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => !isCompleted && onCompleteTask(task.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                      isCompleted
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                      isCompleted ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
                    )}>
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{task.order}</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm",
                      isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {task.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <div className="text-xs text-muted-foreground mb-3">
                문서 목록 ({generatedDocs.length}/{config.documents.length})
              </div>
              {config.documents.map((doc) => {
                const isGenerated = generatedDocs.includes(doc.id);
                const isCurrentlyGenerating = currentGeneratingDoc === doc.id;
                
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleDocClick(doc.id, isGenerated)}
                    disabled={isGenerating && !isCurrentlyGenerating}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                      isGenerated
                        ? "bg-primary/5 border-primary/20 hover:bg-primary/10 cursor-pointer"
                        : isGenerating && !isCurrentlyGenerating
                          ? "bg-muted/30 border-border opacity-50 cursor-not-allowed"
                          : "bg-card border-border hover:border-primary/50 cursor-pointer"
                    )}
                  >
                    <span className="text-xl">{doc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {doc.nameKr}
                        </span>
                        {doc.optional && (
                          <Badge variant="outline" className="text-[10px] h-4">선택</Badge>
                        )}
                        {doc.pages && (
                          <Badge variant="secondary" className="text-[10px] h-4">{doc.pages}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                    </div>
                    {isCurrentlyGenerating ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : isGenerated ? (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-xs text-primary">보기</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
                        클릭하여 생성
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-center py-12">
                <History className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">작업 히스토리가 없습니다</p>
                <p className="text-xs text-muted-foreground mt-1">
                  문서를 생성하면 여기에 기록됩니다
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
