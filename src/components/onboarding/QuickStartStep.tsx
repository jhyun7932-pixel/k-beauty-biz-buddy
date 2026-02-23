import React from 'react';
import { Sparkles, ArrowRight, Check, Globe, Store, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { 
  OnboardingContext, 
  OnboardingSalesChannel, 
  OnboardingTradeStage 
} from '@/types/onboarding';
import {
  ONBOARDING_COUNTRIES,
  ONBOARDING_CHANNELS,
  ONBOARDING_TRADE_STAGES,
} from '@/types/onboarding';

interface QuickStartStepProps {
  context: OnboardingContext;
  onUpdateContext: (updates: Partial<OnboardingContext>) => void;
  onToggleCountry: (countryCode: string) => void;
  onStartImmediately: () => void;
  onShowUpload: () => void;
  isComplete: boolean;
  isLoading: boolean;
}

export function QuickStartStep({
  context,
  onUpdateContext,
  onToggleCountry,
  onStartImmediately,
  onShowUpload,
  isComplete,
  isLoading,
}: QuickStartStepProps) {
  const isStep1Valid = 
    context.targetCountries.length > 0 && 
    context.targetChannel !== null &&
    context.tradeStage !== null;

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

      {/* Quick Start Form */}
      <div className="flex-1 p-6 space-y-6">
        {/* 1. 보낼 나라 (필수) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            보낼 나라 <span className="text-destructive">*</span>
            <span className="text-xs text-muted-foreground font-normal">(최대 3개)</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_COUNTRIES.map((country) => {
              const isSelected = context.targetCountries.includes(country.code);
              const isDisabled = !isSelected && context.targetCountries.length >= 3;
              
              return (
                <button
                  key={country.code}
                  onClick={() => onToggleCountry(country.code)}
                  disabled={isDisabled || isLoading}
                  className={`
                    px-3 py-1.5 text-sm rounded-full border transition-all duration-200
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                    }
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isSelected && <Check className="h-3 w-3 inline mr-1" />}
                  {country.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 판매 채널 (필수) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            판매 채널 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={context.targetChannel || ''}
            onValueChange={(value) => onUpdateContext({ targetChannel: value as OnboardingSalesChannel })}
            disabled={isLoading}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="채널 선택..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {ONBOARDING_CHANNELS.map((ch) => (
                <SelectItem key={ch.value} value={ch.value}>
                  <div className="flex flex-col items-start">
                    <span>{ch.label}</span>
                    <span className="text-xs text-muted-foreground">{ch.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. 거래 단계 (필수) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            거래 단계 <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_TRADE_STAGES.map((stage) => (
              <button
                key={stage.value}
                onClick={() => onUpdateContext({ tradeStage: stage.value })}
                disabled={isLoading}
                className={`
                  px-3 py-1.5 text-sm rounded-full border transition-all
                  ${context.tradeStage === stage.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                  }
                `}
              >
                {context.tradeStage === stage.value && <Check className="h-3 w-3 inline mr-1" />}
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* 자동 설정 안내 */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">자동 설정:</span>{' '}
            바이어 유형(수입사), 언어(영어), 통화(USD)
            <br />
            <span className="text-primary">→ 설정에서 언제든 변경 가능</span>
          </p>
        </div>
      </div>

      {/* Bottom CTAs */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={onStartImmediately}
          disabled={!isStep1Valid || isLoading}
        >
          {isLoading ? (
            '준비 중...'
          ) : !isStep1Valid ? (
            '필수 항목을 선택해주세요'
          ) : (
            <>
              바로 시작 <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          className="w-full gap-2 text-sm"
          onClick={onShowUpload}
          disabled={!isStep1Valid || isLoading}
        >
          <Sparkles className="h-4 w-4" />
          자료도 올리고 시작 (추천)
        </Button>
      </div>
    </div>
  );
}
