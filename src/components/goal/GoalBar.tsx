import React, { useState, useEffect } from 'react';
import { Globe, Store, Users, Languages, DollarSign, ChevronDown, Check, Building2, Mail, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { 
  BuyerGoal, 
  TargetCountry, 
  SalesChannel, 
  BuyerType, 
  DealStage, 
  Language, 
  Currency 
} from '@/types';

interface GoalBarProps {
  goal: BuyerGoal | null;
  onGoalChange: (goal: BuyerGoal) => void;
  onGoalComplete: () => void;
  disabled?: boolean;
}

const COUNTRIES: TargetCountry[] = [
  '미국', '중국', '일본', '베트남', '인도네시아', 
  '말레이시아', '태국', '홍콩', '대만', '호주', 'EU'
];

const CHANNELS: { value: SalesChannel; label: string; description: string }[] = [
  { value: 'distributor', label: '유통사/도매', description: '디스트리뷰터' },
  { value: 'retail', label: '리테일', description: '오프라인/드럭스토어' },
  { value: 'online_market', label: '온라인 마켓', description: '아마존/쇼피/티몰' },
  { value: 'd2c', label: 'D2C', description: '자사몰/공식몰' },
];

const BUYER_TYPES: { value: BuyerType; label: string }[] = [
  { value: 'importer', label: '수입사' },
  { value: 'distributor', label: '유통사' },
  { value: 'retailer', label: '리테일러' },
  { value: 'reseller', label: '마켓 셀러' },
];

const DEAL_STAGES: { value: DealStage; label: string }[] = [
  { value: 'first_proposal', label: '첫 제안' },
  { value: 'sample_proposal', label: '샘플 제안' },
  { value: 'pre_contract', label: '계약 직전' },
  { value: 'shipment_prep', label: '출고·서류 준비' },
];

const LANGUAGES: Language[] = ['영어', '중국어', '일본어', '독일어', '한국어'];
const CURRENCIES: Currency[] = ['USD', 'HKD', 'JPY', 'CNY', 'EUR', 'AUD', 'KRW'];

// 자동 추천 로직
function getRecommendedLanguage(countries: TargetCountry[]): Language {
  if (countries.includes('일본')) return '일본어';
  if (countries.includes('중국')) return '중국어';
  if (countries.includes('EU')) return '영어'; // 기본값
  return '영어';
}

function getRecommendedCurrency(countries: TargetCountry[]): Currency {
  if (countries.includes('일본')) return 'JPY';
  if (countries.includes('중국')) return 'CNY';
  if (countries.includes('홍콩')) return 'HKD';
  if (countries.includes('호주')) return 'AUD';
  if (countries.includes('EU')) return 'EUR';
  return 'USD';
}

const defaultGoal: BuyerGoal = {
  countries: [],
  channel: null,
  buyerType: null,
  language: '영어',
  currency: 'USD',
  dealStage: null,
};

export function GoalBar({ goal, onGoalChange, onGoalComplete, disabled }: GoalBarProps) {
  const [localGoal, setLocalGoal] = useState<BuyerGoal>(goal || defaultGoal);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 국가 변경 시 언어/통화 자동 추천
  useEffect(() => {
    if (localGoal.countries.length > 0) {
      const recommendedLang = getRecommendedLanguage(localGoal.countries);
      const recommendedCurrency = getRecommendedCurrency(localGoal.countries);
      
      setLocalGoal(prev => ({
        ...prev,
        language: recommendedLang,
        currency: recommendedCurrency,
      }));
    }
  }, [localGoal.countries.join(',')]);

  // 로컬 상태가 변경될 때 부모에게 알림
  useEffect(() => {
    onGoalChange(localGoal);
  }, [localGoal, onGoalChange]);

  const isGoalComplete = 
    localGoal.countries.length > 0 && 
    localGoal.channel !== null && 
    localGoal.buyerType !== null;

  const toggleCountry = (country: TargetCountry) => {
    setLocalGoal(prev => {
      const isSelected = prev.countries.includes(country);
      if (isSelected) {
        return { ...prev, countries: prev.countries.filter(c => c !== country) };
      } else if (prev.countries.length < 3) {
        return { ...prev, countries: [...prev.countries, country] };
      }
      return prev;
    });
  };

  return (
    <div className="p-4 space-y-4 bg-card border-b border-border">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Globe className="h-4 w-4 text-primary" />
        <span>먼저 '보낼 나라/채널'을 골라주세요.</span>
      </div>

      {/* 국가 선택 (필수) */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          보낼 나라 <span className="text-danger">*</span>
          <span className="text-xs text-muted-foreground/60">(최대 3개)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((country) => {
            const isSelected = localGoal.countries.includes(country);
            const isDisabled = !isSelected && localGoal.countries.length >= 3;
            
            return (
              <button
                key={country}
                onClick={() => toggleCountry(country)}
                disabled={isDisabled || disabled}
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
                {country}
              </button>
            );
          })}
        </div>
      </div>

      {/* 채널 & 바이어 타입 (필수) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Store className="h-3 w-3" />
            판매 채널 <span className="text-danger">*</span>
          </Label>
          <Select
            value={localGoal.channel || ''}
            onValueChange={(value) => setLocalGoal(prev => ({ ...prev, channel: value as SalesChannel }))}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="선택..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {CHANNELS.map((ch) => (
                <SelectItem key={ch.value} value={ch.value}>
                  <div className="flex flex-col">
                    <span>{ch.label}</span>
                    <span className="text-xs text-muted-foreground">{ch.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            바이어 타입 <span className="text-danger">*</span>
          </Label>
          <Select
            value={localGoal.buyerType || ''}
            onValueChange={(value) => setLocalGoal(prev => ({ ...prev, buyerType: value as BuyerType }))}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="선택..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover">
              {BUYER_TYPES.map((bt) => (
                <SelectItem key={bt.value} value={bt.value}>
                  {bt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 자동 추천 안내 */}
      {localGoal.countries.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg">
          <Languages className="h-3.5 w-3.5" />
          <span>
            언어: <strong className="text-foreground">{localGoal.language}</strong>,
            통화: <strong className="text-foreground">{localGoal.currency}</strong>
            (자동 추천)
          </span>
        </div>
      )}

      {/* 선택 옵션 (접이식) */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            선택 옵션 {showAdvanced ? '접기' : '펼치기'}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {/* 언어/통화 수동 선택 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">언어</Label>
              <Select
                value={localGoal.language}
                onValueChange={(value) => setLocalGoal(prev => ({ ...prev, language: value as Language }))}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">통화</Label>
              <Select
                value={localGoal.currency}
                onValueChange={(value) => setLocalGoal(prev => ({ ...prev, currency: value as Currency }))}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 거래 단계 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">거래 단계</Label>
            <div className="flex flex-wrap gap-2">
              {DEAL_STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => setLocalGoal(prev => ({ 
                    ...prev, 
                    dealStage: prev.dealStage === stage.value ? null : stage.value 
                  }))}
                  disabled={disabled}
                  className={`
                    px-2.5 py-1 text-xs rounded-full border transition-all
                    ${localGoal.dealStage === stage.value
                      ? 'bg-accent-violet/10 text-accent-violet border-accent-violet/30'
                      : 'bg-card text-muted-foreground border-border hover:border-accent-violet/30'
                    }
                  `}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          {/* 바이어 정보 */}
          <div className="space-y-2 p-3 bg-muted/10 rounded-lg">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              특정 바이어 정보 (선택)
            </Label>
            <div className="grid grid-cols-1 gap-2">
              <Input
                placeholder="회사명"
                value={localGoal.buyerCompany || ''}
                onChange={(e) => setLocalGoal(prev => ({ ...prev, buyerCompany: e.target.value }))}
                className="h-8 text-xs"
                disabled={disabled}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="담당자명"
                  value={localGoal.buyerContact || ''}
                  onChange={(e) => setLocalGoal(prev => ({ ...prev, buyerContact: e.target.value }))}
                  className="h-8 text-xs"
                  disabled={disabled}
                />
                <Input
                  placeholder="이메일"
                  type="email"
                  value={localGoal.buyerEmail || ''}
                  onChange={(e) => setLocalGoal(prev => ({ ...prev, buyerEmail: e.target.value }))}
                  className="h-8 text-xs"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 목표 설정 완료 버튼 */}
      <div className="pt-2">
        {!isGoalComplete && (
          <div className="flex items-center gap-2 text-xs text-warning mb-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>목표가 없으면 패키지 톤이 맞지 않을 수 있어요.</span>
          </div>
        )}
        <Button 
          onClick={onGoalComplete}
          disabled={!isGoalComplete || disabled}
          className="w-full"
          size="sm"
        >
          {isGoalComplete ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              목표 설정 완료
            </>
          ) : (
            '국가, 채널, 바이어 타입을 선택해주세요'
          )}
        </Button>
      </div>
    </div>
  );
}
