import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Package, FlaskConical, Ship } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { 
    id: 'attach', 
    label: '파일 첨부', 
    icon: <Paperclip className="h-3.5 w-3.5" />, 
    prompt: '' 
  },
  { 
    id: 'first_proposal', 
    label: '첫 제안 패키지', 
    icon: <Package className="h-3.5 w-3.5" />,
    prompt: '첫 제안 패키지를 시작할게요'
  },
  { 
    id: 'sample', 
    label: '샘플 발송', 
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    prompt: '샘플 발송 서류를 준비할게요'
  },
  { 
    id: 'bulk', 
    label: '본 오더(PO)', 
    icon: <Ship className="h-3.5 w-3.5" />,
    prompt: '본오더 패키지를 준비할게요'
  },
];

interface QuickActionBarProps {
  onAction: (actionId: string, prompt: string) => void;
  className?: string;
}

export function QuickActionBar({ onAction, className }: QuickActionBarProps) {
  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {QUICK_ACTIONS.map((action) => (
        <Button
          key={action.id}
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-7 px-2.5 text-xs gap-1.5 rounded-full",
            "border-border/60 text-muted-foreground",
            "hover:text-foreground hover:bg-primary/5 hover:border-primary/30",
            "transition-all duration-200"
          )}
          onClick={() => onAction(action.id, action.prompt)}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
