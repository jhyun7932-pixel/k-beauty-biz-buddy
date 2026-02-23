import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CRMKPICards } from './CRMKPICards';
import { BuyerKanbanCard } from './BuyerKanbanCard';
import { BuyerDetailPanel } from './BuyerDetailPanel';
import { BuyerFormModal } from '@/components/buyers/BuyerFormModal';
import type { CRMBuyer, CRMDeal, CRMKPIData, DealStatusStage } from '@/types/onboarding';
import { DEAL_STATUS_STAGES } from '@/types/onboarding';

interface CRMPipelineBoardProps {
  buyersByStage: Record<DealStatusStage, CRMBuyer[]>;
  deals: CRMDeal[];
  kpi: CRMKPIData;
  loading: boolean;
  onStageChange: (buyerId: string, stage: DealStatusStage) => Promise<any>;
  onBuyerCreated: () => void;
  getDealsForBuyer: (buyerId: string) => CRMDeal[];
  getInteractionsForBuyer: (buyerId: string) => any[];
}

export function CRMPipelineBoard({
  buyersByStage,
  deals,
  kpi,
  loading,
  onStageChange,
  onBuyerCreated,
  getDealsForBuyer,
  getInteractionsForBuyer,
}: CRMPipelineBoardProps) {
  const [selectedBuyer, setSelectedBuyer] = useState<CRMBuyer | null>(null);
  const [showAddBuyer, setShowAddBuyer] = useState(false);

  const handleStageChange = async (buyerId: string, stage: DealStatusStage) => {
    await onStageChange(buyerId, stage);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with KPI + CTAs */}
      <div className="p-4 border-b border-border space-y-4">
        {/* 안내 문구 */}
        <div className="text-sm text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg">
          💡 바이어를 '연락처'로 관리하지 마세요. 딜 조건과 문서를 연결하면 일이 줄어듭니다.
        </div>

        {/* KPI Cards */}
        <CRMKPICards kpi={kpi} />

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1" onClick={() => setShowAddBuyer(true)}>
            <Plus className="h-4 w-4" />
            바이어 추가
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            딜 생성
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 ml-auto">
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex gap-3 p-4 min-w-max">
            {DEAL_STATUS_STAGES.map(stage => {
              const buyers = buyersByStage[stage.value] || [];
              
              return (
                <div
                  key={stage.value}
                  className="flex-shrink-0 w-72 flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {buyers.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2 min-h-[200px]">
                    {buyers.length === 0 ? (
                      <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          바이어 없음
                        </p>
                      </div>
                    ) : (
                      buyers.map(buyer => (
                        <BuyerKanbanCard
                          key={buyer.buyerId}
                          buyer={buyer}
                          deals={getDealsForBuyer(buyer.buyerId)}
                          onSelect={() => setSelectedBuyer(buyer)}
                          onStageChange={(stage) => handleStageChange(buyer.buyerId, stage)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Buyer Detail Panel (Slide-over) */}
      {selectedBuyer && (
        <BuyerDetailPanel
          buyer={selectedBuyer}
          deals={getDealsForBuyer(selectedBuyer.buyerId)}
          interactions={getInteractionsForBuyer(selectedBuyer.buyerId)}
          onClose={() => setSelectedBuyer(null)}
        />
      )}

      {/* Add Buyer Modal */}
      <BuyerFormModal
        open={showAddBuyer}
        onClose={() => setShowAddBuyer(false)}
        onSuccess={() => {
          setShowAddBuyer(false);
          onBuyerCreated();
        }}
      />
    </div>
  );
}
