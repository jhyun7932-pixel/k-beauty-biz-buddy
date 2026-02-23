import React from 'react';
import { 
  ArrowRight, 
  FileText, 
  AlertTriangle, 
  CheckSquare,
  ExternalLink,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Action Card
interface ActionCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  priority?: 'high' | 'medium' | 'low';
}

export function ActionCard({ title, description, actionLabel, onAction, priority = 'medium' }: ActionCardProps) {
  return (
    <Card className={cn(
      "border-l-4",
      priority === 'high' && "border-l-primary",
      priority === 'medium' && "border-l-blue-400",
      priority === 'low' && "border-l-muted"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <h4 className="text-sm font-medium truncate">{title}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button size="sm" className="shrink-0 h-7 text-xs" onClick={onAction}>
            {actionLabel}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Document Card
interface DocCardProps {
  title: string;
  type: string;
  version: number;
  status: 'draft' | 'edited' | 'final';
  pageCount?: number;
  onView: () => void;
  onEdit?: () => void;
}

export function DocCard({ title, type, version, status, pageCount, onView, onEdit }: DocCardProps) {
  const statusColors = {
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    edited: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    final: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium truncate">{title}</h4>
              <Badge variant="outline" className="text-[10px] h-4 px-1">v{version}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{type}</span>
              {pageCount && (
                <span className="text-xs text-muted-foreground">• {pageCount}p</span>
              )}
              <Badge className={cn("text-[10px] h-4 px-1.5", statusColors[status])}>
                {status === 'draft' ? '초안' : status === 'edited' ? '편집됨' : '최종'}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onEdit}>
                편집
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={onView}>
              보기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Risk Card
interface RiskCardProps {
  title: string;
  risks: { id: string; text: string; severity: 'high' | 'medium' | 'low' }[];
  onResolve?: (riskId: string) => void;
}

export function RiskCard({ title, risks, onResolve }: RiskCardProps) {
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ul className="space-y-1.5">
          {risks.map((risk) => (
            <li key={risk.id} className="flex items-start gap-2">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                risk.severity === 'high' && "bg-red-500",
                risk.severity === 'medium' && "bg-amber-500",
                risk.severity === 'low' && "bg-blue-400"
              )} />
              <span className="text-xs text-foreground flex-1">{risk.text}</span>
              {onResolve && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 px-1.5 text-[10px]"
                  onClick={() => onResolve(risk.id)}
                >
                  해결
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Checklist Card
interface ChecklistCardProps {
  title: string;
  items: { id: string; text: string; completed: boolean }[];
  onToggle: (itemId: string) => void;
}

export function ChecklistCard({ title, items, onToggle }: ChecklistCardProps) {
  const completedCount = items.filter(i => i.completed).length;
  
  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            {title}
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {completedCount}/{items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li 
              key={item.id} 
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1"
              onClick={() => onToggle(item.id)}
            >
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                item.completed ? "bg-primary border-primary" : "border-muted-foreground/30"
              )}>
                {item.completed && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={cn(
                "text-xs flex-1",
                item.completed && "text-muted-foreground line-through"
              )}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
