import React from 'react';
import { Package, FlaskConical, FileText, Mail, Receipt, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
}

interface QuickActionChipsProps {
  onAction: (actionId: string) => void;
  disabled?: boolean;
}

const quickActions: QuickAction[] = [
  { id: 'first_proposal', label: '첫 제안 패키지', icon: <Package className="h-3.5 w-3.5" />, variant: 'default' },
  { id: 'sample_package', label: '샘플 패키지', icon: <Send className="h-3.5 w-3.5" />, variant: 'outline' },
  { id: 'main_order', label: '본오더 패키지', icon: <Receipt className="h-3.5 w-3.5" />, variant: 'outline' },
  { id: 'compliance_check', label: '규제·라벨 체크', icon: <FlaskConical className="h-3.5 w-3.5" />, variant: 'secondary' },
  { id: 'create_pi', label: 'PI 만들기', icon: <FileText className="h-3.5 w-3.5" />, variant: 'secondary' },
  { id: 'followup_email', label: '후속 메일', icon: <Mail className="h-3.5 w-3.5" />, variant: 'secondary' },
];

export function QuickActionChips({ onAction, disabled }: QuickActionChipsProps) {
  return (
    <div className="p-3 border-b border-border bg-background/50">
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant as any}
            size="sm"
            className={cn(
              "h-8 px-3 text-xs font-medium gap-1.5",
              action.variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => onAction(action.id)}
            disabled={disabled}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
