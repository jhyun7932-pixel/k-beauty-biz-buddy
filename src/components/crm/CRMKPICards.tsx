import React from 'react';
import { Bell, TrendingUp, Package, FileX } from 'lucide-react';
import type { CRMKPIData } from '@/types/onboarding';

interface CRMKPICardsProps {
  kpi: CRMKPIData;
}

export function CRMKPICards({ kpi }: CRMKPICardsProps) {
  const cards = [
    {
      label: '이번 주 후속 필요',
      value: kpi.followUpNeeded,
      icon: Bell,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      label: '진행 중 딜',
      value: kpi.activeDeals,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: '샘플→본오더 후보',
      value: kpi.sampleToOrderCandidates,
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: '문서 미발송 딜',
      value: kpi.unsentDocuments,
      icon: FileX,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
