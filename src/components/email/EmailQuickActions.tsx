import React from 'react';
import { Mail, Send, Package, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EmailType } from '@/lib/api/emailGenerator';

interface EmailQuickActionsProps {
  onSelectType: (type: EmailType) => void;
  selectedType?: EmailType;
  disabled?: boolean;
  compact?: boolean;
}

const EMAIL_OPTIONS: Array<{
  type: EmailType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    type: 'first_proposal',
    label: '첫 제안',
    description: '브랜드 소개 및 협력 제안',
    icon: Send,
    color: 'text-blue-500',
  },
  {
    type: 'sample_followup',
    label: '샘플 후속',
    description: '샘플 발송 후 피드백 요청',
    icon: Package,
    color: 'text-amber-500',
  },
  {
    type: 'closing',
    label: '클로징',
    description: '계약 체결 및 조건 확정',
    icon: Handshake,
    color: 'text-green-500',
  },
];

export function EmailQuickActions({
  onSelectType,
  selectedType,
  disabled = false,
  compact = false,
}: EmailQuickActionsProps) {
  if (compact) {
    return (
      <div className="flex gap-1">
        {EMAIL_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.type;
          
          return (
            <Button
              key={option.type}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectType(option.type)}
              disabled={disabled}
              className="h-8"
            >
              <Icon className={cn('h-3.5 w-3.5 mr-1', !isSelected && option.color)} />
              {option.label}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {EMAIL_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedType === option.type;
        
        return (
          <button
            key={option.type}
            onClick={() => onSelectType(option.type)}
            disabled={disabled}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg bg-muted', option.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
