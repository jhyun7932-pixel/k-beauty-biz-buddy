import React, { useState } from 'react';
import { 
  Shield, 
  User, 
  Building2, 
  Star, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  Award,
  FileCheck,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useExperts, 
  useVerificationRequests, 
  useCreateVerificationRequest,
  useCancelVerificationRequest,
  Expert 
} from '@/hooks/useExperts';

interface ExpertVerificationPanelProps {
  className?: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: '대기중', variant: 'secondary' },
  in_progress: { label: '검토중', variant: 'default' },
  completed: { label: '완료', variant: 'outline' },
  cancelled: { label: '취소됨', variant: 'destructive' },
};

export function ExpertVerificationPanel({ className = '' }: ExpertVerificationPanelProps) {
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'experts' | 'requests'>('experts');

  const { data: experts = [], isLoading: expertsLoading } = useExperts();
  const { data: requests = [], isLoading: requestsLoading } = useVerificationRequests();
  const createRequest = useCreateVerificationRequest();
  const cancelRequest = useCancelVerificationRequest();

  const handleRequestVerification = (expert: Expert) => {
    setSelectedExpert(expert);
    setDescription('');
    setShowRequestModal(true);
  };

  const handleConfirmRequest = () => {
    if (selectedExpert) {
      createRequest.mutate({
        expertId: selectedExpert.id,
        description: description.trim() || undefined,
        requestType: 'document_review',
        priority: 'normal',
      });
    }
    setShowRequestModal(false);
    setSelectedExpert(null);
    setDescription('');
    setActiveTab('requests');
  };

  const handleCancelRequest = (requestId: string) => {
    if (confirm('정말로 이 요청을 취소하시겠습니까?')) {
      cancelRequest.mutate(requestId);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              전문가 검증 서비스
            </h2>
            <p className="text-sm text-muted-foreground">관세사가 직접 서류를 검토하고 조언합니다</p>
          </div>
        </div>
      </div>

      {/* Service Info */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-card">
            <FileCheck className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium">서류 검토</p>
            <p className="text-[10px] text-muted-foreground">PI/계약서 검토</p>
          </div>
          <div className="p-3 rounded-lg bg-card">
            <Award className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium">규제 자문</p>
            <p className="text-[10px] text-muted-foreground">국가별 수출요건</p>
          </div>
          <div className="p-3 rounded-lg bg-card">
            <MessageSquare className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium">1:1 상담</p>
            <p className="text-[10px] text-muted-foreground">실시간 Q&A</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'experts' | 'requests')} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-card px-4 flex-shrink-0">
          <TabsTrigger value="experts" className="gap-1.5">
            <User className="h-4 w-4" />
            전문가 목록
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <FileCheck className="h-4 w-4" />
            내 요청
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Expert List Tab */}
        <TabsContent value="experts" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {expertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : experts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>등록된 전문가가 없습니다.</p>
                </div>
              ) : (
                experts.map((expert) => (
                  <Card 
                    key={expert.id} 
                    className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                    onClick={() => handleRequestVerification(expert)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{expert.name}</span>
                            {expert.verified && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{expert.title}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3" />
                            {expert.organization}
                          </div>
                          
                          {/* Specialties */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {expert.specialty.slice(0, 3).map((spec) => (
                              <Badge key={spec} variant="outline" className="text-[10px] px-1.5">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-primary" />
                              <span className="font-medium">{expert.rating}</span>
                              <span className="text-muted-foreground">({expert.review_count})</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {expert.response_time}
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="requests" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {requestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-8 w-8 mx-auto mb-2" />
                  <p>검증 요청 내역이 없습니다.</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => setActiveTab('experts')}
                  >
                    전문가 목록 보기
                  </Button>
                </div>
              ) : (
                requests.map((request) => {
                  const statusInfo = STATUS_LABELS[request.status] || STATUS_LABELS.pending;
                  
                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.requested_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          {request.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCancelRequest(request.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {request.expert && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{request.expert.name}</p>
                              <p className="text-xs text-muted-foreground">{request.expert.organization}</p>
                            </div>
                          </div>
                        )}
                        
                        {request.description && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                            {request.description}
                          </p>
                        )}
                        
                        {request.expert_notes && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200/50">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">전문가 답변:</p>
                            <p className="text-sm">{request.expert_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer CTA */}
      <div className="p-4 border-t bg-card">
        <Button className="w-full gap-2" variant="outline" disabled>
          <ExternalLink className="h-4 w-4" />
          전문가 등록 신청 (준비중)
        </Button>
      </div>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              전문가 검증 요청
            </DialogTitle>
            <DialogDescription>
              {selectedExpert?.name} {selectedExpert?.title}님께 서류 검증을 요청합니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpert && (
            <div className="py-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedExpert.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedExpert.organization}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">응답 예상 시간</span>
                      <span>{selectedExpert.response_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">평점</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-primary" />
                        {selectedExpert.rating}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">
                  요청 내용 (선택사항)
                </label>
                <Textarea
                  placeholder="검토가 필요한 내용이나 질문을 입력해주세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              취소
            </Button>
            <Button 
              onClick={handleConfirmRequest} 
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  요청중...
                </>
              ) : (
                '검증 요청'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
