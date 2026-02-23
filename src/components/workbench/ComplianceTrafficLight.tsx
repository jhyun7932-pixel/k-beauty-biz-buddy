import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, 
  ChevronDown, ChevronRight, Loader2, Globe, FileWarning, Tag, FlaskConical,
  Sparkles, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useComplianceEngine, type ComplianceResult, type ComplianceCheckItem, type TrafficLight } from '@/hooks/useComplianceEngine';
import { InciEditorInline } from './InciEditorInline';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { getAlternatives, type AlternativeSuggestion } from '@/lib/compliance/alternativeIngredients';
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', JP: '🇯🇵', EU: '🇪🇺', HK: '🇭🇰', TW: '🇹🇼',
  CN: '🇨🇳', VN: '🇻🇳', ID: '🇮🇩', MY: '🇲🇾', TH: '🇹🇭', AU: '🇦🇺',
};

function TrafficLightIcon({ light, size = 'md' }: { light: TrafficLight; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8' };
  const s = sizeMap[size];
  switch (light) {
    case 'FAIL': return <XCircle className={cn(s, 'text-red-500')} />;
    case 'WARNING': return <AlertTriangle className={cn(s, 'text-amber-500')} />;
    case 'PASS': return <CheckCircle2 className={cn(s, 'text-green-500')} />;
  }
}

function TrafficLightBadge({ light }: { light: TrafficLight }) {
  const config = {
    FAIL: { label: '수출 불가', className: 'bg-red-100 text-red-800 border-red-200' },
    WARNING: { label: '주의 필요', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    PASS: { label: '수출 가능', className: 'bg-green-100 text-green-800 border-green-200' },
  }[light];
  return <Badge variant="outline" className={cn('gap-1', config.className)}><TrafficLightIcon light={light} size="sm" />{config.label}</Badge>;
}

function CheckItem({ item, onClickIngredient }: { item: ComplianceCheckItem; onClickIngredient?: (inci: string) => void }) {
  const [showAlts, setShowAlts] = useState(false);
  const alternatives = useMemo(() => getAlternatives(item.inci), [item.inci]);
  const isClickable = item.light === 'FAIL' && onClickIngredient;

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border transition-all',
      item.light === 'FAIL' && 'bg-red-50 border-red-200',
      item.light === 'WARNING' && 'bg-amber-50 border-amber-200',
      isClickable && 'cursor-pointer hover:ring-2 hover:ring-red-300',
    )}
      onClick={() => { if (isClickable) onClickIngredient(item.inci); }}
    >
      <TrafficLightIcon light={item.light} size="sm" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-semibold text-sm', item.light === 'FAIL' ? 'text-red-700' : 'text-amber-700')}>
            {item.ingredient}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">{item.inci}</Badge>
          {isClickable && <Badge variant="outline" className="text-[10px] text-red-500 border-red-300 gap-0.5"><ArrowRight className="h-2.5 w-2.5" />클릭하여 편집</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{item.reason}</p>
        <div className={cn(
          'text-xs font-medium mt-1 p-2 rounded',
          item.light === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
        )}>
          🔧 {item.action}
        </div>

        {/* AI Alternative Suggestions */}
        {alternatives.length > 0 && (
          <div className="mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAlts(!showAlts); }}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
            >
              <Sparkles className="h-3 w-3" />
              {showAlts ? '대체 성분 숨기기' : `AI 추천 대체 성분 (${alternatives.length}개)`}
            </button>
            {showAlts && (
              <div className="mt-1.5 space-y-1.5">
                {alternatives.map((alt, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-blue-50 border border-blue-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-blue-800">{alt.name}</span>
                        <Badge variant="outline" className="text-[9px] font-mono border-blue-300">{alt.inci}</Badge>
                      </div>
                      <p className="text-[10px] text-blue-700 mt-0.5">{alt.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CountryResultCard({ result, onClickIngredient }: { result: ComplianceResult; onClickIngredient?: (inci: string) => void }) {
  const [isOpen, setIsOpen] = useState(result.overallLight !== 'PASS');
  const flag = COUNTRY_FLAGS[result.countryCode] || '🌐';
  const failCount = result.items.filter(i => i.light === 'FAIL').length;
  const warnCount = result.items.filter(i => i.light === 'WARNING').length;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{flag}</span>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{result.countryName}</span>
                  <span className="text-xs text-muted-foreground">({result.countryCode})</span>
                </div>
                {result.regulatoryBody && (
                  <p className="text-xs text-muted-foreground">{result.regulatoryBody} · {result.keyRegulation}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {failCount > 0 && <Badge variant="destructive" className="text-[10px]">FAIL {failCount}</Badge>}
              {warnCount > 0 && <Badge className="text-[10px] bg-amber-500">WARN {warnCount}</Badge>}
              <TrafficLightBadge light={result.overallLight} />
              {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {result.items.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">성분 체크 결과</p>
                {result.items.map((item, idx) => <CheckItem key={idx} item={item} onClickIngredient={onClickIngredient} />)}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">모든 성분이 해당 국가의 규제를 통과했습니다.</span>
              </div>
            )}
            
            {/* Label Requirements */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">라벨 요건</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{result.labelRequirements}</p>
            </div>

            {result.notes && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <FileWarning className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">참고</span>
                </div>
                <p className="text-xs text-blue-700">{result.notes}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function ComplianceTrafficLight() {
  const { results, isLoading, error, runCheck } = useComplianceEngine();
  const { project, productProfile } = useAppStore();
  const [showEditor, setShowEditor] = useState(false);
  const [focusedIngredient, setFocusedIngredient] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // When a FAIL item is clicked, open editor and highlight the ingredient
  const handleClickIngredient = useCallback((inci: string) => {
    setFocusedIngredient(inci.toUpperCase());
    setShowEditor(true);
  }, []);

  const ingredients = productProfile.inciIngredients.map(i => i.inci);
  const countries = project.targetCountries;

  const handleRunCheck = useCallback(() => {
    if (countries.length === 0) return;
    const checkIngredients = ingredients.length > 0 ? ingredients : [
      'WATER', 'GLYCERIN', 'NIACINAMIDE', 'RETINOL', 'SALICYLIC ACID',
      'BUTYLENE GLYCOL', 'HYALURONIC ACID', 'TOCOPHEROL',
    ];
    runCheck(checkIngredients, countries);
  }, [countries, ingredients, runCheck]);

  // Auto-run on mount
  useEffect(() => {
    if (countries.length > 0 && results.length === 0 && !isLoading) {
      handleRunCheck();
    }
  }, [countries.length]);

  // Re-run on ingredient changes (debounced)
  const handleIngredientsChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (countries.length > 0) handleRunCheck();
    }, 800);
  }, [countries, handleRunCheck]);

  // Collect highlighted (problematic) ingredients from results
  const highlightedIngredients = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => r.items.forEach(i => set.add(i.inci.toUpperCase())));
    return set;
  }, [results]);

  const overallSummary = useMemo(() => {
    if (results.length === 0) return null;
    const fails = results.filter(r => r.overallLight === 'FAIL').length;
    const warns = results.filter(r => r.overallLight === 'WARNING').length;
    const passes = results.filter(r => r.overallLight === 'PASS').length;
    return { fails, warns, passes };
  }, [results]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">규제 진단 (Traffic Light)</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={showEditor ? 'default' : 'outline'} onClick={() => setShowEditor(!showEditor)} className="text-xs h-7 gap-1">
              <FlaskConical className="h-3 w-3" />
              {showEditor ? '성분 닫기' : '성분 편집'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleRunCheck} disabled={isLoading || countries.length === 0} className="h-7">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Globe className="h-3.5 w-3.5 mr-1.5" />}
              {isLoading ? '분석 중...' : '재검사'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        {overallSummary && (
          <div className="flex gap-2">
            {overallSummary.fails > 0 && (
              <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> FAIL {overallSummary.fails}개국</Badge>
            )}
            {overallSummary.warns > 0 && (
              <Badge className="gap-1 bg-amber-500"><AlertTriangle className="h-3 w-3" /> WARNING {overallSummary.warns}개국</Badge>
            )}
            {overallSummary.passes > 0 && (
              <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> PASS {overallSummary.passes}개국</Badge>
            )}
          </div>
        )}
      </div>

      {/* INCI Editor (collapsible) */}
      {showEditor && (
        <div className="p-4 border-b bg-muted/30 flex-shrink-0">
          <InciEditorInline
            onIngredientsChange={handleIngredientsChange}
            highlightedIngredients={highlightedIngredients}
            focusedIngredient={focusedIngredient}
            onFocusHandled={() => setFocusedIngredient(null)}
          />
        </div>
      )}

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {countries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">타겟 국가를 설정하면 규제 진단을 실행합니다.</p>
              <p className="text-xs mt-1">채팅에서 "이 제품 미국에 팔 수 있어?"라고 물어보세요.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">{countries.length}개국 규제 DB 대조 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <XCircle className="h-8 w-8 mx-auto mb-3" />
              <p className="text-sm">{error}</p>
            </div>
          ) : results.length > 0 ? (
            results.map(result => <CountryResultCard key={result.countryCode} result={result} onClickIngredient={handleClickIngredient} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">"재검사" 버튼을 눌러 규제 진단을 시작하세요.</p>
            </div>
          )}

          {/* Ingredient summary (when editor is closed) */}
          {!showEditor && ingredients.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border mt-4">
              <p className="text-xs font-medium mb-1.5">분석 대상 성분 ({ingredients.length}개)</p>
              <div className="flex flex-wrap gap-1">
                {ingredients.slice(0, 20).map((ing, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      'text-[10px] font-mono',
                      highlightedIngredients.has(ing.toUpperCase()) && 'border-red-300 bg-red-50 text-red-700'
                    )}
                  >
                    {ing}
                  </Badge>
                ))}
                {ingredients.length > 20 && <Badge variant="outline" className="text-[10px]">+{ingredients.length - 20}개</Badge>}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
