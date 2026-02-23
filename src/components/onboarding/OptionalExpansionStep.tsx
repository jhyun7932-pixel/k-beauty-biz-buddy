import React from 'react';
import { Upload, Users, Languages, DollarSign, Settings, Check, FileText, ImageIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import type { 
  OnboardingContext, 
  OnboardingBuyerType 
} from '@/types/onboarding';
import { ONBOARDING_BUYER_TYPES } from '@/types/onboarding';

interface OptionalExpansionStepProps {
  context: OnboardingContext;
  onUpdateContext: (updates: Partial<OnboardingContext>) => void;
  onComplete: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

const LANGUAGES = [
  { value: 'en', label: '영어' },
  { value: 'ja', label: '일본어' },
  { value: 'zh', label: '중국어' },
  { value: 'de', label: '독일어' },
  { value: 'ko', label: '한국어' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'HKD', label: 'HKD ($)' },
  { value: 'KRW', label: 'KRW (₩)' },
];

const INCOTERMS = ['FOB', 'CIF', 'DDP', 'EXW', 'CFR'];
const PAYMENT_TERMS = ['T/T 30/70', 'T/T 50/50', 'T/T 100% 선금', 'L/C at sight', 'D/P'];

export function OptionalExpansionStep({
  context,
  onUpdateContext,
  onComplete,
  onSkip,
  isLoading,
}: OptionalExpansionStepProps) {
  const [companyFiles, setCompanyFiles] = React.useState<File[]>([]);
  const [productFiles, setProductFiles] = React.useState<File[]>([]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">선택 확장</h2>
            <p className="text-xs text-muted-foreground">더 정확한 문서를 원하면 추가 정보를 입력하세요</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onSkip} disabled={isLoading}>
            건너뛰기
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-auto">
        {/* 바이어 유형 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            바이어 유형
          </Label>
          <Select
            value={context.buyerType}
            onValueChange={(value) => onUpdateContext({ buyerType: value as OnboardingBuyerType })}
            disabled={isLoading}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {ONBOARDING_BUYER_TYPES.map((bt) => (
                <SelectItem key={bt.value} value={bt.value}>
                  {bt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 언어 & 통화 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              언어
            </Label>
            <Select
              value={context.language}
              onValueChange={(value) => onUpdateContext({ language: value })}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              통화
            </Label>
            <Select
              value={context.currency}
              onValueChange={(value) => onUpdateContext({ currency: value })}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 업로드 영역 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Upload className="h-4 w-4 text-primary" />
            자료 업로드 (선택)
          </div>
          
          <p className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg">
            💡 자료를 올리면 AI가 문서 자동 채움/리스크 체크까지 더 정확해집니다.
          </p>

          <FileUploadZone 
            type="company" 
            onFilesUploaded={(files) => setCompanyFiles(files)} 
          />
          
          <FileUploadZone 
            type="product" 
            onFilesUploaded={(files) => setProductFiles(files)} 
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-4 border-t border-border bg-card">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={onComplete}
          disabled={isLoading}
        >
          {isLoading ? '저장 중...' : (
            <>
              설정 완료, AI 비서 시작 <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
