import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Brain, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIPrecisionMeterProps {
  score: number;
  className?: string;
}

const LEVELS = [
  { min: 0, max: 29, label: '기초', color: 'text-danger' },
  { min: 30, max: 49, label: '제한적', color: 'text-warning' },
  { min: 50, max: 69, label: '양호', color: 'text-primary' },
  { min: 70, max: 99, label: '정밀', color: 'text-success' },
  { min: 100, max: 100, label: '최적', color: 'text-success' },
];

export function AIPrecisionMeter({ score, className }: AIPrecisionMeterProps) {
  const level = LEVELS.find(l => score >= l.min && score <= l.max) ?? LEVELS[0];
  const isLow = score < 50;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI 정밀도</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-lg font-bold tabular-nums', level.color)}>
            {score}%
          </span>
          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full', level.color, 
            isLow ? 'bg-warning/10' : 'bg-success/10'
          )}>
            {level.label}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress value={score} className="h-3 bg-secondary" />
        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {[30, 50, 70].map(mark => (
            <div
              key={mark}
              className="absolute h-3 w-px bg-foreground/20"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
      </div>

      {/* Breakdown chips */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: '회원가입', pts: 10, done: score >= 10 },
          { label: '회사정보', pts: 20, done: score >= 30 },
          { label: '제품데이터', pts: 40, done: score >= 70 },
          { label: '상세설정', pts: 30, done: score >= 100 },
        ].map(item => (
          <span
            key={item.label}
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border transition-colors',
              item.done
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-muted/10 text-muted-foreground border-border'
            )}
          >
            {item.done ? '✓' : '○'} {item.label} +{item.pts}%
          </span>
        ))}
      </div>

      {/* Warning */}
      {isLow && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">AI의 분석 능력이 제한됩니다</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              더 많은 정보를 입력하면 AI가 정교한 맞춤형 문서를 생성할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {score >= 70 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
          <Sparkles className="h-4 w-4 text-success mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">
            AI가 높은 정밀도로 분석할 준비가 되었습니다!
          </p>
        </div>
      )}
    </div>
  );
}
