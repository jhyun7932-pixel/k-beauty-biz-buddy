import React from 'react';
import { Check, FileText, Package, ScrollText } from 'lucide-react';

interface ResultPreviewCardProps {
  summaryReady: boolean;
  documentsReady: boolean;
  packageReady: boolean;
}

export function ResultPreviewCard({ summaryReady, documentsReady, packageReady }: ResultPreviewCardProps) {
  const items = [
    { label: '수출 준비 요약(초안)', ready: summaryReady, icon: FileText },
    { label: 'PI/계약서 초안', ready: documentsReady, icon: ScrollText },
    { label: '바이어 패키지(파일 묶음)', ready: packageReady, icon: Package },
  ];

  return (
    <div className="card-soft p-3 space-y-2">
      <span className="text-xs font-medium text-muted-foreground">오늘 얻는 결과물</span>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div 
              key={i} 
              className={`flex items-center gap-2 text-sm ${item.ready ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {item.ready ? (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-success">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted/50" />
              )}
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
