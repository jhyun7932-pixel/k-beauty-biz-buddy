import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, FlaskConical, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/stores/appStore';
import type { INCIIngredient } from '@/stores/types';
import { cn } from '@/lib/utils';

interface InciEditorInlineProps {
  onIngredientsChange?: (ingredients: INCIIngredient[]) => void;
  highlightedIngredients?: Set<string>;
  focusedIngredient?: string | null;
  onFocusHandled?: () => void;
}

export function InciEditorInline({ onIngredientsChange, highlightedIngredients, focusedIngredient, onFocusHandled }: InciEditorInlineProps) {
  const { productProfile, setProductProfile } = useAppStore();
  const ingredients = productProfile.inciIngredients;
  const [newInci, setNewInci] = useState('');
  const [filter, setFilter] = useState('');
  const focusRef = useRef<HTMLDivElement>(null);

  // Scroll to focused ingredient
  useEffect(() => {
    if (focusedIngredient && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash animation via timeout
      const timer = setTimeout(() => onFocusHandled?.(), 3000);
      return () => clearTimeout(timer);
    }
  }, [focusedIngredient, onFocusHandled]);

  const updateIngredients = useCallback((updated: INCIIngredient[]) => {
    setProductProfile({ inciIngredients: updated });
    onIngredientsChange?.(updated);
  }, [setProductProfile, onIngredientsChange]);

  const addIngredient = () => {
    const trimmed = newInci.trim().toUpperCase();
    if (!trimmed) return;
    if (ingredients.some(i => i.inci.toUpperCase() === trimmed)) return;
    const updated = [...ingredients, { inci: trimmed, orderOrPercent: '', note: '' }];
    updateIngredients(updated);
    setNewInci('');
  };

  const removeIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    updateIngredients(updated);
  };

  const updateIngredient = (index: number, field: keyof INCIIngredient, value: string) => {
    const updated = ingredients.map((ing, i) => i === index ? { ...ing, [field]: value } : ing);
    updateIngredients(updated);
  };

  const addBulk = (text: string) => {
    const names = text.split(/[,;\n]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    const existing = new Set(ingredients.map(i => i.inci.toUpperCase()));
    const newOnes = names.filter(n => !existing.has(n)).map(n => ({ inci: n, orderOrPercent: '', note: '' }));
    if (newOnes.length > 0) updateIngredients([...ingredients, ...newOnes]);
  };

  const loadSampleData = () => {
    const sample: INCIIngredient[] = [
      { inci: 'WATER', orderOrPercent: '1', note: '' },
      { inci: 'GLYCERIN', orderOrPercent: '2', note: '' },
      { inci: 'NIACINAMIDE', orderOrPercent: '3', note: '' },
      { inci: 'BUTYLENE GLYCOL', orderOrPercent: '4', note: '' },
      { inci: 'RETINOL', orderOrPercent: '5', note: '함량 주의' },
      { inci: 'SALICYLIC ACID', orderOrPercent: '6', note: '함량 주의' },
      { inci: 'HYALURONIC ACID', orderOrPercent: '7', note: '' },
      { inci: 'TOCOPHEROL', orderOrPercent: '8', note: '' },
      { inci: 'CENTELLA ASIATICA EXTRACT', orderOrPercent: '9', note: '' },
      { inci: 'PANTHENOL', orderOrPercent: '10', note: '' },
    ];
    updateIngredients(sample);
  };

  const filtered = filter
    ? ingredients.filter(i => i.inci.toLowerCase().includes(filter.toLowerCase()))
    : ingredients;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">제품 전성분 (INCI)</span>
          <Badge variant="secondary" className="text-[10px]">{ingredients.length}개</Badge>
        </div>
        {ingredients.length === 0 && (
          <Button size="sm" variant="ghost" onClick={loadSampleData} className="text-xs h-7">
            샘플 데이터 로드
          </Button>
        )}
      </div>

      {/* Add ingredient */}
      <div className="flex gap-2">
        <Input
          value={newInci}
          onChange={e => setNewInci(e.target.value)}
          placeholder="성분명 입력 (예: RETINOL)"
          className="text-xs h-8"
          onKeyDown={e => e.key === 'Enter' && addIngredient()}
        />
        <Button size="sm" className="h-8 gap-1 px-3" onClick={addIngredient}>
          <Plus className="h-3 w-3" /> 추가
        </Button>
      </div>

      {/* Bulk paste hint */}
      <p className="text-[10px] text-muted-foreground">
        💡 쉼표로 구분하여 여러 성분을 한번에 입력할 수 있습니다.
        <button
          className="ml-1 underline hover:text-foreground"
          onClick={() => {
            const text = prompt('성분 목록을 붙여넣기 하세요 (쉼표 또는 줄바꿈 구분):');
            if (text) addBulk(text);
          }}
        >일괄 입력</button>
      </p>

      {/* Search filter (when many ingredients) */}
      {ingredients.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="성분 검색..."
            className="text-xs h-7 pl-7"
          />
        </div>
      )}

      {/* Ingredient list */}
      <ScrollArea className="max-h-[280px]">
        <div className="space-y-1">
          {filtered.map((ing, idx) => {
            const realIdx = ingredients.indexOf(ing);
            const isHighlighted = highlightedIngredients?.has(ing.inci.toUpperCase());
            const isFocused = focusedIngredient === ing.inci.toUpperCase();
            return (
              <div
                key={`${ing.inci}-${realIdx}`}
                ref={isFocused ? focusRef : undefined}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md group transition-all',
                  isHighlighted ? 'bg-red-50 border border-red-200' : 'hover:bg-muted/50',
                  isFocused && 'ring-2 ring-red-400 animate-pulse bg-red-100 border-red-300'
                )}
              >
                <span className="text-[10px] text-muted-foreground w-5 text-right">{realIdx + 1}</span>
                {isHighlighted ? (
                  <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 opacity-50" />
                )}
                <input
                  value={ing.inci}
                  onChange={e => updateIngredient(realIdx, 'inci', e.target.value.toUpperCase())}
                  className={cn(
                    'flex-1 bg-transparent text-xs font-mono focus:outline-none focus:bg-muted/30 rounded px-1 py-0.5',
                    isHighlighted && 'text-red-700 font-semibold'
                  )}
                />
                <button
                  onClick={() => removeIngredient(realIdx)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
