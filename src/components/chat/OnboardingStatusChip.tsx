import React from 'react';
import { Globe, Store, TrendingUp, FileText, Check, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { OnboardingContext } from '@/types/onboarding';
import { 
  ONBOARDING_COUNTRIES, 
  ONBOARDING_CHANNELS, 
  ONBOARDING_TRADE_STAGES 
} from '@/types/onboarding';

interface OnboardingStatusChipProps {
  context: OnboardingContext | null;
  hasCompanyDeck?: boolean;
  hasIngredients?: boolean;
  hasLabels?: boolean;
  onOpenSettings?: () => void;
}

export function OnboardingStatusChip({
  context,
  hasCompanyDeck = false,
  hasIngredients = false,
  hasLabels = false,
  onOpenSettings,
}: OnboardingStatusChipProps) {
  if (!context) return null;

  const countriesLabel = context.targetCountries
    .map(code => ONBOARDING_COUNTRIES.find(c => c.code === code)?.label || code)
    .join('/');

  const channelLabel = context.targetChannel
    ? ONBOARDING_CHANNELS.find(c => c.value === context.targetChannel)?.label || context.targetChannel
    : null;

  const stageLabel = ONBOARDING_TRADE_STAGES.find(s => s.value === context.tradeStage)?.label || null;

  const hasAnyAsset = hasCompanyDeck || hasIngredients || hasLabels;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-xs">
          {/* 국가 */}
          {countriesLabel && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Globe className="h-3 w-3" />
              {countriesLabel}
            </span>
          )}
          
          {/* 채널 */}
          {channelLabel && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-foreground">
                <Store className="h-3 w-3" />
                {channelLabel}
              </span>
            </>
          )}
          
          {/* 단계 */}
          {stageLabel && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-foreground">{stageLabel}</span>
            </>
          )}

          {/* 자료 상태 */}
          {hasAnyAsset ? (
            <span className="flex items-center gap-0.5 text-success">
              <FileText className="h-3 w-3" />
              <Check className="h-3 w-3" />
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-warning">
              <AlertCircle className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">현재 목표 설정</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onOpenSettings}
            >
              <Settings className="h-3 w-3 mr-1" />
              설정
            </Button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">보낼 나라</span>
              <span className="font-medium">{countriesLabel || '미설정'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">판매 채널</span>
              <span className="font-medium">{channelLabel || '미설정'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">거래 단계</span>
              <span className="font-medium">{stageLabel || '미설정'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">언어 / 통화</span>
              <span className="font-medium">{context.language} / {context.currency}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <h5 className="text-xs font-medium mb-2">업로드 자료</h5>
            <div className="flex flex-wrap gap-1.5">
              <span className={`px-2 py-0.5 rounded text-xs ${hasCompanyDeck ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                회사소개서 {hasCompanyDeck ? '✓' : ''}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${hasIngredients ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                성분표 {hasIngredients ? '✓' : ''}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${hasLabels ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                라벨 {hasLabels ? '✓' : ''}
              </span>
            </div>
            {!hasAnyAsset && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 자료를 올리면 더 정확한 문서가 만들어져요
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
