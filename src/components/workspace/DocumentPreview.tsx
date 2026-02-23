import React from 'react';
import { sanitizeHTML } from '@/lib/sanitize';
import { 
  FileText, 
  Loader2, 
  Check, 
  AlertTriangle, 
  Info, 
  X,
  Printer,
  Save,
  Edit3,
  Lock,
  ChevronRight,
  Zap,
  MessageSquare,
  ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ActiveDocument, DocStatus } from '@/hooks/useDocumentRunner';
import { CrossCheckReportPanel } from '@/components/crosscheck/CrossCheckReportPanel';
import { generateMockDocumentSet } from '@/lib/crosscheck/crossCheckEngine';

import type { CrossCheckResult, DocumentSet } from '@/lib/crosscheck/crossCheckEngine';
import type { ConfirmationQuestion, ConfirmationAnswer } from '@/lib/crosscheck/confirmationQuestions';

interface DocumentPreviewProps {
  activeDoc: ActiveDocument | null;
  onFinalize: () => void;
  onSaveToDocs: () => void;
  onPrint: () => void;
  onEdit: () => void;
  onClose: () => void;
  hasBlockingIssues: boolean;
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

// Step indicator component
function StepIndicator({ status }: { status: DocStatus }) {
  const steps = [
    { id: 'generate', label: '초안 만들기', states: ['GENERATING'] },
    { id: 'edit', label: '대화로 수정', states: ['EDITING'] },
    { id: 'finalize', label: '최종 확정', states: ['FINALIZING', 'DONE'] },
  ];

  const getStepStatus = (step: typeof steps[0]) => {
    if (step.states.includes(status)) return 'current';
    
    const stepIndex = steps.findIndex(s => s.id === step.id);
    const currentIndex = steps.findIndex(s => s.states.includes(status));
    
    if (stepIndex < currentIndex) return 'complete';
    return 'upcoming';
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step);
        return (
          <React.Fragment key={step.id}>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
              stepStatus === 'current' && "bg-primary/10 text-primary font-medium",
              stepStatus === 'complete' && "text-primary",
              stepStatus === 'upcoming' && "text-muted-foreground"
            )}>
              {stepStatus === 'complete' && <Check className="h-3 w-3" />}
              {stepStatus === 'current' && status === 'GENERATING' && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Validation banner component
function ValidationBanner({ 
  validation, 
  hasBlockingIssues 
}: { 
  validation: ActiveDocument['validation'];
  hasBlockingIssues: boolean;
}) {
  const blockingCount = validation.filter(v => v.severity === 'blocking').length;
  const warningCount = validation.filter(v => v.severity === 'warning').length;
  const infoCount = validation.filter(v => v.severity === 'info').length;

  if (blockingCount > 0) {
    return (
      <div className="mx-4 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              최종 확정 전에 꼭 채워야 할 항목이 있어요
            </p>
            <ul className="mt-1 space-y-1">
              {validation.filter(v => v.severity === 'blocking').map(issue => (
                <li key={issue.id} className="text-xs text-destructive/80 flex items-center gap-2">
                  <span>• {issue.message}</span>
                  {issue.fixAction && (
                    <Button size="sm" variant="outline" className="h-5 text-[10px] px-2">
                      {issue.fixAction}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (warningCount > 0) {
    return (
      <div className="mx-4 mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              보낼 수는 있지만, 정확도 확인이 필요해요
            </p>
            <ul className="mt-1 space-y-1">
              {validation.filter(v => v.severity === 'warning').map(issue => (
                <li key={issue.id} className="text-xs text-yellow-600/80 dark:text-yellow-500/80 flex items-center gap-2">
                  <span>• {issue.message}</span>
                  {issue.fixAction && (
                    <Button size="sm" variant="outline" className="h-5 text-[10px] px-2">
                      {issue.fixAction}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          보낼 준비가 됐어요
        </p>
      </div>
    </div>
  );
}

export function DocumentPreview({
  activeDoc,
  onFinalize,
  onSaveToDocs,
  onPrint,
  onEdit,
  onClose,
  hasBlockingIssues,
  isCrossCheckReport = false,
  onApplyAllFixes,
  onAskAI,
  onApplyFix,
  crossCheckResult,
  documentSet,
  projectName = 'K-Beauty Export',
  brandName = 'K-Beauty Co.',
  requiresCrossCheckGate = false,
  crossCheckCompleted = false,
}: DocumentPreviewProps) {
  // No active document
  if (!activeDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/30">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="font-medium text-muted-foreground mb-2">문서를 선택하세요</h3>
        <p className="text-xs text-muted-foreground max-w-[200px] text-center">
          Files 탭에서 문서를 선택하면 여기에 미리보기가 표시됩니다
        </p>
      </div>
    );
  }

  // Generating state
  if (activeDoc.status === 'GENERATING') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">{activeDoc.titleKr}</h3>
            <p className="text-xs text-muted-foreground">{activeDoc.title}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">AI가 생성 중…</h3>
          <p className="text-sm text-muted-foreground mb-4">{activeDoc.progressMessage}</p>
          <StepIndicator status={activeDoc.status} />
        </div>
      </div>
    );
  }

  // Document ready (EDITING, FINALIZING, DONE)
  return (
    <div className="h-full flex flex-col">
      {/* Header with actions */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">{activeDoc.titleKr}</h3>
              {activeDoc.status === 'DONE' && (
                <Badge variant="outline" className="text-[10px] h-4 gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  v{activeDoc.version}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{activeDoc.title}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step indicator */}
        <StepIndicator status={activeDoc.status} />

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {activeDoc.status === 'EDITING' && (
            <>
              {isCrossCheckReport && hasBlockingIssues && onApplyAllFixes && (
                <Button 
                  size="sm" 
                  onClick={onApplyAllFixes}
                  className="h-7 text-xs gap-1.5 bg-primary"
                >
                  <Zap className="h-3 w-3" />
                  원클릭 수정
                </Button>
              )}
              {/* AI Ask button removed - handled by CrossCheckReportPanel modal */}
              {!isCrossCheckReport && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onEdit}
                    className="h-7 text-xs gap-1.5"
                  >
                    <Edit3 className="h-3 w-3" />
                    이 문서만 다듬기
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={onFinalize}
                    disabled={hasBlockingIssues || requiresCrossCheckGate}
                    className="h-7 text-xs gap-1.5"
                    title={requiresCrossCheckGate ? '실수 체크 리포트를 먼저 완료하세요' : undefined}
                  >
                    <Check className="h-3 w-3" />
                    최종 확정
                  </Button>
                </>
              )}
              {isCrossCheckReport && !hasBlockingIssues && (
                <Button 
                  size="sm" 
                  onClick={onFinalize}
                  className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  <ClipboardCheck className="h-3 w-3" />
                  실수 체크 완료
                </Button>
              )}
            </>
          )}
          {activeDoc.status === 'DONE' && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onPrint}
                className="h-7 text-xs gap-1.5"
              >
                <Printer className="h-3 w-3" />
                PDF로 저장
              </Button>
              <Button 
                size="sm" 
                onClick={onSaveToDocs}
                className="h-7 text-xs gap-1.5"
              >
                <Save className="h-3 w-3" />
                문서함에 저장
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cross-check gate banner - show for BULK docs when cross-check is required */}
      {requiresCrossCheckGate && activeDoc.status === 'EDITING' && !isCrossCheckReport && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              실수 체크 리포트를 먼저 완료해주세요
            </p>
          </div>
          <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
            본오더 문서 최종 확정 전, 문서 간 불일치를 확인해야 합니다.
          </p>
        </div>
      )}

      {/* Validation banner - only show for non-crosscheck reports */}
      {!isCrossCheckReport && activeDoc.status !== 'DONE' && activeDoc.validation.length > 0 && (
        <ValidationBanner 
          validation={activeDoc.validation} 
          hasBlockingIssues={hasBlockingIssues} 
        />
      )}

      {/* Cross-check report panel */}
      {isCrossCheckReport && crossCheckResult && documentSet ? (
        <CrossCheckReportPanel
          result={crossCheckResult}
          documents={documentSet}
          projectName={projectName}
          brandName={brandName}
          onApplyFix={onApplyFix}
          onApplyAllFixes={onApplyAllFixes}
          onAskAI={onAskAI}
        />
      ) : (
        /* Standard document preview */
        <div 
          className="flex-1 overflow-y-auto bg-white"
          style={{ 
            overscrollBehavior: 'contain'
          }}
        >
          {activeDoc.html ? (
            <div 
              className="p-4"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(activeDoc.html) }}
            />
          ) : (
            <div className="p-4">
              <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-[210/297] bg-white p-6 relative">
                  {activeDoc.status !== 'DONE' && (
                    <div className="absolute top-4 left-4 right-4 px-3 py-2 rounded-md bg-amber-100 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>이 문서는 <strong>협상/검토용 초안</strong>입니다. 최종 제출 전 확인이 필요합니다.</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-6 pt-12">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="font-bold text-foreground">{activeDoc.title}</h2>
                        <p className="text-xs text-muted-foreground">{activeDoc.titleKr}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground mt-12">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                    <p>문서 콘텐츠를 불러오는 중...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
