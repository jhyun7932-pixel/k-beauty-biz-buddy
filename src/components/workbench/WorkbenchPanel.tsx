import React, { useState } from 'react';
import { sanitizeHTML } from '@/lib/sanitize';
import { FieldEditor } from './FieldEditor';
import { ComplianceTrafficLight } from './ComplianceTrafficLight';
import { useDocumentVersioning, type DocumentVersion } from '@/hooks/useDocumentVersioning';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Eye, FileText, Settings2, Shield, CheckSquare, 
  FolderOpen, History, Download, Lock, Sparkles,
  ChevronDown, ChevronUp, Activity, Loader2, CheckCircle, XCircle
} from 'lucide-react';
import { useAppStore, DOC_TILES, PRESET_LABELS, WorkbenchTab, DocInstance } from '@/stores/appStore';
import { useSessionStore, getStatusBadgeStyle } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// Run Log Component
function RunLog() {
  const [isOpen, setIsOpen] = useState(true);
  const { getActiveSession } = useSessionStore();
  const session = getActiveSession();
  
  const recentActions = session?.actions.slice(-10).reverse() || [];
  const runningAction = recentActions.find(a => a.status === 'ok');
  
  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'create_doc': '문서 생성',
      'update_fields': '필드 수정',
      'run_compliance': '규제 체크',
      'run_gate': 'Gate 검사',
      'finalize_doc': '최종 확정',
      'select_preset': '단계 선택',
      'start_project': '프로젝트 시작',
      'upload_files': '파일 업로드',
      'export_zip': 'ZIP 내보내기',
    };
    return labels[type] || type;
  };
  
  if (recentActions.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b bg-card">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">실행 로그</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {recentActions.length}
          </Badge>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-3 space-y-1 max-h-[150px] overflow-y-auto">
          {recentActions.map((action, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-muted/50"
            >
              {action.status === 'ok' ? (
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
              )}
              <span className="font-medium">{getActionLabel(action.type)}</span>
              <span className="text-muted-foreground ml-auto">
                {formatDistanceToNow(action.at, { addSuffix: true, locale: ko })}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function WorkbenchPanel() {
  const {
    ui,
    project,
    docs,
    files,
    setWorkbenchTab,
    setActiveDoc,
    createDocFromTemplate,
    getActiveDoc,
    getDocsForCurrentPreset,
    runCrossCheckGate,
    finalizeDoc,
  } = useAppStore();
  
  const { 
    activeSessionId, 
    appendAction, 
    linkDocToSession, 
    incrementMetric,
    setSessionStatus,
  } = useSessionStore();

  const activeDoc = getActiveDoc();
  const currentDocs = getDocsForCurrentPreset();
  const tiles = DOC_TILES[project.stagePreset];

  const handleTabChange = (value: string) => {
    setWorkbenchTab(value as WorkbenchTab);
  };

  const handleTileClick = (templateKey: string) => {
    if (project.targetCountries.length === 0) {
      toast.error('타겟 국가를 먼저 선택해주세요.');
      return;
    }

    const existingDoc = Object.values(docs.byId).find(
      d => d.templateKey === templateKey && d.stagePreset === project.stagePreset
    );

    if (existingDoc) {
      setActiveDoc(existingDoc.docId);
      setWorkbenchTab('PREVIEW');
      toast.info('기존 문서를 열었습니다.');
    } else {
      const docId = createDocFromTemplate({ templateKey, preset: project.stagePreset });
      if (docId) {
        if (activeSessionId) {
          appendAction(activeSessionId, { type: 'create_doc', payload: { templateKey }, status: 'ok' });
          linkDocToSession(activeSessionId, docId);
          incrementMetric(activeSessionId, 'docsCreated');
        }
        toast.success('문서가 생성되었습니다! 미리보기에서 확인하세요.');
      }
    }
  };

  const handleFinalize = () => {
    if (!activeDoc) return;
    
    if (project.stagePreset === 'PURCHASE_ORDER') {
      const results = runCrossCheckGate(activeDoc.docId);
      const hasHighFail = results.some(r => r.severity === 'HIGH' && r.status === 'FAIL');
      
      if (hasHighFail) {
        if (activeSessionId) {
          appendAction(activeSessionId, { type: 'finalize_doc', payload: { docId: activeDoc.docId }, status: 'fail', note: 'HIGH severity gate failure' });
          setSessionStatus(activeSessionId, 'blocked');
          incrementMetric(activeSessionId, 'gateBlocks');
        }
        toast.error('HIGH 심각도 항목을 먼저 해결해주세요.');
        setWorkbenchTab('GATE');
        return;
      }
    }
    
    const success = finalizeDoc(activeDoc.docId);
    if (success) {
      if (activeSessionId) {
        appendAction(activeSessionId, { type: 'finalize_doc', payload: { docId: activeDoc.docId }, status: 'ok' });
        incrementMetric(activeSessionId, 'finalizeCount');
      }
      toast.success('문서가 최종 확정되었습니다! 다운로드할 수 있습니다.');
    }
  };

  const handleFinalizeAll = () => {
    const allDocs = Object.values(docs.byId).filter(d => d.stagePreset === 'PURCHASE_ORDER');
    let successCount = 0;
    
    for (const doc of allDocs) {
      if (doc.status !== 'final') {
        const success = finalizeDoc(doc.docId);
        if (success) successCount++;
      }
    }
    
    if (successCount > 0) {
      if (activeSessionId) {
        appendAction(activeSessionId, { type: 'finalize_doc', payload: { count: successCount }, status: 'ok' });
        setSessionStatus(activeSessionId, 'done');
      }
      toast.success(`${successCount}개 문서가 최종 확정되었습니다!`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/30 overflow-hidden">
      {/* Run Log */}
      <RunLog />
      
      <Tabs 
        value={ui.workbenchTab} 
        onValueChange={handleTabChange} 
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="w-full justify-start rounded-none border-b bg-card px-2 flex-shrink-0 h-auto py-1 gap-0.5">
          <TabsTrigger value="PREVIEW" className="gap-1.5 text-xs px-3 py-1.5">
            <Eye className="h-3.5 w-3.5" />
            미리보기
          </TabsTrigger>
          <TabsTrigger value="FIELDS" className="gap-1.5 text-xs px-3 py-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            편집
          </TabsTrigger>
          <TabsTrigger value="GATE" className="gap-1.5 text-xs px-3 py-1.5">
            <Shield className="h-3.5 w-3.5" />
            규제 진단
          </TabsTrigger>
          <TabsTrigger value="FILES" className="gap-1.5 text-xs px-3 py-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Files ({tiles.length})
          </TabsTrigger>
          <TabsTrigger value="CHECKLIST" className="gap-1.5 text-xs px-3 py-1.5">
            <CheckSquare className="h-3.5 w-3.5" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="HISTORY" className="gap-1.5 text-xs px-3 py-1.5">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        {/* PREVIEW Tab */}
        <TabsContent value="PREVIEW" className="flex-1 m-0 flex flex-col overflow-auto min-h-0">
          {activeDoc ? (
            <div className="flex flex-col min-h-full">
              {/* Document Header */}
              <div className="flex items-center justify-between p-3 border-b bg-card flex-shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Badge variant={activeDoc.status === 'final' ? 'default' : 'secondary'}>
                    {activeDoc.status === 'final' ? (
                      <><Lock className="h-3 w-3 mr-1" /> 최종 확정</>
                    ) : '초안'}
                  </Badge>
                  <span className="text-sm font-medium">{activeDoc.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeDoc.status !== 'final' && (
                    <Button size="sm" onClick={handleFinalize} className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      최종 확정
                    </Button>
                  )}
                  {activeDoc.status === 'final' && (
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      다운로드
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Document Preview Content */}
              {activeDoc.html ? (
                <div 
                  className="p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(activeDoc.html) }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">문서 콘텐츠를 불러오는 중...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">문서를 선택하면 미리보기가 표시됩니다</p>
                <p className="text-xs text-muted-foreground mt-1">Files 탭에서 문서를 클릭하세요</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* FILES Tab */}
        <TabsContent value="FILES" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {PRESET_LABELS[project.stagePreset]} 문서
              </h3>
              <Badge variant="outline">
                {currentDocs.length} / {tiles.length} 생성됨
              </Badge>
            </div>
            
            {tiles.map((tile, index) => {
              const existingDoc = Object.values(docs.byId).find(
                d => d.templateKey === tile.templateKey && d.stagePreset === project.stagePreset
              );
              const isActive = activeDoc?.templateKey === tile.templateKey;
              
              return (
                <button
                  key={tile.templateKey}
                  onClick={() => handleTileClick(tile.templateKey)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    "hover:shadow-md hover:border-primary/50",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-card/80"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tile.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tile.titleKr}</span>
                          <Badge variant="outline" className="text-[10px] h-5">
                            #{index + 1}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{tile.description}</p>
                      </div>
                    </div>
                    
                    {existingDoc ? (
                      <Badge 
                        variant={existingDoc.status === 'final' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {existingDoc.status === 'final' ? (
                          <><Lock className="h-3 w-3 mr-1" /> 최종</>
                        ) : '초안'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        생성 필요
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        {/* FIELDS Tab */}
        <TabsContent value="FIELDS" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
          <div className="p-4">
            {activeDoc ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    필드 편집 - {activeDoc.title}
                  </h3>
                  <Badge variant={activeDoc.status === 'final' ? 'default' : 'secondary'} className="text-[10px]">
                    {activeDoc.status === 'final' ? '🔒 잠김' : '✏️ 편집 가능'}
                  </Badge>
                </div>
                <FieldEditor
                  docId={activeDoc.docId}
                  fields={activeDoc.fields}
                  locked={activeDoc.status === 'final'}
                />
                <p className="text-xs text-muted-foreground">
                  💡 채팅에서 "MOQ를 1000으로 바꿔줘" 같이 말해도 필드가 자동으로 업데이트됩니다.
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">문서를 먼저 선택해주세요</p>
                <p className="text-xs text-muted-foreground mt-1">Files 탭에서 문서를 생성하거나 선택하세요</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* GATE / Compliance Tab */}
        <TabsContent value="GATE" className="flex-1 m-0 p-0 overflow-hidden flex flex-col min-h-0">
          {project.stagePreset === 'PURCHASE_ORDER' ? (
            <GatePanel onFinalizeAll={handleFinalizeAll} />
          ) : (
            <ComplianceTrafficLight />
          )}
        </TabsContent>

        {/* CHECKLIST Tab */}
        <TabsContent value="CHECKLIST" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              {PRESET_LABELS[project.stagePreset]} 체크리스트
            </h3>
            <div className="space-y-2">
              {tiles.map((tile, index) => {
                const existingDoc = Object.values(docs.byId).find(
                  d => d.templateKey === tile.templateKey
                );
                return (
                  <div 
                    key={tile.templateKey}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      existingDoc ? "bg-green-50 border-green-200" : "bg-card border-border"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      existingDoc ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {existingDoc ? '✓' : index + 1}
                    </div>
                    <span className={cn(
                      "text-sm",
                      existingDoc ? "text-green-700" : "text-foreground"
                    )}>
                      {tile.titleKr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* HISTORY Tab */}
        <TabsContent value="HISTORY" className="flex-1 m-0 p-0 overflow-y-auto min-h-0">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              버전 히스토리
            </h3>
            {activeDoc ? (
              <VersionHistoryList docId={activeDoc.docId} />
            ) : (
              <div className="space-y-2">
                {files.list.length > 0 ? (
                  files.list.map((file) => (
                    <div key={file.fileId} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{file.name}</span>
                        <Badge variant={file.status === 'final' ? 'default' : 'secondary'} className="text-xs">
                          {file.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(file.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    문서를 선택하면 버전 히스토리를 확인할 수 있습니다
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Version History List Component
function VersionHistoryList({ docId }: { docId: string }) {
  const { getVersions, restoreVersion, saveVersion } = useDocumentVersioning();
  const versions = getVersions(docId);
  
  const handleSaveSnapshot = () => {
    saveVersion(docId, '수동 저장');
    toast.success('현재 버전이 저장되었습니다');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{versions.length}개 버전</span>
        <Button variant="outline" size="sm" onClick={handleSaveSnapshot} className="gap-1 text-xs h-7">
          <History className="h-3 w-3" />
          현재 버전 저장
        </Button>
      </div>
      {versions.length === 0 ? (
        <div className="text-center py-8">
          <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">아직 저장된 버전이 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">문서를 편집하면 자동으로 버전이 기록됩니다</p>
        </div>
      ) : (
        [...versions].reverse().map((ver) => (
          <div key={ver.versionId} className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">v{ver.version}</Badge>
                <span className="text-xs text-muted-foreground">{ver.reason}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-6 px-2"
                onClick={() => restoreVersion(docId, ver.versionId)}
              >
                복원
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(ver.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

// Gate Panel Component
function GatePanel({ onFinalizeAll }: { onFinalizeAll: () => void }) {
  const { docs, getActiveDoc, runCrossCheckGate, setWorkbenchTab, project } = useAppStore();
  
  const purchaseOrderDocs = Object.values(docs.byId).filter(d => d.stagePreset === 'PURCHASE_ORDER');
  const firstDoc = purchaseOrderDocs[0];
  
  const gateResults = firstDoc?.gate.results.length > 0 
    ? firstDoc.gate.results 
    : (firstDoc ? runCrossCheckGate(firstDoc.docId) : []);
  
  const passedCount = gateResults.filter(r => r.status === 'PASS').length;
  const totalCount = gateResults.length || 10;
  const allPassed = passedCount === totalCount;
  const hasHighFail = gateResults.some(r => r.severity === 'HIGH' && r.status === 'FAIL');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cross-check Gate (TOP 10)
        </h3>
        <Badge variant={allPassed ? 'default' : 'destructive'}>
          {passedCount} / {totalCount} 통과
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              allPassed ? "bg-green-500" : hasHighFail ? "bg-red-500" : "bg-amber-500"
            )}
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {allPassed 
            ? '✅ 모든 항목을 통과했습니다! 최종 확정이 가능합니다.'
            : hasHighFail
            ? '⚠️ HIGH 심각도 항목을 먼저 해결해야 최종 확정이 가능합니다.'
            : '⏳ 일부 항목을 확인해주세요.'}
        </p>
      </div>

      {/* Gate Items */}
      <div className="space-y-2">
        {gateResults.map((result) => (
          <div 
            key={result.id}
            className={cn(
              "p-4 rounded-xl border",
              result.status === 'PASS' ? "bg-green-50 border-green-200" :
              result.status === 'FAIL' ? "bg-red-50 border-red-200" :
              "bg-amber-50 border-amber-200"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      result.severity === 'HIGH' ? "border-red-300 text-red-700" :
                      result.severity === 'MED' ? "border-amber-300 text-amber-700" :
                      "border-blue-300 text-blue-700"
                    )}
                  >
                    {result.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{result.id}</span>
                </div>
                <p className="text-sm font-medium">{result.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{result.rule}</p>
                {result.details && (
                  <p className="text-xs text-red-600 mt-2 bg-red-100 px-2 py-1 rounded">
                    {result.details}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={result.status === 'PASS' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {result.status === 'PASS' ? '✓ PASS' : 
                   result.status === 'FAIL' ? '✗ FAIL' : '? 확인필요'}
                </Badge>
                {result.status !== 'PASS' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7"
                    onClick={() => toast.info(result.fixActionLabel)}
                  >
                    {result.fixActionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Finalize Button */}
      <div className="mt-6 p-4 bg-card rounded-xl border">
        <Button 
          className="w-full gap-2" 
          size="lg"
          disabled={hasHighFail || purchaseOrderDocs.length === 0}
          onClick={onFinalizeAll}
        >
          <Lock className="h-4 w-4" />
          {hasHighFail 
            ? `최종 확정 전, Gate를 통과해야 해요 (${passedCount}/${totalCount})`
            : '모든 문서 최종 확정'}
        </Button>
        {hasHighFail && (
          <p className="text-xs text-red-600 mt-2 text-center">
            이 항목은 통관/정산 리스크가 커요. 지금 고치면 커뮤니케이션 왕복을 줄일 수 있어요.
          </p>
        )}
      </div>
    </div>
  );
}
