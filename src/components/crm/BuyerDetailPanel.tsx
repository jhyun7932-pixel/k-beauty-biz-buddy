import React from 'react';
import { 
  X, 
  Globe, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  FileText, 
  Plus, 
  MessageSquare,
  Calendar,
  Package,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CRMBuyer, CRMDeal, CRMInteraction } from '@/types/onboarding';
import { 
  getNextActionForStage, 
  DEAL_STATUS_STAGES, 
  ONBOARDING_BUYER_TYPES 
} from '@/types/onboarding';

interface BuyerDetailPanelProps {
  buyer: CRMBuyer;
  deals: CRMDeal[];
  interactions: CRMInteraction[];
  onClose: () => void;
}

export function BuyerDetailPanel({ buyer, deals, interactions, onClose }: BuyerDetailPanelProps) {
  const nextAction = getNextActionForStage(buyer.statusStage);
  const stageInfo = DEAL_STATUS_STAGES.find(s => s.value === buyer.statusStage);
  const buyerTypeLabel = ONBOARDING_BUYER_TYPES.find(t => t.value === buyer.buyerType)?.label || buyer.buyerType;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{buyer.companyName}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              {buyer.country}
              <span>·</span>
              {buyerTypeLabel}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* A. Buyer Profile */}
          <section>
            <h3 className="text-sm font-medium text-foreground mb-3">Buyer Profile</h3>
            <div className="space-y-2 text-sm">
              {buyer.contactName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{buyer.contactName}</span>
                </div>
              )}
              {buyer.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${buyer.contactEmail}`} className="text-primary hover:underline">
                    {buyer.contactEmail}
                  </a>
                </div>
              )}
              {buyer.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{buyer.contactPhone}</span>
                </div>
              )}
              {buyer.website && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a href={buyer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {buyer.website}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${stageInfo?.color || 'bg-muted'}`}>
                  {stageInfo?.label || buyer.statusStage}
                </span>
              </div>
              {buyer.notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded mt-2">
                  {buyer.notes}
                </p>
              )}
            </div>
          </section>

          <Separator />

          {/* B. Deal Card */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Deal Card</h3>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                딜 추가
              </Button>
            </div>
            
            {deals.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">등록된 딜이 없습니다</p>
                <p className="text-xs text-muted-foreground mt-1">
                  딜 조건을 한 번만 입력하면, Deal Sheet/PI/메일이 자동으로 따라옵니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {deals.map(deal => (
                  <div key={deal.dealId} className="p-3 rounded-lg border border-border bg-muted/20">
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted-foreground">MOQ</span>
                        <p className="font-medium">{deal.moq}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">단가</span>
                        <p className="font-medium">${deal.unitPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">통화</span>
                        <p className="font-medium">{deal.currency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">인코텀즈</span>
                        <p className="font-medium">{deal.incoterms}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">결제</span>
                        <p className="font-medium">{deal.paymentTerms}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">리드타임</span>
                        <p className="font-medium">{deal.leadTime}일</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                        딜 시트 생성
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                        PI 생성
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* C. Docs Center */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Docs Center</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              이 바이어에게 보낸 문서가 자동으로 모입니다.
            </p>
            
            {deals.some(d => d.docRefs.length > 0) ? (
              <div className="space-y-2">
                {/* Documents would be listed here */}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-border rounded-lg">
                <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">연결된 문서가 없습니다</p>
              </div>
            )}

            <div className="mt-3 space-y-2">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Package className="h-3.5 w-3.5 mr-1" />
                바이어 패키지 한 번에 생성 (ZIP)
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Mail className="h-3.5 w-3.5 mr-1" />
                이메일 3종 생성 (첫제안/샘플후속/클로징)
              </Button>
            </div>
          </section>

          <Separator />

          {/* D. Follow-up Timeline */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Follow-up Timeline</h3>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                로그 추가
              </Button>
            </div>

            {/* Next Action Recommendation */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-3">
              <p className="text-xs text-muted-foreground mb-1">다음에 할 일을 AI가 추천합니다.</p>
              <Button size="sm" className="w-full h-8 text-xs gap-1">
                <ArrowRight className="h-3.5 w-3.5" />
                {nextAction.label}
              </Button>
            </div>

            {/* Follow-up Date */}
            {buyer.nextFollowUpDate && (
              <div className="flex items-center gap-2 text-xs mb-3 p-2 rounded bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>다음 후속: {new Date(buyer.nextFollowUpDate).toLocaleDateString('ko-KR')}</span>
              </div>
            )}

            {/* Interaction Log */}
            {interactions.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-border rounded-lg">
                <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">커뮤니케이션 기록이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {interactions.slice(0, 5).map(interaction => (
                  <div key={interaction.interactionId} className="flex items-start gap-2 p-2 rounded bg-muted/20 text-xs">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{interaction.interactionType}</span>
                        {interaction.sentAt && (
                          <span className="text-muted-foreground">
                            {new Date(interaction.sentAt).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                      {interaction.subject && (
                        <p className="text-muted-foreground">{interaction.subject}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                후속 메일 생성
              </Button>
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
                다음 액션 등록
              </Button>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
