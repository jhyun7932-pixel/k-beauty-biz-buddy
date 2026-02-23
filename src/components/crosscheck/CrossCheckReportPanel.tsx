import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  ChevronDown, 
  MessageSquare, 
  FileText, 
  Users, 
  Truck,
  Sparkles,
  Globe,
  AlertCircle,
  Lightbulb,
  HelpCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import type { CrossCheckResult, CrossCheckFinding, DocumentSet } from '@/lib/crosscheck/crossCheckEngine';
import { diagnoseFinding, type DiagnosisResult } from '@/lib/crosscheck/rootCauseDiagnosis';
import { 
  generateCommunicationKit, 
  type CommunicationKit, 
  type RecipientType,
  type MessageLanguage 
} from '@/lib/crosscheck/communicationKit';
import {
  generateConfirmationQuestions,
  generateFixSummaryMessage,
  type ConfirmationQuestion,
  type ConfirmationAnswer,
} from '@/lib/crosscheck/confirmationQuestions';

interface CrossCheckReportPanelProps {
  result: CrossCheckResult;
  documents: DocumentSet;
  projectName?: string;
  brandName?: string;
  onApplyFix?: (findingId: string, actionIndex: number) => void;
  onApplyAllFixes?: () => void;
  onAskAI?: (questions: ConfirmationQuestion[], answers: ConfirmationAnswer[]) => void;
}

export function CrossCheckReportPanel({
  result,
  documents,
  projectName = 'K-Beauty Export',
  brandName = 'K-Beauty Co.',
  onApplyFix,
  onApplyAllFixes,
  onAskAI,
}: CrossCheckReportPanelProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientType>('BUYER');
  const [selectedLanguage, setSelectedLanguage] = useState<MessageLanguage>('ko');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  
  // AI Confirmation flow state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [confirmationAnswers, setConfirmationAnswers] = useState<ConfirmationAnswer[]>([]);

  const { summary, findings, missingDocs, itemDiff, totalsDiff } = result;
  const blockingFindings = findings.filter(f => f.severity === 'BLOCKING');
  const warningFindings = findings.filter(f => f.severity === 'WARNING');

  // Generate diagnoses and communication kits
  const diagnoses = findings.map(f => diagnoseFinding(f, documents));
  const communicationKits = findings.map((f, i) => 
    generateCommunicationKit(f, diagnoses[i], {
      projectName,
      sellerBrandName: brandName,
      buyerContactName: documents.DOC_PI?.buyer?.contactName,
      buyerCompanyName: documents.DOC_PI?.buyer?.companyName,
      piVersion: 1,
      contractVersion: 1,
      changes: [{
        field: f.title,
        oldValue: String(f.detectedValues[0]?.value || '-'),
        newValue: String(f.recommendedValue || '-'),
        affectedDocs: f.detectedValues.map(v => v.docKey),
      }],
    })
  );

  // Generate confirmation questions
  const confirmationQuestions = useMemo(() => 
    generateConfirmationQuestions(findings, diagnoses, documents),
    [findings, diagnoses, documents]
  );

  const handleCopyMessage = (message: string, messageId: string) => {
    navigator.clipboard.writeText(message);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const getMessageForRecipient = (kit: CommunicationKit, recipient: RecipientType, lang: MessageLanguage): string | undefined => {
    switch (recipient) {
      case 'BUYER':
        return kit.messages.buyerEmail?.correction?.languageVariants?.[lang] 
          || kit.messages.buyerChat?.languageVariants?.[lang];
      case 'INTERNAL':
        return kit.messages.internalNote?.languageVariants?.ko;
      case 'FORWARDER':
        return kit.messages.forwarderNote?.languageVariants?.[lang];
      default:
        return undefined;
    }
  };

  // Handle starting the AI confirmation flow
  const handleStartAIFlow = () => {
    if (confirmationQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      setConfirmationAnswers([]);
      setShowConfirmationModal(true);
    } else {
      // No confirmation needed, apply all fixes directly
      onApplyAllFixes?.();
    }
  };

  // Handle answering a confirmation question
  const handleAnswerQuestion = (value: unknown) => {
    const currentQuestion = confirmationQuestions[currentQuestionIndex];
    const answer: ConfirmationAnswer = {
      questionId: currentQuestion.id,
      findingId: currentQuestion.findingId,
      selectedValue: value,
      fieldPath: currentQuestion.fieldPath,
    };

    const newAnswers = [...confirmationAnswers, answer];
    setConfirmationAnswers(newAnswers);

    // Move to next question or finish
    if (currentQuestionIndex < confirmationQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, apply fixes
      setShowConfirmationModal(false);
      onAskAI?.(confirmationQuestions, newAnswers);
    }
  };

  const currentConfirmQuestion = confirmationQuestions[currentQuestionIndex];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with tabs */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">문서 일관성 체크 리포트</h2>
              <p className="text-xs text-muted-foreground">{projectName} · 본오더</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={summary.score >= 80 ? "default" : summary.score >= 50 ? "secondary" : "destructive"}
              className="text-sm px-3 py-1"
            >
              {summary.score}/100점
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="summary" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              요약
            </TabsTrigger>
            <TabsTrigger value="issues" className="text-xs gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              실수 목록
              {blockingFindings.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  {blockingFindings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="fix" className="text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              수정 플랜
            </TabsTrigger>
            <TabsTrigger value="communication" className="text-xs gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              커뮤니케이션
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="p-4 space-y-4">
            {/* Score Card */}
            <div className={cn(
              "p-6 rounded-xl text-center",
              summary.score >= 80 ? "bg-green-50 dark:bg-green-950/30" : 
              summary.score >= 50 ? "bg-yellow-50 dark:bg-yellow-950/30" : 
              "bg-red-50 dark:bg-red-950/30"
            )}>
              <div className={cn(
                "text-5xl font-bold mb-2",
                summary.score >= 80 ? "text-green-600" : 
                summary.score >= 50 ? "text-yellow-600" : 
                "text-red-600"
              )}>
                {summary.score}
              </div>
              <p className="text-sm text-muted-foreground mb-4">/ 100점</p>
              
              <div className="flex justify-center gap-3 mb-4">
                <Badge variant="destructive" className="gap-1">
                  🚫 막힘 {summary.blockingCount}
                </Badge>
                <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  ⚠️ 주의 {summary.warningCount}
                </Badge>
                <Badge variant="outline" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  ✅ 정상 {summary.okCount}
                </Badge>
              </div>

              <p className="text-sm text-foreground mb-4">
                {summary.blockingCount > 0 
                  ? <><strong>최종 확정 전, 막힘 항목은 반드시 수정해야 합니다.</strong><br/>원클릭 수정으로 PI/계약서/인보이스/포장명세서 값을 자동으로 맞춰드릴게요.</>
                  : <strong className="text-green-700 dark:text-green-400">실수 0건! 이제 최종 확정하고 바이어에게 보내도 안전합니다.</strong>
                }
              </p>

              <div className="flex justify-center gap-3">
                <Button 
                  onClick={onApplyAllFixes}
                  disabled={summary.blockingCount === 0}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  원클릭으로 자동 수정
                </Button>
                <Button variant="outline" onClick={handleStartAIFlow} className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  AI에게 수정 요청
                </Button>
              </div>
            </div>

            {/* Missing Docs Warning */}
            {missingDocs.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ 누락된 문서</h3>
                <ul className="space-y-2">
                  {missingDocs.map(d => (
                    <li key={d.docKey} className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700 dark:text-yellow-300">{d.suggestion}</span>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        지금 생성
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border border-border">
                <div className="text-2xl font-bold text-foreground">{itemDiff.length}</div>
                <p className="text-xs text-muted-foreground">SKU 항목 검사</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="text-2xl font-bold text-foreground">4</div>
                <p className="text-xs text-muted-foreground">문서 교차 비교</p>
              </div>
            </div>
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="p-4 space-y-4">
            {/* Blocking Issues */}
            {blockingFindings.length > 0 ? (
              <div>
                <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                  🚫 막힘 (필수 수정) — {blockingFindings.length}건
                </h3>
                <div className="space-y-2">
                  {blockingFindings.map((finding, idx) => (
                    <FindingCard 
                      key={finding.id}
                      finding={finding}
                      diagnosis={diagnoses[findings.indexOf(finding)]}
                      isExpanded={expandedFinding === finding.id}
                      onToggle={() => setExpandedFinding(
                        expandedFinding === finding.id ? null : finding.id
                      )}
                      onApplyFix={(actionIndex) => onApplyFix?.(finding.id, actionIndex)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 dark:text-green-400 font-medium">막힘 항목이 없습니다!</p>
              </div>
            )}

            {/* Warning Issues */}
            {warningFindings.length > 0 && (
              <div>
                <h3 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                  ⚠️ 주의 (확인 권장) — {warningFindings.length}건
                </h3>
                <div className="space-y-2">
                  {warningFindings.map((finding) => (
                    <FindingCard 
                      key={finding.id}
                      finding={finding}
                      diagnosis={diagnoses[findings.indexOf(finding)]}
                      isExpanded={expandedFinding === finding.id}
                      onToggle={() => setExpandedFinding(
                        expandedFinding === finding.id ? null : finding.id
                      )}
                      onApplyFix={(actionIndex) => onApplyFix?.(finding.id, actionIndex)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fix Plan Tab */}
        {activeTab === 'fix' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">🔧 추천 수정 플랜</h3>
              <Button 
                size="sm" 
                onClick={onApplyAllFixes}
                disabled={summary.blockingCount === 0}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                모두 적용
              </Button>
            </div>

            <div className="space-y-2">
              {[...blockingFindings, ...warningFindings].slice(0, 8).map((finding, i) => {
                const diagnosis = diagnoses[findings.indexOf(finding)];
                return (
                  <div 
                    key={finding.id}
                    className="p-3 rounded-lg border border-border flex items-center gap-3"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      finding.severity === 'BLOCKING' 
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    )}>
                      P{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{finding.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {diagnosis.recommendedResolution.actionSummary}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onApplyFix?.(finding.id, 0)}
                      className="h-7 text-xs"
                    >
                      적용
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground">
                <strong>📝 기록:</strong> 자동 수정 시 문서 버전이 증가합니다. (v1 → v2)<br/>
                모든 변경 내역은 히스토리에서 확인할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <div className="p-4 space-y-4">
            {/* Header message */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-1">
                상대에게 뭐라고 말할지까지 준비해드릴게요.
              </h3>
              <p className="text-sm text-muted-foreground">
                실수 원인과 변경사항을 정리해, 바로 복사해서 보낼 수 있게 만들었습니다.
              </p>
            </div>

            {/* Recipient & Language Selector */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">받는 사람</label>
                <Select 
                  value={selectedRecipient} 
                  onValueChange={(v) => setSelectedRecipient(v as RecipientType)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUYER">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> 바이어
                      </span>
                    </SelectItem>
                    <SelectItem value="INTERNAL">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> 내부 기록
                      </span>
                    </SelectItem>
                    <SelectItem value="FORWARDER">
                      <span className="flex items-center gap-2">
                        <Truck className="h-4 w-4" /> 포워더
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">언어</label>
                <Select 
                  value={selectedLanguage} 
                  onValueChange={(v) => setSelectedLanguage(v as MessageLanguage)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> 한국어
                      </span>
                    </SelectItem>
                    <SelectItem value="en">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> English
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generated Messages */}
            <div className="space-y-3">
              {findings.length > 0 ? (
                communicationKits.map((kit, idx) => {
                  const message = getMessageForRecipient(kit, selectedRecipient, selectedLanguage);
                  if (!message) return null;

                  const messageId = `${kit.findingId}-${selectedRecipient}-${selectedLanguage}`;
                  const finding = findings[idx];
                  
                  return (
                    <div key={kit.findingId} className="rounded-lg border border-border overflow-hidden">
                      <div className="px-4 py-2 bg-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={finding.severity === 'BLOCKING' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {finding.severity === 'BLOCKING' ? '막힘' : '주의'}
                          </Badge>
                          <span className="text-sm font-medium">{finding.title}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyMessage(message, messageId)}
                          className="h-7 gap-1.5 text-xs"
                        >
                          {copiedMessageId === messageId ? (
                            <>
                              <Check className="h-3 w-3" />
                              복사됨
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              복사하기
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-4">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                          {message}
                        </pre>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>생성할 메시지가 없습니다.</p>
                </div>
              )}
            </div>

            {/* Warning note */}
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                ⚠️ 실제 발송 전, 금액/조건은 최종 문서(PDF) 기준으로 확인하세요.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* AI Confirmation Modal */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              확인이 필요해요
            </DialogTitle>
            <DialogDescription>
              {confirmationQuestions.length > 0 && (
                <span className="text-muted-foreground">
                  질문 {currentQuestionIndex + 1} / {confirmationQuestions.length}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {currentConfirmQuestion && (
            <div className="space-y-4 pt-2">
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ 
                    width: `${((currentQuestionIndex + 1) / confirmationQuestions.length) * 100}%` 
                  }}
                />
              </div>

              {/* Question */}
              <p className="text-sm font-medium text-foreground">
                {currentConfirmQuestion.question}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {currentConfirmQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerQuestion(option.value)}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-colors",
                      "hover:border-primary hover:bg-primary/5",
                      option.isRecommended && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.isRecommended && (
                        <Badge variant="secondary" className="text-[10px]">
                          추천
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      출처: {option.sourceDoc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Skip button */}
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // Skip to next question or close
                    if (currentQuestionIndex < confirmationQuestions.length - 1) {
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                      setShowConfirmationModal(false);
                    }
                  }}
                  className="text-xs"
                >
                  건너뛰기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Finding Card Component
function FindingCard({
  finding,
  diagnosis,
  isExpanded,
  onToggle,
  onApplyFix,
}: {
  finding: CrossCheckFinding;
  diagnosis: DiagnosisResult;
  isExpanded: boolean;
  onToggle: () => void;
  onApplyFix: (actionIndex: number) => void;
}) {
  const topCause = diagnosis.probableCauses[0];
  
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
      >
        <Badge variant={finding.severity === 'BLOCKING' ? 'destructive' : 'secondary'} className="shrink-0">
          {finding.severity === 'BLOCKING' ? '막힘' : '주의'}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{finding.title}</p>
          <p className="text-xs text-muted-foreground truncate">{finding.description}</p>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>
      
      {isExpanded && (
        <div className="px-4 py-3 border-t border-border bg-muted/30 space-y-3">
          {/* Detected Values */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">문서별 값</p>
            <div className="flex flex-wrap gap-2">
              {finding.detectedValues.map(v => (
                <Badge key={v.docKey} variant="outline" className="text-xs">
                  <span className="font-medium mr-1">{getDocLabel(v.docKey)}:</span>
                  {String(v.value)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Probable Cause */}
          {topCause && (
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    추정 원인 ({Math.round(topCause.probability * 100)}%)
                  </p>
                  <p className="text-xs text-muted-foreground">{topCause.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resolution */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">권장 조치</p>
            <p className="text-sm text-foreground">{diagnosis.recommendedResolution.actionSummary}</p>
            <p className="text-xs text-muted-foreground mt-1">{diagnosis.recommendedResolution.rationale}</p>
          </div>

          {/* Risk */}
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300">
              <strong>⚠️ 무시 시 리스크:</strong> {diagnosis.recommendedResolution.riskIfIgnored}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {finding.fixActions.slice(0, 3).map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === 0 ? "default" : "outline"}
                onClick={() => onApplyFix(i)}
                className="h-7 text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getDocLabel(docKey: string): string {
  const labels: Record<string, string> = {
    DOC_PI: 'PI',
    DOC_CONTRACT: '계약서',
    DOC_COMMERCIAL_INVOICE: '인보이스',
    DOC_PACKING_LIST: '포장명세서',
  };
  return labels[docKey] || docKey;
}
