import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDealOS } from '@/hooks/useDealOS';
import { CRMPipelineBoard } from '@/components/crm/CRMPipelineBoard';
import { Loader2, LogIn, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DealStatusStage } from '@/types/onboarding';

type ViewMode = 'kanban' | 'list';

export function BuyersTab() {
  const { isAuthenticated } = useAuth();
  const { 
    buyers, 
    deals,
    kpi,
    loading, 
    updateBuyerStage,
    loadData,
    getDealsForBuyer,
    getInteractionsForBuyer,
    getBuyersByStage,
  } = useDealOS();
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const handleStageChange = async (buyerId: string, stage: DealStatusStage) => {
    return await updateBuyerStage(buyerId, stage);
  };

  // 로그인 필요
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">로그인이 필요합니다</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deal OS CRM 기능을 사용하려면 먼저 로그인해주세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* View Toggle (선택사항) */}
      <div className="flex items-center justify-end gap-1 px-4 pt-4">
        <Button
          variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-2"
          onClick={() => setViewMode('kanban')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-2"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Pipeline Board */}
      <CRMPipelineBoard
        buyersByStage={getBuyersByStage()}
        deals={deals}
        kpi={kpi}
        loading={loading}
        onStageChange={handleStageChange}
        onBuyerCreated={loadData}
        getDealsForBuyer={getDealsForBuyer}
        getInteractionsForBuyer={getInteractionsForBuyer}
      />
    </div>
  );
}
