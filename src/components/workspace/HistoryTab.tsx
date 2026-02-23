import React from 'react';
import { History, RotateCcw, FileText, Package, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HistoryEntry } from '@/types';

interface HistoryTabProps {
  history: HistoryEntry[];
}

export function HistoryTab({ history }: HistoryTabProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="p-4 rounded-full bg-muted/20 mb-4">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          오늘 만든 문서는 기록 탭에서 다시 볼 수 있어요.
        </h3>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          작업을 시작하면 여기에 기록이 쌓입니다.
        </p>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">기록</h2>
        <p className="text-sm text-muted-foreground">이전 버전으로 되돌릴 수 있어요</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {history.map((entry, index) => (
          <div 
            key={entry.id}
            className="card-elevated p-4 flex items-center gap-4 hover:shadow-elevated transition-shadow"
          >
            <div className="p-2 rounded-lg bg-muted/20">
              {entry.action.includes('패키지') ? (
                <Package className="h-4 w-4 text-muted-foreground" />
              ) : entry.action.includes('서류') || entry.action.includes('PI') ? (
                <ScrollText className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{entry.action}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                </span>
                {entry.goalBadge && (
                  <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    {entry.goalBadge}
                  </span>
                )}
              </div>
            </div>

            <span className={`
              ${entry.status === 'draft' ? 'badge-draft' : ''}
              ${entry.status === 'confirmed' ? 'badge-confirm' : ''}
              ${entry.status === 'complete' ? 'badge-complete' : ''}
            `}>
              {entry.status === 'draft' ? '초안' : 
               entry.status === 'confirmed' ? '확인됨' : '완성'}
            </span>

            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <RotateCcw className="h-3 w-3" />
              복원
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
