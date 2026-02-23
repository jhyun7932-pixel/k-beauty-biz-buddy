import React, { useState } from 'react';
import { Globe, Calendar, ArrowRight, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { CRMBuyer, CRMDeal, DealStatusStage } from '@/types/onboarding';
import { DEAL_STATUS_STAGES, getNextActionForStage, ONBOARDING_BUYER_TYPES } from '@/types/onboarding';

interface BuyerKanbanCardProps {
  buyer: CRMBuyer;
  deals: CRMDeal[];
  onSelect: () => void;
  onStageChange: (stage: DealStatusStage) => void;
}

export function BuyerKanbanCard({ buyer, deals, onSelect, onStageChange }: BuyerKanbanCardProps) {
  const [isChangingStage, setIsChangingStage] = useState(false);
  const latestDeal = deals[0];
  const nextAction = getNextActionForStage(buyer.statusStage);
  
  const isOverdue = buyer.nextFollowUpDate && new Date(buyer.nextFollowUpDate) < new Date();
  const daysUntilFollowUp = buyer.nextFollowUpDate
    ? Math.ceil((new Date(buyer.nextFollowUpDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const buyerTypeLabel = ONBOARDING_BUYER_TYPES.find(t => t.value === buyer.buyerType)?.label || buyer.buyerType;
  
  const currentStage = DEAL_STATUS_STAGES.find(s => s.value === buyer.statusStage);

  const handleStageChange = async (stage: DealStatusStage) => {
    if (stage === buyer.statusStage) return;
    
    setIsChangingStage(true);
    try {
      await onStageChange(stage);
      const newStageLabel = DEAL_STATUS_STAGES.find(s => s.value === stage)?.label || stage;
      toast.success(`${buyer.companyName}이(가) "${newStageLabel}" 단계로 이동했습니다.`);
    } catch (error) {
      toast.error('단계 변경에 실패했습니다.');
    } finally {
      setIsChangingStage(false);
    }
  };

  return (
    <div
      className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {buyer.companyName}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary">
              <Globe className="h-3 w-3" />
              {buyer.country}
            </span>
            <span className="text-xs text-muted-foreground">{buyerTypeLabel}</span>
          </div>
        </div>
        
        {/* Stage Change Dropdown - Improved UX */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 gap-1 text-xs ${currentStage?.color || ''}`}
              disabled={isChangingStage}
            >
              {currentStage?.label || buyer.statusStage}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {DEAL_STATUS_STAGES.map(stage => (
              <DropdownMenuItem
                key={stage.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStageChange(stage.value);
                }}
                className="flex items-center justify-between"
              >
                <span className={stage.color}>{stage.label}</span>
                {stage.value === buyer.statusStage && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Next Action */}
      <div className="flex items-center gap-2 mb-2">
        <button
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Handle next action
          }}
        >
          <ArrowRight className="h-3 w-3" />
          {nextAction.label}
        </button>
        
        {daysUntilFollowUp !== null && (
          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            {isOverdue ? '지연' : `D-${daysUntilFollowUp}`}
          </span>
        )}
      </div>

      {/* Deal Summary */}
      {latestDeal && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            MOQ {latestDeal.moq}, ${latestDeal.unitPrice.toFixed(2)}, {latestDeal.incoterms}, {latestDeal.paymentTerms}
          </p>
        </div>
      )}
    </div>
  );
}
