import React from 'react';
import { Check, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Ingredient } from '@/types';

interface IngredientsEditorProps {
  ingredients: Ingredient[];
  onIngredientUpdate: (id: string, updates: Partial<Ingredient>) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function IngredientsEditor({ 
  ingredients, 
  onIngredientUpdate, 
  onConfirm,
  isProcessing 
}: IngredientsEditorProps) {
  const needsReviewCount = ingredients.filter(i => i.needsReview).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          AI가 읽은 전성분이 맞나요?
        </h3>
        <p className="text-sm text-muted-foreground">
          틀린 부분이 있으면 여기에서 수정해 주세요.
        </p>
      </div>

      {/* Warning */}
      {needsReviewCount > 0 && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">
                확인 필요 표시가 있는 성분은 꼭 다시 확인해 주세요.
              </p>
              <p className="text-xs text-warning/80 mt-1">
                성분이 한 글자만 달라도 결과가 달라질 수 있어요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mx-4 mt-3 p-2 rounded-lg bg-primary/5 text-xs text-muted-foreground">
        ⓘ INCI 표기와 라벨 표기가 다를 수 있어요. 라벨 기준으로 확인해 주세요.
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">성분명</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3 w-24">확신도</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3 w-24">상태</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient, index) => (
                <tr 
                  key={ingredient.id} 
                  className={`border-t border-border ${ingredient.needsReview ? 'bg-warning/5' : ''}`}
                >
                  <td className="p-3">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => onIngredientUpdate(ingredient.id, { name: e.target.value, confirmed: true })}
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none focus:bg-muted/20 rounded px-2 py-1 -ml-2"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <span className={`
                      ${ingredient.confidence === 'high' ? 'confidence-high' : ''}
                      ${ingredient.confidence === 'medium' ? 'confidence-medium' : ''}
                      ${ingredient.confidence === 'low' ? 'confidence-low' : ''}
                    `}>
                      {ingredient.confidence === 'high' ? '높음' : 
                       ingredient.confidence === 'medium' ? '보통' : '낮음'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {ingredient.needsReview ? (
                      <span className="badge-confirm">확인 필요</span>
                    ) : ingredient.confirmed ? (
                      <span className="badge-complete">확인됨</span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onIngredientUpdate(ingredient.id, { 
                        confirmed: true, 
                        needsReview: false,
                        confidence: 'high'
                      })}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground text-center">
          이 단계는 정확도를 높이기 위한 필수 과정이에요.
        </p>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-border bg-card">
        <Button 
          className="w-full" 
          size="lg"
          onClick={onConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? '처리 중...' : '성분 확인 완료'}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          확인 완료 후에 수출 준비 요약을 만들 수 있어요.
        </p>
      </div>
    </div>
  );
}
