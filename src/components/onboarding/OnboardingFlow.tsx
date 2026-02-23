import React, { useState } from 'react';
import { Sparkles, ArrowRight, Upload, FileCheck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { IngredientsEditor } from '@/components/ingredients/IngredientsEditor';
import { GoalBar } from '@/components/goal/GoalBar';
import { ResultPreviewCard } from '@/components/ui/ResultPreviewCard';
import type { Step, Product, BuyerGoal } from '@/types';

interface OnboardingFlowProps {
  currentStep: Step;
  products: Product[];
  buyerGoal: BuyerGoal | null;
  onSampleClick: () => void;
  onUploadComplete: () => void;
  onGoalChange: (goal: BuyerGoal) => void;
  onGoalComplete: () => void;
  onIngredientUpdate: (productId: string, ingredientId: string, updates: any) => void;
  onConfirmIngredients: () => void;
  isProcessing: boolean;
  summaryReady: boolean;
  documentsReady: boolean;
  packageReady: boolean;
}

export function OnboardingFlow({
  currentStep,
  products,
  buyerGoal,
  onSampleClick,
  onUploadComplete,
  onGoalChange,
  onGoalComplete,
  onIngredientUpdate,
  onConfirmIngredients,
  isProcessing,
  summaryReady,
  documentsReady,
  packageReady,
}: OnboardingFlowProps) {
  const [companyFiles, setCompanyFiles] = useState<File[]>([]);
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [goalCompleted, setGoalCompleted] = useState(false);

  const allFilesUploaded = companyFiles.length > 0 && productFiles.length > 0;
  
  const isGoalComplete = 
    buyerGoal &&
    buyerGoal.countries.length > 0 && 
    buyerGoal.channel !== null && 
    buyerGoal.buyerType !== null;

  const handleGoalComplete = () => {
    setGoalCompleted(true);
    onGoalComplete();
  };

  // Upload Step
  if (currentStep === 'upload') {
    return (
      <div className="flex flex-col h-full overflow-auto">
        {/* Hero */}
        <div className="p-6 text-center border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            보낼 나라/채널만 고르면, 바이어에게 보낼 패키지 완성.
          </h1>
          <p className="text-sm text-muted-foreground">
            초안 만들기 → 대화로 수정 → 실수 체크 후 최종 출력
          </p>
        </div>

        {/* Goal Bar (필수) */}
        <GoalBar 
          goal={buyerGoal}
          onGoalChange={onGoalChange}
          onGoalComplete={handleGoalComplete}
        />

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Sample CTA */}
          <div className="card-soft p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">샘플로 먼저 체험해볼까요?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                실제 데이터 없이도 전체 플로우를 경험할 수 있어요
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onSampleClick} className="gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              샘플 체험
            </Button>
          </div>

          {/* Upload Zones */}
          <FileUploadZone 
            type="company" 
            onFilesUploaded={(files) => setCompanyFiles(files)} 
          />
          
          <FileUploadZone 
            type="product" 
            onFilesUploaded={(files) => setProductFiles(files)} 
          />

          {/* Tip */}
          <p className="text-xs text-muted-foreground text-center">
            ⓘ 처음엔 '간편 체크'로 시작해도 좋아요.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="p-4 border-t border-border bg-card">
          <Button 
            className="w-full gap-2" 
            size="lg"
            disabled={!allFilesUploaded || !isGoalComplete}
          >
            {!isGoalComplete ? (
              '먼저 목표(국가/채널/바이어타입)를 설정해주세요'
            ) : !allFilesUploaded ? (
              '업로드가 끝나면 바로 초안을 만들게요.'
            ) : (
              <>
                다음 단계로 <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Ingredients Step
  if (currentStep === 'ingredients' && products.length > 0) {
    const product = products[0];
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <ResultPreviewCard 
            summaryReady={summaryReady}
            documentsReady={documentsReady}
            packageReady={packageReady}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <IngredientsEditor
            ingredients={product.ingredientsConfirmed}
            onIngredientUpdate={(ingredientId, updates) => 
              onIngredientUpdate(product.id, ingredientId, updates)
            }
            onConfirm={onConfirmIngredients}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    );
  }

  // Other steps - show result preview and chat
  return (
    <div className="flex flex-col h-full p-4">
      <ResultPreviewCard 
        summaryReady={summaryReady}
        documentsReady={documentsReady}
        packageReady={packageReady}
      />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="p-4 rounded-full bg-success/10 mb-4 inline-block">
            <FileCheck className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            초안 준비 완료!
          </h3>
          <p className="text-sm text-muted-foreground">
            우측 탭에서 결과물을 확인하세요.<br />
            채팅으로 수정 요청도 할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
