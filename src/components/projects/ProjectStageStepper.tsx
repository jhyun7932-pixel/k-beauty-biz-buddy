import React from 'react';
import { Check } from 'lucide-react';
import { PIPELINE_STAGES, type PipelineStage } from '@/stores/projectStore';
import { cn } from '@/lib/utils';

interface ProjectStageStepperProps {
  currentStage: PipelineStage;
  onAdvance: (nextStage: PipelineStage) => void;
}

export function ProjectStageStepper({ currentStage, onAdvance }: ProjectStageStepperProps) {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStage);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < PIPELINE_STAGES.length - 1) {
      onAdvance(PIPELINE_STAGES[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center gap-0.5 w-full">
      {PIPELINE_STAGES.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isNext = i === currentIndex + 1;

        return (
          <div key={stage} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={isNext || isCurrent ? handleClick : undefined}
              disabled={!isNext && !isCurrent}
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all w-full truncate',
                isDone && 'bg-primary/15 text-primary',
                isCurrent && 'bg-primary text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90',
                isNext && 'bg-muted text-muted-foreground cursor-pointer hover:bg-accent',
                !isDone && !isCurrent && !isNext && 'bg-muted/50 text-muted-foreground/50',
              )}
              title={isCurrent ? `클릭하여 다음 단계로 이동` : stage}
            >
              {isDone ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <span className="flex-shrink-0 w-3 h-3 rounded-full border text-[8px] flex items-center justify-center"
                  style={{ borderColor: 'currentColor' }}
                >
                  {i + 1}
                </span>
              )}
              <span className="truncate">{stage}</span>
            </button>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={cn(
                'w-1.5 h-0.5 flex-shrink-0',
                i < currentIndex ? 'bg-primary/40' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
