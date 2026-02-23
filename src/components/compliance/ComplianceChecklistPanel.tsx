import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Shield, Mail, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2, FlaskConical, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RULEPACK_DATA, type ComplianceCheckItem, type CountryRulePack } from '@/data/complianceRulePacks';
import { useComplianceEngine, type ComplianceResult, type ComplianceCheckItem as EngineCheckItem } from '@/hooks/useComplianceEngine';
import { toast } from 'sonner';

interface ComplianceChecklistPanelProps {
  targetCountries: string[];
  inciIngredients?: string[];
  productId?: string;
  onRequestEmail?: (subject: string) => void;
}

// Merged item type combining static rulepack + dynamic INCI analysis
interface MergedCheckItem {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  category: string;
  title: string;
  detail: string;
  actionItem: string;
  actionType?: 'email' | 'doc' | 'manual';
  isDynamic?: boolean; // from DB analysis
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle2, label: 'Pass', emoji: '🟢', className: 'text-green-600' },
  warn: { icon: AlertTriangle, label: 'Warn', emoji: '🟡', className: 'text-yellow-600' },
  fail: { icon: XCircle, label: 'Fail', emoji: '🔴', className: 'text-red-600' },
};

export function ComplianceChecklistPanel({ targetCountries, inciIngredients, productId, onRequestEmail }: ComplianceChecklistPanelProps) {
  const availableCountries = useMemo(() => {
    const rulepackCountries = Object.keys(RULEPACK_DATA);
    const allCountries = [...new Set([...targetCountries, ...rulepackCountries])];
    return allCountries.filter(c => RULEPACK_DATA[c]);
  }, [targetCountries]);

  const [selectedCountry, setSelectedCountry] = useState<string>(availableCountries[0] || 'US');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [runId, setRunId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { results: complianceResults, isLoading: complianceLoading, runCheck } = useComplianceEngine();

  // Run dynamic INCI check when ingredients or country changes
  useEffect(() => {
    if (inciIngredients && inciIngredients.length > 0 && selectedCountry) {
      runCheck(inciIngredients, [selectedCountry]);
    }
  }, [inciIngredients, selectedCountry, runCheck]);

  // Load saved completion state from compliance_runs
  useEffect(() => {
    if (!productId) return;
    const loadSavedState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('compliance_runs')
        .select('run_id, findings')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setRunId(data.run_id);
        const findings = data.findings as any;
        if (findings?.completedItems && Array.isArray(findings.completedItems)) {
          setCompletedItems(new Set(findings.completedItems));
        }
      }
    };
    loadSavedState();
  }, [productId]);

  // Auto-save completed items (debounced)
  const saveCompletedItems = useCallback(async (items: Set<string>) => {
    if (!productId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        product_id: productId,
        target_countries: targetCountries as any,
        traffic_light: items.size > 0 ? 'yellow' : 'green',
        findings: { completedItems: Array.from(items) } as any,
        export_ready_score: 0,
      };
      if (runId) {
        await supabase.from('compliance_runs').update({
          findings: payload.findings,
          target_countries: payload.target_countries,
        }).eq('run_id', runId);
      } else {
        const { data } = await supabase.from('compliance_runs').insert(payload).select('run_id').single();
        if (data) setRunId(data.run_id);
      }
    } catch (err) {
      console.error('Failed to save compliance state:', err);
    } finally {
      setIsSaving(false);
    }
  }, [productId, runId, targetCountries]);

  const rulePack: CountryRulePack | null = RULEPACK_DATA[selectedCountry] || null;

  // Merge static rulepack items with dynamic INCI analysis results
  const mergedItems = useMemo((): MergedCheckItem[] => {
    const staticItems: MergedCheckItem[] = rulePack?.items.map(item => ({
      ...item,
      isDynamic: false,
    })) || [];

    // Find dynamic results for the selected country
    const countryResult = complianceResults.find(r => r.countryCode === selectedCountry);
    if (!countryResult || countryResult.items.length === 0) return staticItems;

    // Convert dynamic items
    const dynamicItems: MergedCheckItem[] = countryResult.items.map((item, idx) => ({
      id: `dyn-${selectedCountry}-${idx}`,
      status: item.light === 'FAIL' ? 'fail' : item.light === 'WARNING' ? 'warn' : 'pass',
      category: item.light === 'FAIL' ? '🧪 금지 성분' : '🧪 제한 성분',
      title: `${item.ingredient} (${item.inci})`,
      detail: item.reason,
      actionItem: item.action,
      actionType: 'email' as const,
      isDynamic: true,
    }));

    // Put dynamic (INCI-based) items first, then static rulepack items
    return [...dynamicItems, ...staticItems];
  }, [rulePack, complianceResults, selectedCountry]);

  const toggleComplete = (id: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      // Debounced auto-save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveCompletedItems(next), 800);
      return next;
    });
  };

  const handleEmailDraft = (item: MergedCheckItem) => {
    if (onRequestEmail) {
      onRequestEmail(`${item.title} 관련 - ${item.actionItem}`);
    }
    toast.success('이메일 초안 생성을 요청했습니다.');
  };

  if (!rulePack) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Shield className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-2">규제 데이터 없음</h3>
        <p className="text-sm text-muted-foreground">
          선택한 국가({selectedCountry})에 대한 규제 데이터가 아직 준비되지 않았습니다.
        </p>
      </div>
    );
  }

  const summary = {
    total: mergedItems.length,
    pass: mergedItems.filter(i => i.status === 'pass').length,
    warn: mergedItems.filter(i => i.status === 'warn').length,
    fail: mergedItems.filter(i => i.status === 'fail').length,
    completed: mergedItems.filter(i => completedItems.has(i.id)).length,
    dynamicCount: mergedItems.filter(i => i.isDynamic).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">규제/인증 체크리스트</h2>
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[160px] h-8 text-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {Object.entries(RULEPACK_DATA).map(([code, pack]) => (
                <SelectItem key={code} value={code}>{pack.countryName} ({code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>기준: <strong className="text-foreground">{rulePack.regulation}</strong></span>
        </div>

        {/* INCI info */}
        {inciIngredients && inciIngredients.length > 0 && (
          <div className="text-xs text-muted-foreground bg-accent/30 rounded px-2 py-1.5 flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-primary shrink-0" />
            <div>
              <span>등록된 INCI 성분: <strong className="text-foreground">{inciIngredients.length}종</strong></span>
              <span className="ml-2 opacity-70">({inciIngredients.slice(0, 5).join(', ')}{inciIngredients.length > 5 ? '...' : ''})</span>
              {complianceLoading && (
                <span className="ml-2 inline-flex items-center gap-1 text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" /> DB 규제 비교 중...
                </span>
              )}
              {summary.dynamicCount > 0 && !complianceLoading && (
                <span className="ml-2 text-destructive font-medium">
                  ⚠ {summary.dynamicCount}건 위반/주의 성분 발견
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary badges */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            🟢 {summary.pass} Pass
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 border-yellow-300 text-yellow-700 dark:text-yellow-400">
            🟡 {summary.warn} Warn
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 border-red-300 text-red-700 dark:text-red-400">
            🔴 {summary.fail} Fail
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            완료: {summary.completed}/{summary.total}
          </span>
        </div>
      </div>

      {/* Checklist Table */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left py-2 px-2 w-[60px]">상태</th>
                <th className="text-left py-2 px-2">진단 항목</th>
                <th className="text-left py-2 px-2 w-[220px]">AI 실행 제안</th>
                <th className="text-center py-2 px-2 w-[50px]">완료</th>
              </tr>
            </thead>
            <tbody>
              {mergedItems.map((item) => {
                const config = STATUS_CONFIG[item.status];
                const isCompleted = completedItems.has(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${isCompleted ? 'opacity-50' : ''} ${item.isDynamic ? 'bg-destructive/5' : ''}`}
                  >
                    {/* Status */}
                    <td className="py-3 px-2">
                      <span className="text-base">{config.emoji}</span>
                    </td>

                    {/* Diagnosis */}
                    <td className="py-3 px-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.isDynamic ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {item.category}
                          </Badge>
                          <span className={`font-medium text-sm ${isCompleted ? 'line-through' : ''}`}>{item.title}</span>
                          {item.isDynamic && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">DB 실시간</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                    </td>

                    {/* Action Item */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{item.actionItem}</span>
                        {item.actionType === 'email' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => handleEmailDraft(item)}
                          >
                            <Mail className="h-3 w-3" />
                            이메일 초안
                          </Button>
                        )}
                        {item.actionType === 'doc' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] gap-1 px-2 border-accent text-accent-foreground hover:bg-accent/50"
                            onClick={() => toast.info('문서 생성 기능 준비 중')}
                          >
                            <FileText className="h-3 w-3" />
                            문서 생성
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* Completed */}
                    <td className="py-3 px-2 text-center">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => toggleComplete(item.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
