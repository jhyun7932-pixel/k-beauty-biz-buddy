import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Inbox, MapPin, Package, FileText, Send, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface ExpertRequest {
  id: string;
  project_name: string;
  expert_type: string;
  company_name: string | null;
  target_countries: string[];
  total_cbm: string | null;
  total_weight: string | null;
  documents: { title: string }[];
  message: string | null;
  status: string;
  created_at: string;
}

export default function PartnerLeadsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ExpertRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ExpertRequest | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ costUsd: '', costKrw: '', duration: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('expert_connection_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data) {
        setRequests(data.map(d => ({
          ...d,
          target_countries: Array.isArray(d.target_countries) ? d.target_countries as string[] : [],
          documents: Array.isArray(d.documents) ? d.documents as { title: string }[] : [],
        })));
      }
    };
    fetchRequests();
  }, [user]);

  const handleSubmitQuote = async () => {
    if (!user || !selectedRequest) return;
    setSubmitting(true);

    const { error } = await supabase.from('partner_quotes').insert({
      request_id: selectedRequest.id,
      partner_id: user.id,
      estimated_cost_usd: quoteForm.costUsd ? Number(quoteForm.costUsd) : null,
      estimated_cost_krw: quoteForm.costKrw ? Number(quoteForm.costKrw) : null,
      estimated_duration: quoteForm.duration || null,
      comment: quoteForm.comment || null,
    });

    if (error) {
      toast.error('견적 제출에 실패했습니다.');
    } else {
      // Update request status
      await supabase
        .from('expert_connection_requests')
        .update({ status: 'quoted', assigned_partner_id: user.id })
        .eq('id', selectedRequest.id);

      toast.success('견적이 성공적으로 제출되었습니다!');
      setShowQuoteForm(false);
      setSelectedRequest(null);
      setQuoteForm({ costUsd: '', costKrw: '', duration: '', comment: '' });
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="h-6 w-6" />
          신규 견적 요청
        </h1>
        <p className="text-sm text-muted-foreground mt-1">수출 기업에서 보낸 통관/물류 의뢰를 확인하고 견적을 제출하세요.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">신규 견적 요청이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">새로운 의뢰가 들어오면 이곳에 표시됩니다.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>요청사</span>
            <span>도착 국가</span>
            <span>품목</span>
            <span>중량/CBM</span>
            <span>요청일</span>
            <span></span>
          </div>
          
          {requests.map((req) => (
            <div
              key={req.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors items-center"
              onClick={() => setSelectedRequest(req)}
            >
              <div>
                <p className="font-medium text-sm text-foreground">{req.company_name || req.project_name}</p>
                <p className="text-xs text-muted-foreground">{req.project_name}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {req.target_countries.slice(0, 2).map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                ))}
                {req.target_countries.length > 2 && (
                  <Badge variant="outline" className="text-[10px]">+{req.target_countries.length - 2}</Badge>
                )}
              </div>
              <span className="text-sm text-foreground">K-Beauty</span>
              <span className="text-sm text-foreground">
                {req.total_weight || req.total_cbm || '-'}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(req.created_at).toLocaleDateString('ko-KR')}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      {/* Detail Slide Panel */}
      <Sheet open={!!selectedRequest} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setShowQuoteForm(false); } }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRequest && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle className="text-lg">의뢰 상세 정보</SheetTitle>
              </SheetHeader>

              {/* Project Info */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">프로젝트</span>
                  </div>
                  <p className="text-sm text-foreground">{selectedRequest.project_name}</p>
                  {selectedRequest.company_name && (
                    <p className="text-xs text-muted-foreground">요청사: {selectedRequest.company_name}</p>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">도착 국가</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRequest.target_countries.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>

                {(selectedRequest.total_cbm || selectedRequest.total_weight) && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <span className="text-sm font-medium text-foreground">물량 정보</span>
                    <p className="text-sm text-foreground">
                      {selectedRequest.total_cbm && `CBM: ${selectedRequest.total_cbm}`}
                      {selectedRequest.total_cbm && selectedRequest.total_weight && ' / '}
                      {selectedRequest.total_weight && `중량: ${selectedRequest.total_weight}`}
                    </p>
                  </div>
                )}

                {/* Documents */}
                {selectedRequest.documents.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">첨부 문서</span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedRequest.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20">{doc.title}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                {selectedRequest.message && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <span className="text-sm font-medium text-foreground">의뢰 내용</span>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRequest.message}</p>
                  </div>
                )}
              </div>

              {/* Quote Form */}
              {!showQuoteForm ? (
                <Button
                  className="w-full h-12 text-base gap-2"
                  style={{ backgroundColor: 'hsl(160 60% 35%)', color: 'white' }}
                  onClick={() => setShowQuoteForm(true)}
                >
                  <Send className="h-5 w-5" />
                  견적서 보내기
                </Button>
              ) : (
                <div className="space-y-4 p-4 rounded-xl border border-border bg-card animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">견적 입력</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowQuoteForm(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">예상 비용 (USD)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={quoteForm.costUsd}
                        onChange={(e) => setQuoteForm(p => ({ ...p, costUsd: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">예상 비용 (KRW)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={quoteForm.costKrw}
                        onChange={(e) => setQuoteForm(p => ({ ...p, costKrw: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">소요 기간</Label>
                    <Input
                      placeholder="예: 영업일 기준 3-5일"
                      value={quoteForm.duration}
                      onChange={(e) => setQuoteForm(p => ({ ...p, duration: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">파트너 코멘트</Label>
                    <Textarea
                      placeholder="추가 안내사항이나 특이사항을 남겨주세요."
                      className="min-h-[80px] resize-none"
                      value={quoteForm.comment}
                      onChange={(e) => setQuoteForm(p => ({ ...p, comment: e.target.value }))}
                    />
                  </div>

                  <Button
                    className="w-full gap-2"
                    style={{ backgroundColor: 'hsl(160 60% 35%)', color: 'white' }}
                    onClick={handleSubmitQuote}
                    disabled={submitting || (!quoteForm.costUsd && !quoteForm.costKrw)}
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? '제출 중...' : '견적 제출'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
