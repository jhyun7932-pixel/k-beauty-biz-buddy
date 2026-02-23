import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Lock,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  runCrossCheckGate, 
  GateResult, 
  GateCheckResult,
  getGateStatusColor,
  getGateSeverityColor
} from '@/lib/crosscheck/gateEngine';
import type { DocumentInstance } from '@/stores/projectStore';
import { cn } from '@/lib/utils';

interface CrossCheckGatePanelProps {
  documents: DocumentInstance[];
  onFinalize?: () => void;
  onFixItem?: (checkId: string) => void;
  className?: string;
}

export function CrossCheckGatePanel({
  documents,
  onFinalize,
  onFixItem,
  className = '',
}: CrossCheckGatePanelProps) {
  const [gateResult, setGateResult] = React.useState<GateResult | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);

  const runGate = React.useCallback(() => {
    setIsChecking(true);
    // Simulate async check
    setTimeout(() => {
      const result = runCrossCheckGate(documents);
      setGateResult(result);
      setIsChecking(false);
    }, 500);
  }, [documents]);

  // Auto-run on mount and when documents change
  React.useEffect(() => {
    runGate();
  }, [runGate]);

  const progressPercent = gateResult 
    ? Math.round((gateResult.passedChecks / gateResult.requiredChecks) * 100) 
    : 0;

  const highFailCount = gateResult?.results.filter(r => r.severity === 'HIGH' && r.status === 'FAIL').length || 0;
  const medFailCount = gateResult?.results.filter(r => r.severity === 'MED' && r.status === 'FAIL').length || 0;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Cross-check Gate</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runGate}
            disabled={isChecking}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isChecking && "animate-spin")} />
            재검사
          </Button>
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">통과율</span>
            <span className="font-medium">
              {gateResult?.passedChecks || 0}/{gateResult?.requiredChecks || 10}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Status Summary */}
        {gateResult && (
          <div className="mt-3 flex gap-2">
            {highFailCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                HIGH 실패 {highFailCount}개
              </Badge>
            )}
            {medFailCount > 0 && (
              <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                MED 실패 {medFailCount}개
              </Badge>
            )}
            {gateResult.passed && (
              <Badge className="gap-1 bg-green-600">
                <CheckCircle2 className="h-3 w-3" />
                통과
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Check Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {gateResult?.results.map((check) => (
            <GateCheckCard 
              key={check.id} 
              check={check} 
              onFix={() => onFixItem?.(check.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer - Finalize Button */}
      <div className="p-4 border-t bg-muted/30 flex-shrink-0">
        {gateResult?.passed ? (
          <Button 
            onClick={onFinalize} 
            className="w-full gap-2"
            size="lg"
          >
            <Lock className="h-4 w-4" />
            최종 확정 (LOCK)
          </Button>
        ) : (
          <div className="text-center">
            <Button 
              disabled 
              className="w-full gap-2 mb-2"
              size="lg"
            >
              <Lock className="h-4 w-4" />
              최종 확정
            </Button>
            <p className="text-xs text-muted-foreground">
              최종 확정 전, Cross-check Gate(10개)를 통과해야 해요. 
              (지금 {gateResult?.passedChecks || 0}/{gateResult?.requiredChecks || 10})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GateCheckCard({ 
  check, 
  onFix 
}: { 
  check: GateCheckResult; 
  onFix: () => void;
}) {
  const statusIcon = {
    PASS: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    FAIL: <XCircle className="h-4 w-4 text-red-600" />,
    NEED_USER_CONFIRM: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  }[check.status];

  return (
    <Card className={cn(
      "border transition-all",
      check.status === 'FAIL' && "border-red-200 bg-red-50/50",
      check.status === 'NEED_USER_CONFIRM' && "border-amber-200 bg-amber-50/50",
      check.status === 'PASS' && "border-green-200 bg-green-50/50"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {statusIcon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{check.id}</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] px-1.5", getGateSeverityColor(check.severity))}
                >
                  {check.severity}
                </Badge>
              </div>
              <p className="text-sm mt-0.5">{check.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{check.rule}</p>
              {check.details && (
                <p className={cn(
                  "text-xs mt-1 font-medium",
                  check.status === 'FAIL' && "text-red-600",
                  check.status === 'NEED_USER_CONFIRM' && "text-amber-600"
                )}>
                  {check.details}
                </p>
              )}
            </div>
          </div>
          
          {check.status !== 'PASS' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onFix}
              className="flex-shrink-0 gap-1 text-xs h-7"
            >
              {check.fixActionLabel}
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
