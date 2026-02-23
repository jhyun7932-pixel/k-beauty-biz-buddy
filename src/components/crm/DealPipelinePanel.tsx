import React, { useState } from 'react';
import { 
  ArrowRight, Mail, Phone, Globe, Building2, X, 
  FileText, CheckCircle2, Circle, Clock, ChevronRight,
  Plus, MessageSquare, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCountryDisplay } from '@/lib/countryFlags';
import { toast } from 'sonner';
import type { Buyer } from '@/hooks/useBuyers';
import type { DealStatusStage } from '@/types/onboarding';

// ── Deal Pipeline Stages ──
const PIPELINE_STAGES: { key: DealStatusStage; label: string; labelEn: string; color: string }[] = [
  { key: 'lead', label: '리드', labelEn: 'Lead', color: 'bg-muted text-muted-foreground' },
  { key: 'contacted', label: '연락완료', labelEn: 'Contact', color: 'bg-blue-100 text-blue-700' },
  { key: 'replied', label: '회신', labelEn: 'Reply', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'sample', label: '샘플', labelEn: 'Sample', color: 'bg-purple-100 text-purple-700' },
  { key: 'negotiation', label: '협상중', labelEn: 'Negotiation', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'won', label: '계약', labelEn: 'Won', color: 'bg-green-100 text-green-700' },
  { key: 'lost', label: '보류', labelEn: 'Lost', color: 'bg-red-100 text-red-700' },
];

// ── Required documents per stage ──
const STAGE_TODO_ITEMS: Record<string, { doc: string; description: string; icon: string }[]> = {
  lead: [
    { doc: '브랜드 소개서', description: '회사/브랜드 개요 1-pager', icon: '🏢' },
    { doc: '제품 카탈로그', description: '가격/MOQ 포함 라인업', icon: '📚' },
  ],
  contacted: [
    { doc: '첫 제안 이메일', description: '바이어 맞춤 아웃리치 메시지', icon: '✉️' },
    { doc: 'Deal Sheet', description: '조건 요약 1-pager', icon: '📋' },
  ],
  replied: [
    { doc: '규제 스냅샷', description: '타겟 국가 규제 체크', icon: '✅' },
    { doc: '성분표 검토', description: 'INCI 매핑 및 금지성분 체크', icon: '🧪' },
  ],
  sample: [
    { doc: '샘플 PI', description: '샘플 발송용 견적서', icon: '📄' },
    { doc: '패킹 리스트', description: '샘플 포장 명세서', icon: '📦' },
    { doc: 'MSDS', description: '물질안전보건자료', icon: '⚗️' },
    { doc: '발송 안내문', description: '트래킹/ETA 정보', icon: '🚚' },
  ],
  negotiation: [
    { doc: '최종 PI', description: '정식 견적서', icon: '📄' },
    { doc: '판매 계약서', description: '계약 조건 초안', icon: '📝' },
    { doc: 'COA', description: '성적분석서', icon: '🔬' },
  ],
  won: [
    { doc: '상업 송장', description: 'Commercial Invoice', icon: '💰' },
    { doc: '패킹 리스트', description: '최종 포장명세서', icon: '📦' },
    { doc: '선적 지시서', description: '포워더용 선적 정보', icon: '🚢' },
    { doc: 'B/L 또는 AWB', description: '운송 서류', icon: '📋' },
  ],
  lost: [
    { doc: '재접촉 이메일', description: '신제품/프로모션 안내', icon: '✉️' },
  ],
};

interface DealPipelinePanelProps {
  buyer: Buyer;
  onClose: () => void;
  onStageChange?: (buyerId: string, stage: DealStatusStage) => Promise<any>;
}

export function DealPipelinePanel({ buyer, onClose, onStageChange }: DealPipelinePanelProps) {
  const currentStage = (buyer as any).status_stage ?? 'lead';
  const [activeTab, setActiveTab] = useState('overview');
  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStage);
  const todoItems = STAGE_TODO_ITEMS[currentStage] || [];

  const handleStageChange = async (newStage: string) => {
    if (onStageChange) {
      const result = await onStageChange(buyer.id, newStage as DealStatusStage);
      if (result?.error) {
        toast.error('상태 변경 실패');
      } else {
        toast.success(`${PIPELINE_STAGES.find(s => s.key === newStage)?.label}(으)로 변경되었습니다`);
      }
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{buyer.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{getCountryDisplay(buyer.country)}</Badge>
            {buyer.channel && <Badge variant="secondary" className="text-xs">{buyer.channel}</Badge>}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Pipeline Progress */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.filter(s => s.key !== 'lost').map((stage, idx) => {
            const isActive = stage.key === currentStage;
            const isPast = idx < currentStageIndex;
            return (
              <React.Fragment key={stage.key}>
                {idx > 0 && (
                  <ChevronRight className={`h-3 w-3 flex-shrink-0 ${isPast ? 'text-primary' : 'text-muted-foreground/30'}`} />
                )}
                <button
                  onClick={() => handleStageChange(stage.key)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : isPast
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {stage.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Select value={currentStage} onValueChange={handleStageChange}>
            <SelectTrigger className="h-7 text-xs w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map(s => (
                <SelectItem key={s.key} value={s.key} className="text-xs">
                  {s.label} ({s.labelEn})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-card px-2 h-auto py-1">
          <TabsTrigger value="overview" className="text-xs px-3 py-1.5">개요</TabsTrigger>
          <TabsTrigger value="todo" className="text-xs px-3 py-1.5 gap-1">
            To-Do
            <Badge variant="secondary" className="text-[10px] h-4 px-1">{todoItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contact" className="text-xs px-3 py-1.5">연락처</TabsTrigger>
          <TabsTrigger value="history" className="text-xs px-3 py-1.5">히스토리</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0 p-4 space-y-4">
            {/* Next Action Card */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">다음 액션</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getNextActionText(currentStage)}
              </p>
              <Button size="sm" className="mt-3 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                실행하기
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">현재 단계</p>
                <p className="text-lg font-bold mt-1">
                  {PIPELINE_STAGES.find(s => s.key === currentStage)?.label}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">필요 서류</p>
                <p className="text-lg font-bold mt-1">{todoItems.length}건</p>
              </div>
            </div>

            {/* Notes */}
            {buyer.notes && (
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">메모</p>
                <p className="text-sm">{buyer.notes}</p>
              </div>
            )}

            {/* Dates */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>등록일: {new Date(buyer.created_at).toLocaleDateString('ko-KR')}</p>
              <p>최근 수정: {new Date(buyer.updated_at).toLocaleDateString('ko-KR')}</p>
            </div>
          </TabsContent>

          {/* To-Do Tab */}
          <TabsContent value="todo" className="m-0 p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                {PIPELINE_STAGES.find(s => s.key === currentStage)?.label} 단계 필요 서류
              </h3>
            </div>
            {todoItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                이 단계에 필요한 서류가 없습니다.
              </p>
            ) : (
              todoItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.doc}</span>
                      <Badge variant="outline" className="text-[10px]">미완료</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-1" />
                </div>
              ))
            )}

            {/* Other stages preview */}
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground font-medium">다른 단계 서류 미리보기</p>
            {PIPELINE_STAGES.filter(s => s.key !== currentStage && s.key !== 'lost').map(stage => {
              const items = STAGE_TODO_ITEMS[stage.key] || [];
              if (items.length === 0) return null;
              return (
                <div key={stage.key} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-4">{items.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {items.map((item, idx) => (
                      <span key={idx} className="text-[10px] bg-background px-2 py-0.5 rounded border">
                        {item.icon} {item.doc}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="m-0 p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">연락처 정보</h3>
              {buyer.contact_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{buyer.contact_name}</span>
                </div>
              )}
              {buyer.contact_email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${buyer.contact_email}`} className="text-primary hover:underline">
                    {buyer.contact_email}
                  </a>
                </div>
              )}
              {buyer.contact_phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{buyer.contact_phone}</span>
                </div>
              )}
              {buyer.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={buyer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    {buyer.website}
                  </a>
                </div>
              )}
              {buyer.company_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">회사명</p>
                    <p className="text-sm font-medium mt-0.5">{buyer.company_name}</p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="m-0 p-4">
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">인터랙션 히스토리가 없습니다</p>
              <p className="text-xs mt-1">이메일, 미팅 등 활동을 기록하세요</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                인터랙션 추가
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function getNextActionText(stage: string): string {
  switch (stage) {
    case 'lead': return '브랜드 소개서와 카탈로그를 준비하여 첫 제안 이메일을 발송하세요.';
    case 'contacted': return '바이어의 회신을 기다리며, 후속 이메일을 준비하세요.';
    case 'replied': return '바이어의 관심사를 파악하고, 샘플 조건을 확정하세요.';
    case 'sample': return '샘플 PI를 작성하고, MSDS와 함께 발송하세요.';
    case 'negotiation': return '최종 PI와 계약서 초안을 준비하세요.';
    case 'won': return '출하 서류(Invoice, P/L, B/L)를 준비하세요.';
    case 'lost': return '새로운 제품이나 프로모션으로 재접촉을 시도하세요.';
    default: return '다음 단계를 계획하세요.';
  }
}
