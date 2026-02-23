import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, Globe, Store, TrendingUp, Upload } from 'lucide-react';
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
  OnboardingSalesChannel, 
  OnboardingTradeStage,
  OnboardingBuyerType
} from '@/types/onboarding';
import {
  ONBOARDING_COUNTRIES,
  ONBOARDING_CHANNELS,
  ONBOARDING_TRADE_STAGES,
  ONBOARDING_BUYER_TYPES,
} from '@/types/onboarding';

interface TwoStepOnboardingProps {
  context: OnboardingContext;
  onUpdateContext: (updates: Partial<OnboardingContext>) => void;
  onToggleCountry: (countryCode: string) => void;
  onStartImmediately: () => Promise<any>;
  onSampleClick: () => void;
  isLoading: boolean;
}

const LANGUAGES = [
  { value: 'en', label: '영어' },
  { value: 'ja', label: '일본어' },
  { value: 'zh', label: '중국어' },
  { value: 'de', label: '독일어' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'JPY', label: 'JPY' },
  { value: 'CNY', label: 'CNY' },
  { value: 'EUR', label: 'EUR' },
  { value: 'AUD', label: 'AUD' },
  { value: 'HKD', label: 'HKD' },
];

export function TwoStepOnboarding({
  context,
  onUpdateContext,
  onToggleCountry,
  onStartImmediately,
  onSampleClick,
  isLoading,
}: TwoStepOnboardingProps) {
  const [showExpanded, setShowExpanded] = useState(false);
  const [companyFiles, setCompanyFiles] = useState<File[]>([]);
  const [productFiles, setProductFiles] = useState<File[]>([]);

  const isStep1Valid = 
    context.targetCountries.length > 0 && 
    context.targetChannel !== null &&
    context.tradeStage !== null;

  const handleStart = async () => {
    const result = await onStartImmediately();
    if (!result.error) {
      // 성공 시 AI 채팅으로 이동됨
    }
  };

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
          60초 안에 AI 무역비서와 대화 시작
        </h1>
        <p className="text-sm text-muted-foreground">
          필수 최소 정보만 선택하면 바로 초안이 만들어집니다
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-6 space-y-5 overflow-auto">
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

        {/* Step 1: 필수 최소 */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <span className="text-sm font-semibold text-foreground">빠른 시작 (필수)</span>
          </div>

          {/* 보낼 나라 */}
          <div className="space-y-2 mb-4">
            <Label className="text-xs font-medium flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-primary" />
              보낼 나라 <span className="text-destructive">*</span>
              <span className="text-muted-foreground font-normal">(최대 3개)</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {ONBOARDING_COUNTRIES.map((country) => {
                const isSelected = context.targetCountries.includes(country.code);
                const isDisabled = !isSelected && context.targetCountries.length >= 3;
                
                return (
                  <button
                    key={country.code}
                    onClick={() => onToggleCountry(country.code)}
                    disabled={isDisabled || isLoading}
                    className={`
                      px-2.5 py-1 text-xs rounded-full border transition-all
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card text-foreground border-border hover:border-primary/50'
                      }
                      ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isSelected && <Check className="h-3 w-3 inline mr-0.5" />}
                    {country.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 판매 채널 & 거래 단계 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Store className="h-3.5 w-3.5 text-primary" />
                판매 채널 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={context.targetChannel || ''}
                onValueChange={(value) => onUpdateContext({ targetChannel: value as OnboardingSalesChannel })}
                disabled={isLoading}
              >
                <SelectTrigger className="h-9 bg-background text-xs">
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {ONBOARDING_CHANNELS.map((ch) => (
                    <SelectItem key={ch.value} value={ch.value} className="text-xs">
                      {ch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                거래 단계 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={context.tradeStage || ''}
                onValueChange={(value) => onUpdateContext({ tradeStage: value as OnboardingTradeStage })}
                disabled={isLoading}
              >
                <SelectTrigger className="h-9 bg-background text-xs">
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {ONBOARDING_TRADE_STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value} className="text-xs">
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 자동 설정 안내 */}
          <p className="text-xs text-muted-foreground">
            기본값: 바이어타입(수입사), 언어(영어), 통화(USD) — 설정에서 변경 가능
          </p>
        </div>

        {/* Step 2: 선택 확장 */}
        {showExpanded && (
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">2</span>
              <span className="text-sm font-semibold text-foreground">선택 확장 (더 정확해져요)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 바이어 타입 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">바이어 타입</Label>
                <Select
                  value={context.buyerType}
                  onValueChange={(value) => onUpdateContext({ buyerType: value as OnboardingBuyerType })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-9 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {ONBOARDING_BUYER_TYPES.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value} className="text-xs">
                        {bt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 언어 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">언어</Label>
                <Select
                  value={context.language}
                  onValueChange={(value) => onUpdateContext({ language: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-9 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="text-xs">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 통화 */}
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">통화</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr.value}
                      onClick={() => onUpdateContext({ currency: curr.value })}
                      disabled={isLoading}
                      className={`
                        px-2.5 py-1 text-xs rounded border transition-all
                        ${context.currency === curr.value
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                        }
                      `}
                    >
                      {curr.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 업로드 */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Upload className="h-3.5 w-3.5 text-primary" />
                자료 업로드 (선택)
              </div>
              <p className="text-xs text-muted-foreground">
                지금은 최소 정보로도 시작할 수 있어요. 자료를 올리면 AI가 문서 자동 채움/리스크 체크까지 더 정확해집니다.
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
        )}

        {/* 선택 확장 토글 */}
        {!showExpanded && (
          <button
            onClick={() => setShowExpanded(true)}
            className="w-full py-3 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            + 선택 확장 (언제든 설정에서 변경 가능)
          </button>
        )}
      </div>

      {/* Bottom CTAs */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleStart}
          disabled={!isStep1Valid || isLoading}
        >
          {isLoading ? (
            '준비 중...'
          ) : !isStep1Valid ? (
            '국가, 채널, 거래단계를 선택해주세요'
          ) : showExpanded ? (
            <>
              자료도 올리고 시작 <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              바로 시작 <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
