import React from 'react';
import { MapPin, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BuyerGoal } from '@/types';

interface CurrentGoalPillProps {
  goal: BuyerGoal;
  onEdit?: () => void;
  isSampleMode?: boolean;
}

const CHANNEL_LABELS: Record<string, string> = {
  distributor: '유통/도매',
  retail: '리테일',
  online_market: '온라인',
  d2c: 'D2C',
};

const BUYER_TYPE_LABELS: Record<string, string> = {
  importer: '수입사',
  distributor: '유통사',
  retailer: '리테일러',
  reseller: '셀러',
};

export function CurrentGoalPill({ goal, onEdit, isSampleMode }: CurrentGoalPillProps) {
  const countryText = goal.countries.join(' · ');
  const channelText = goal.channel ? CHANNEL_LABELS[goal.channel] : '';
  const buyerTypeText = goal.buyerType ? BUYER_TYPE_LABELS[goal.buyerType] : '';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-full">
      <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
      <div className="flex items-center gap-1 text-xs font-medium text-foreground">
        <span>목표:</span>
        <span className="text-primary">{countryText}</span>
        <span className="text-muted-foreground">·</span>
        <span>{channelText}</span>
        <span className="text-muted-foreground">·</span>
        <span>{buyerTypeText}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{goal.language}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{goal.currency}</span>
      </div>
      
      {isSampleMode && (
        <span className="badge-sample ml-1">샘플</span>
      )}
      
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 ml-1"
          onClick={onEdit}
        >
          <Edit2 className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
