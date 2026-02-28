import React, { useState, useRef, useCallback } from 'react';
import { Plus, FileText, Calendar, Trash2, MoreVertical, ChevronRight, Building2, Package, CheckSquare, Square, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Tabs removed — now using saved documents view
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useExportProjects, type ExportProject, type ProjectStage } from '@/hooks/useExportProjects';
import { useBuyers } from '@/hooks/useBuyers';
import { useAppStore } from '@/stores/appStore';
import { getBuyerCountryDisplay } from '@/lib/countryFlags';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────────────────
// Stage display config
// ──────────────────────────────────────────────────────────
const STAGES: { key: ProjectStage; label: string }[] = [
  { key: 'proposal', label: '첫 제안 진행' },
  { key: 'sample', label: '샘플 검토' },
  { key: 'order', label: '본 오더 및 계약' },
  { key: 'shipping', label: '선적 및 통관' },
  { key: 'done', label: '수출 완료' },
];

const STAGE_LABEL: Record<ProjectStage, string> = {
  proposal: '첫 제안 진행',
  sample: '샘플 검토',
  order: '본 오더 및 계약',
  shipping: '선적 및 통관',
  done: '수출 완료',
};

const STAGE_COLORS: Record<ProjectStage, string> = {
  proposal: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  sample: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  order: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  shipping: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  done: 'bg-green-500/10 text-green-600 border-green-500/30',
};

const STAGE_HEADER_COLORS: Record<ProjectStage, string> = {
  proposal: 'bg-blue-500',
  sample: 'bg-amber-500',
  order: 'bg-purple-500',
  shipping: 'bg-orange-500',
  done: 'bg-green-500',
};

// (Tab definitions removed — now using saved documents from JSONB)

// ──────────────────────────────────────────────────────────
// Document type labels
// ──────────────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  PI: 'Proforma Invoice',
  CI: 'Commercial Invoice',
  PL: 'Packing List',
  NDA: 'NDA',
  SALES_CONTRACT: 'Sales Contract',
  PROPOSAL: 'Business Proposal',
  EMAIL: 'Email',
  COMPLIANCE: 'Compliance Check',
};

// ──────────────────────────────────────────────────────────
// Project Detail View (Stage-based Dynamic Tabs)
// ──────────────────────────────────────────────────────────
function ProjectDetailView({ project, onBack }: { project: ExportProject; onBack: () => void }) {
  const savedDocs = (project.documents || []) as any[];
  const [activeDocId, setActiveDocId] = useState<string | null>(savedDocs[0]?.id ?? null);
  const activeDoc = savedDocs.find((d: any) => d.id === activeDocId) ?? null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Detail Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground h-8">
            <ChevronRight className="h-4 w-4 rotate-180" />
            목록으로
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-base font-bold text-foreground truncate flex-1">{project.project_name}</h1>
          <Badge variant="outline" className={`text-xs border ${STAGE_COLORS[project.stage]}`}>
            {STAGE_LABEL[project.stage]}
          </Badge>
        </div>
      </div>

      {/* 저장된 문서 목록 */}
      {savedDocs.length > 0 ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 문서 탭 */}
          <div className="flex-shrink-0 px-6 pt-3 pb-2 border-b border-border bg-card/20">
            <div className="flex items-center gap-2 flex-wrap">
              {savedDocs.map((doc: any) => (
                <Button
                  key={doc.id}
                  variant={activeDocId === doc.id ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs gap-1.5 h-8"
                  onClick={() => setActiveDocId(doc.id)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                  <span className="text-[10px] opacity-70">
                    {doc.doc_number}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* 선택된 문서 상세 */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <div className="max-w-3xl mx-auto">
                {activeDoc ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">
                          {DOC_TYPE_LABELS[activeDoc.doc_type] || activeDoc.doc_type}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activeDoc.doc_number} · {new Date(activeDoc.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/5">
                        AI 생성 문서
                      </Badge>
                    </div>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                          {/* 문서 요약 정보 */}
                          {activeDoc.data?.seller && (
                            <div className="grid grid-cols-2 gap-4 border rounded-lg p-3">
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Seller</p>
                                <p className="text-sm font-medium text-foreground">{activeDoc.data.seller.company_name}</p>
                                {activeDoc.data.seller.email && <p className="text-xs text-primary">{activeDoc.data.seller.email}</p>}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Buyer</p>
                                <p className="text-sm font-medium text-foreground">{activeDoc.data.buyer?.company_name}</p>
                                {activeDoc.data.buyer?.country && <p className="text-xs">{activeDoc.data.buyer.country}</p>}
                              </div>
                            </div>
                          )}
                          {/* 품목 테이블 */}
                          {activeDoc.data?.items && activeDoc.data.items.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="py-2 px-3 text-left font-semibold">Product</th>
                                    <th className="py-2 px-3 text-right font-semibold">Qty</th>
                                    {activeDoc.doc_type !== 'PL' && (
                                      <th className="py-2 px-3 text-right font-semibold">Amount</th>
                                    )}
                                    {activeDoc.doc_type === 'PL' && (
                                      <>
                                        <th className="py-2 px-3 text-right font-semibold">N.W.</th>
                                        <th className="py-2 px-3 text-right font-semibold">G.W.</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {activeDoc.data.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-t">
                                      <td className="py-1.5 px-3 font-medium">{item.product_name}</td>
                                      <td className="py-1.5 px-3 text-right">{item.quantity?.toLocaleString()}</td>
                                      {activeDoc.doc_type !== 'PL' && (
                                        <td className="py-1.5 px-3 text-right font-semibold">
                                          {item.quantity != null && item.unit_price != null
                                            ? `${item.currency ?? 'USD'} ${(item.quantity * item.unit_price).toFixed(2)}`
                                            : '—'}
                                        </td>
                                      )}
                                      {activeDoc.doc_type === 'PL' && (
                                        <>
                                          <td className="py-1.5 px-3 text-right">{item.net_weight_kg?.toFixed(2) ?? '—'} kg</td>
                                          <td className="py-1.5 px-3 text-right">{item.gross_weight_kg?.toFixed(2) ?? '—'} kg</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {/* Trade Terms */}
                          {activeDoc.data?.trade_terms && (
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                              {activeDoc.data.trade_terms.incoterms && (
                                <div><span className="text-muted-foreground">Incoterms:</span> <span className="font-medium">{activeDoc.data.trade_terms.incoterms}</span></div>
                              )}
                              {activeDoc.data.trade_terms.payment_terms && (
                                <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium">{activeDoc.data.trade_terms.payment_terms}</span></div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">문서를 선택하세요.</p>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">저장된 문서가 없습니다</p>
          <p className="text-xs mt-1">AI 채팅에서 문서를 생성한 후 이 프로젝트에 저장하세요.</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Draggable Project Card
// ──────────────────────────────────────────────────────────
interface DraggableCardProps {
  project: ExportProject;
  onCardClick: (project: ExportProject) => void;
  onStageChange: (projectId: string, stage: ProjectStage) => void;
  onDelete: (projectId: string) => void;
  currentStage: ProjectStage;
}

function DraggableCard({ project, onCardClick, onStageChange, onDelete, currentStage }: DraggableCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('projectId', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md',
        'transition-all duration-200 hover:border-primary/30 group',
        'active:opacity-60 active:scale-95'
      )}
      onClick={() => onCardClick(project)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1 min-w-0">
            {project.project_name}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STAGES.filter(s => s.key !== currentStage).map(s => (
                <DropdownMenuItem
                  key={s.key}
                  onClick={e => {
                    e.stopPropagation();
                    onStageChange(project.id, s.key);
                    toast.success(`"${project.project_name}" → ${s.label}`);
                  }}
                >
                  {s.label}(으)로 이동
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="text-destructive"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(project.id);
                  toast.success('삭제되었습니다.');
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.buyer_name && (
          <div className="flex items-center gap-1 mb-2">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{project.buyer_name}</span>
          </div>
        )}

        {/* 저장된 문서 타입 배지 */}
        {(project.documents || []).length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-2">
            {(project.documents || []).map((doc: any) => (
              <span
                key={doc.id}
                className="px-2 py-0.5 text-[9px] bg-violet-100 text-violet-700 rounded-full"
              >
                {doc.doc_type} · {new Date(doc.created_at).toLocaleDateString('ko-KR')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/60 mb-2">저장된 문서 없음</p>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {(project.documents || []).length}개 문서
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(project.updated_at).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────
// Drop Column
// ──────────────────────────────────────────────────────────
interface DropColumnProps {
  stage: ProjectStage;
  stageLabel: string;
  projects: ExportProject[];
  onCardClick: (project: ExportProject) => void;
  onStageChange: (projectId: string, stage: ProjectStage) => void;
  onDelete: (projectId: string) => void;
}

function DropColumn({ stage, stageLabel, projects, onCardClick, onStageChange, onDelete }: DropColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const projectId = e.dataTransfer.getData('projectId');
    if (projectId) {
      onStageChange(projectId, stage);
      toast.success(`프로젝트가 "${stageLabel}"(으)로 이동되었습니다.`);
    }
  };

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column Header */}
      <div className="flex-shrink-0 mb-3">
        <div className={`h-1 rounded-full mb-2 ${STAGE_HEADER_COLORS[stage]}`} />
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground truncate">{stageLabel}</h3>
          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
            {projects.length}
          </Badge>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          'flex-1 space-y-2 min-h-[200px] pb-4 rounded-xl transition-all duration-200 p-1',
          isDragOver
            ? 'bg-primary/5 border-2 border-dashed border-primary/40'
            : 'border-2 border-dashed border-transparent'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {projects.map(project => (
          <DraggableCard
            key={project.id}
            project={project}
            currentStage={stage}
            onCardClick={onCardClick}
            onStageChange={onStageChange}
            onDelete={onDelete}
          />
        ))}

        {projects.length === 0 && (
          <div className={cn(
            'flex flex-col items-center justify-center py-8 px-4 rounded-xl text-center h-full min-h-[120px]',
            isDragOver ? 'opacity-0' : 'opacity-100'
          )}>
            <p className="text-xs text-muted-foreground">프로젝트 없음</p>
          </div>
        )}

        {isDragOver && (
          <div className="flex items-center justify-center py-4 rounded-lg border-2 border-dashed border-primary/60 bg-primary/5">
            <p className="text-xs text-primary font-medium">여기에 놓으세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 3-Step Project Creation Wizard
// ──────────────────────────────────────────────────────────
interface WizardState {
  step: 1 | 2 | 3;
  buyerId: string;
  buyerName: string;
  selectedProductIds: string[];
  stage: ProjectStage;
  customName: string;
}

const WIZARD_INITIAL: WizardState = {
  step: 1,
  buyerId: '',
  buyerName: '',
  selectedProductIds: [],
  stage: 'proposal',
  customName: '',
};

function CreateProjectWizard({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, stage: ProjectStage, buyerId: string, buyerName: string, productIds: string[]) => void;
}) {
  const { buyers } = useBuyers();
  const { productEntries } = useAppStore();
  const [wizard, setWizard] = useState<WizardState>(WIZARD_INITIAL);

  const autoName = wizard.buyerName
    ? `${wizard.buyerName} × ${wizard.selectedProductIds.length > 0 ? `${wizard.selectedProductIds.length}개 제품` : '신규 거래'}`
    : '';

  const finalName = wizard.customName.trim() || autoName;

  const toggleProduct = (id: string) => {
    setWizard(w => ({
      ...w,
      selectedProductIds: w.selectedProductIds.includes(id)
        ? w.selectedProductIds.filter(pid => pid !== id)
        : [...w.selectedProductIds, id],
    }));
  };

  const handleFinish = () => {
    if (!finalName) { toast.error('프로젝트 이름을 입력해주세요.'); return; }
    onCreate(finalName, wizard.stage, wizard.buyerId, wizard.buyerName, wizard.selectedProductIds);
  };

  const stepTitles = ['① 바이어 선택', '② 제품 선택', '③ 단계 설정'];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="text-primary">🚀</span> 새 프로젝트 만들기
        </DialogTitle>
        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                wizard.step === s
                  ? 'bg-primary text-primary-foreground'
                  : wizard.step > s
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}>{s}</div>
              <span className={cn(
                'text-xs hidden sm:inline',
                wizard.step === s ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>{stepTitles[s - 1].slice(2)}</span>
              {s < 3 && <div className="w-6 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>
      </DialogHeader>

      {/* Step 1: 바이어 선택 */}
      {wizard.step === 1 && (
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">거래할 바이어를 선택하세요.</p>
          {buyers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">등록된 바이어가 없습니다.</p>
              <p className="text-xs mt-1">마이 데이터에서 바이어를 먼저 등록해주세요.</p>
            </div>
          ) : (
            <ScrollArea className="h-56">
              <div className="space-y-2 pr-2">
                {buyers.map(b => (
                  <div
                    key={b.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      wizard.buyerId === b.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                    onClick={() => setWizard(w => ({ ...w, buyerId: b.id, buyerName: b.company_name }))}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.company_name}</p>
                      <p className="text-xs text-muted-foreground">{getBuyerCountryDisplay(b.country)}</p>
                    </div>
                    {wizard.buyerId === b.id && (
                      <Badge variant="default" className="text-[10px] flex-shrink-0">선택됨</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <p className="text-xs text-muted-foreground text-center">
            바이어 없이 진행하려면{' '}
            <button
              className="text-primary underline underline-offset-2"
              onClick={() => setWizard(w => ({ ...w, buyerId: '', buyerName: '', step: 2 }))}
            >
              건너뛰기
            </button>
          </p>
        </div>
      )}

      {/* Step 2: 제품 선택 */}
      {wizard.step === 2 && (
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">포함할 제품을 선택하세요. (복수 선택 가능)</p>
          {productEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">등록된 제품이 없습니다.</p>
              <p className="text-xs mt-1">마이 데이터에서 제품을 먼저 등록해주세요.</p>
            </div>
          ) : (
            <ScrollArea className="h-52">
              <div className="space-y-2 pr-2">
                {productEntries.map(p => {
                  const isSelected = wizard.selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      )}
                      onClick={() => toggleProduct(p.id)}
                    >
                      {isSelected
                        ? <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                        : <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      }
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.productName}</p>
                        <p className="text-xs text-muted-foreground">{p.skuCode} · ${p.unitPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          {wizard.selectedProductIds.length > 0 && (
            <p className="text-xs text-primary text-center">{wizard.selectedProductIds.length}개 제품 선택됨</p>
          )}
        </div>
      )}

      {/* Step 3: 단계 + 이름 설정 */}
      {wizard.step === 3 && (
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">시작 단계 선택</p>
            <div className="grid grid-cols-1 gap-2">
              {STAGES.map(s => (
                <div
                  key={s.key}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                    wizard.stage === s.key
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  )}
                  onClick={() => setWizard(w => ({ ...w, stage: s.key }))}
                >
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STAGE_HEADER_COLORS[s.key])} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">프로젝트 이름</p>
            {autoName && (
              <p className="text-xs text-muted-foreground">자동 생성: <span className="text-foreground">{autoName}</span></p>
            )}
            <Input
              placeholder={autoName || '프로젝트 이름 직접 입력'}
              value={wizard.customName}
              onChange={e => setWizard(w => ({ ...w, customName: e.target.value }))}
            />
          </div>
        </div>
      )}

      <DialogFooter className="gap-2">
        {wizard.step > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setWizard(w => ({ ...w, step: (w.step - 1) as 1 | 2 | 3 }))}
          >
            <ChevronLeft className="h-4 w-4" /> 이전
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="mr-auto">취소</Button>
        {wizard.step < 3 ? (
          <Button
            onClick={() => setWizard(w => ({ ...w, step: (w.step + 1) as 1 | 2 | 3 }))}
            disabled={wizard.step === 1 && buyers.length > 0 && !wizard.buyerId}
          >
            다음 <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={!finalName}>
            만들기
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

// ──────────────────────────────────────────────────────────
// Main Export Projects Page
// ──────────────────────────────────────────────────────────
export default function ExportProjectsPage() {
  const { projects, loading, createProject, updateStage, deleteProject, byStage } = useExportProjects();
  const [selectedProject, setSelectedProject] = useState<ExportProject | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateProject = async (
    name: string,
    stage: ProjectStage,
    buyerId: string,
    buyerName: string,
    productIds: string[],
  ) => {
    setCreating(true);
    const result = await createProject({
      project_name: name,
      stage,
      buyer_id: buyerId || undefined,
      buyer_name: buyerName || undefined,
      products: productIds.map(id => ({ id })),
    });
    setCreating(false);
    if (result) {
      setShowCreateDialog(false);
      toast.success('새 프로젝트가 생성되었습니다.');
    } else {
      toast.error('프로젝트 생성에 실패했습니다.');
    }
  };

  const handleCardClick = (project: ExportProject) => {
    setSelectedProject(project);
  };

  const handleStageChange = (projectId: string, stage: ProjectStage) => {
    updateStage(projectId, stage);
  };

  const handleDelete = (projectId: string) => {
    deleteProject(projectId);
  };

  if (selectedProject) {
    const latestProject = projects.find(p => p.id === selectedProject.id) || selectedProject;
    return <ProjectDetailView project={latestProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">🚀 수출 프로젝트</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              카드를 드래그해서 단계를 변경하거나, 클릭해서 문서를 관리하세요.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2" disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            새 프로젝트
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Kanban Board with Drag & Drop */
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-4 p-4 min-w-max">
            {STAGES.map(s => {
              const stageProjects = byStage(s.key);
              return (
                <DropColumn
                  key={s.key}
                  stage={s.key}
                  stageLabel={s.label}
                  projects={stageProjects}
                  onCardClick={handleCardClick}
                  onStageChange={handleStageChange}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 3-Step Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <CreateProjectWizard
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateProject}
        />
      </Dialog>
    </div>
  );
}
