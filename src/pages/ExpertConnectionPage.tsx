import React, { useState } from 'react';
import { useProjectStore, COUNTRY_NAMES, type Project } from '@/stores/projectStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/hooks/useCompany';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Handshake, Ship, Scale, FileText, MapPin, Package, CheckCircle2, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

type ExpertType = 'customs' | 'forwarder';

export default function ExpertConnectionPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('type');
  const [activeTab, setActiveTab] = useState<ExpertType>(
    tabParam === 'forwarder' ? 'forwarder' : 'customs'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const projects = useProjectStore((s) => s.projects);

  // Filter: only projects in '본 오더 및 계약' stage or later
  const eligibleProjects = projects.filter(
    (p) => p.pipelineStage === '본 오더 및 계약' || p.pipelineStage === '선적 및 통관' || p.pipelineStage === '수출 완료'
  );

  const selectedProject = eligibleProjects.find((p) => p.id === selectedProjectId) || null;

  const { user } = useAuth();
  const { company } = useCompany();

  const handleSubmit = async () => {
    if (!user || !selectedProject) return;

    await supabase.from('expert_connection_requests').insert({
      user_id: user.id,
      project_name: selectedProject.name,
      expert_type: activeTab,
      company_name: company?.name || null,
      target_countries: selectedProject.context.targetCountries,
      documents: selectedProject.documents.map(d => ({ id: d.id, title: d.title })),
      message: message || null,
    });

    setShowSuccess(true);
    setMessage('');
    setSelectedProjectId('');
  };

  const tabConfig = {
    customs: {
      icon: Scale,
      title: '관세사 매칭',
      subtitle: '수출 통관 전문 관세사를 연결해 드립니다',
      ctaLabel: '해당 국가 전문 관세사에게 견적 요청하기',
      expertLabel: '관세사',
    },
    forwarder: {
      icon: Ship,
      title: '포워더 매칭',
      subtitle: '국제 물류 전문 포워더를 연결해 드립니다',
      ctaLabel: '해당 국가 전문 포워더에게 견적 요청하기',
      expertLabel: '포워더',
    },
  };

  const config = tabConfig[activeTab];
  const TabIcon = config.icon;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <Handshake className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">전문가 연결</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          본오더 계약 완료 후 통관·물류 전문가에게 업무를 의뢰할 수 있습니다.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6">
        <div className="flex gap-1">
          {(['customs', 'forwarder'] as ExpertType[]).map((tab) => {
            const tc = tabConfig[tab];
            const TIcon = tc.icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <TIcon className="h-4 w-4" />
                {tc.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
          {/* Intro Card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <TabIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
                <p className="text-sm text-muted-foreground">{config.subtitle}</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-foreground font-medium mb-2">
                어떤 수출 프로젝트의 {activeTab === 'customs' ? '통관' : '물류'}을 의뢰하시겠습니까?
              </p>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="프로젝트를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {eligibleProjects.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      <p className="font-medium mb-1">'본 오더 및 계약' 단계 이상의 프로젝트가 없습니다</p>
                      <p className="text-xs">수출 프로젝트의 파이프라인 단계를 진행해 주세요.</p>
                    </div>
                  ) : (
                    eligibleProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {p.pipelineStage}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inquiry Form - shown only when project selected */}
          {selectedProject && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Auto-attached info */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  자동 첨부 내역
                  <Badge variant="secondary" className="text-[10px]">Read-only</Badge>
                </h3>

                <div className="space-y-3">
                  {/* Destination Countries */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">목적지(국가)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProject.context.targetCountries.length > 0 ? (
                          selectedProject.context.targetCountries.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs">
                              {COUNTRY_NAMES[c] || c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">미설정</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CBM / Weight placeholder */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">총 CBM / 중량</p>
                      <p className="text-sm text-foreground">
                        프로젝트 데이터에서 자동 계산 (예: 2.5 CBM / 150kg)
                      </p>
                    </div>
                  </div>

                  {/* Generated Documents */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">생성된 문서</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProject.documents.length > 0 ? (
                          selectedProject.documents.map((doc) => (
                            <Badge key={doc.id} className="text-xs bg-primary/10 text-primary border-primary/20">
                              {doc.title}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">생성된 문서 없음</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  문의 내용
                </label>
                <Textarea
                  placeholder="특별 요청사항이나 궁금한 점을 남겨주세요."
                  className="min-h-[120px] resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Submit */}
              <Button
                className="w-full h-12 text-base gap-2"
                size="lg"
                onClick={handleSubmit}
              >
                <TabIcon className="h-5 w-5" />
                {config.ctaLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center items-center">
            <div className="mx-auto p-3 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-lg">요청이 완료되었습니다!</DialogTitle>
            <DialogDescription className="text-center">
              24시간 내에 복수의 전문 {config.expertLabel} 견적이 도착합니다.
              <br />
              마이 데이터 &gt; 전문가 연결 내역에서 확인하실 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full mt-2" onClick={() => setShowSuccess(false)}>
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
