import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import type { DraftSummary } from '@/types';
import { StatusBanner } from '@/components/ui/StatusBanner';

interface SummaryTabProps {
  summary: DraftSummary | null;
}

export function SummaryTab({ summary }: SummaryTabProps) {
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="p-4 rounded-full bg-muted/20 mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          아직 요약이 없어요
        </h3>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          회사소개서와 제품자료를 올려주세요. AI가 초안을 만들어드릴게요.
        </p>
      </div>
    );
  }

  const signalConfig = {
    ok: { icon: CheckCircle, label: '괜찮음', className: 'signal-ok', textClass: 'text-success' },
    caution: { icon: AlertTriangle, label: '주의', className: 'signal-warning', textClass: 'text-warning' },
    stop: { icon: AlertCircle, label: '잠깐 멈춤', className: 'signal-stop', textClass: 'text-danger' },
  };

  const signal = signalConfig[summary.signal];
  const SignalIcon = signal.icon;

  return (
    <div className="flex flex-col h-full overflow-auto">
      <StatusBanner status="draft" />
      
      <div className="p-6 space-y-6 fade-in-up">
        {/* Title & Signal */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">수출 준비 요약(초안)</h2>
          <div className="flex items-center gap-2">
            <div className={signal.className} />
            <span className={`text-sm font-medium ${signal.textClass}`}>
              상태: {signal.label}
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="card-elevated p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            확인할 것 리스트
          </h3>
          <div className="space-y-2">
            {summary.checklist.map((item) => (
              <label 
                key={item.id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => {}}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <span className={`text-sm ${item.checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.text}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                  {item.category}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Evidence */}
        <div className="card-elevated p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-mint rounded-full" />
            참고/근거(가능한 범위)
          </h3>
          <div className="space-y-3">
            {summary.evidence.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-muted/10 border border-border/50">
                <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                {item.source && (
                  <p className="text-xs text-primary/70 mt-1">출처: {item.source}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Confidence */}
        <div className="card-elevated p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-violet rounded-full" />
            확신도
          </h3>
          <div className="flex items-center gap-2">
            <span className={`
              ${summary.confidence === 'high' ? 'confidence-high' : ''}
              ${summary.confidence === 'medium' ? 'confidence-medium' : ''}
              ${summary.confidence === 'low' ? 'confidence-low' : ''}
            `}>
              {summary.confidence === 'high' ? '높음' : 
               summary.confidence === 'medium' ? '보통' : '낮음'}
            </span>
            <span className="text-xs text-muted-foreground">
              - 제공된 자료 기준으로 분석한 결과입니다
            </span>
          </div>
        </div>

        {/* Hint */}
        <div className="p-3 rounded-lg bg-primary/5 text-center">
          <p className="text-sm text-muted-foreground">
            확인 필요 항목만 정리해도 업무 시간이 크게 줄어요.
          </p>
        </div>
      </div>
    </div>
  );
}
