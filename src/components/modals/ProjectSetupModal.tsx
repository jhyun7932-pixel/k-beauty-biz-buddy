import React, { useState } from 'react';
import { Check, Globe, Store, Users, ArrowRight, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  TargetCountry, 
  SalesChannel, 
  BuyerType,
  TradeStagePreset,
  COUNTRY_NAMES 
} from '@/stores/projectStore';

interface ProjectSetupModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: {
    targetCountries: TargetCountry[];
    salesChannel: SalesChannel;
    buyerType: BuyerType;
    preset: TradeStagePreset;
  }) => void;
  initialPreset: TradeStagePreset;
}

const ALL_COUNTRIES: TargetCountry[] = ['US', 'JP', 'EU', 'HK', 'TW', 'CN', 'VN', 'ID', 'MY', 'TH', 'AU'];
const SALES_CHANNELS: SalesChannel[] = ['도매', '리테일', 'D2C', '마켓플레이스'];
const BUYER_TYPES: BuyerType[] = ['유통사', '리셀러', '플랫폼셀러', '브랜드오너', '수입대행'];

const PRESET_LABELS: Record<TradeStagePreset, string> = {
  '첫제안': '첫 제안 패키지',
  '샘플': '샘플 발송 서류',
  '본오더': '본오더 PI/계약서',
};

type Step = 'country' | 'channel' | 'buyer';

export function ProjectSetupModal({ 
  open, 
  onClose, 
  onConfirm, 
  initialPreset 
}: ProjectSetupModalProps) {
  const [step, setStep] = useState<Step>('country');
  const [selectedCountries, setSelectedCountries] = useState<TargetCountry[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel | null>(null);
  const [selectedBuyerType, setSelectedBuyerType] = useState<BuyerType | null>(null);

  const handleCountryToggle = (country: TargetCountry) => {
    setSelectedCountries(prev => {
      if (prev.includes(country)) {
        return prev.filter(c => c !== country);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 countries
      }
      return [...prev, country];
    });
  };

  const handleNext = () => {
    if (step === 'country' && selectedCountries.length > 0) {
      setStep('channel');
    } else if (step === 'channel' && selectedChannel) {
      setStep('buyer');
    }
  };

  const handleBack = () => {
    if (step === 'channel') {
      setStep('country');
    } else if (step === 'buyer') {
      setStep('channel');
    }
  };

  const handleConfirm = () => {
    if (selectedCountries.length > 0 && selectedChannel && selectedBuyerType) {
      onConfirm({
        targetCountries: selectedCountries,
        salesChannel: selectedChannel,
        buyerType: selectedBuyerType,
        preset: initialPreset,
      });
      // Reset state
      setStep('country');
      setSelectedCountries([]);
      setSelectedChannel(null);
      setSelectedBuyerType(null);
    }
  };

  const handleClose = () => {
    setStep('country');
    setSelectedCountries([]);
    setSelectedChannel(null);
    setSelectedBuyerType(null);
    onClose();
  };

  const stepTitles: Record<Step, string> = {
    country: '타겟 국가 선택 (최대 3개)',
    channel: '판매 채널 선택',
    buyer: '바이어 유형 선택',
  };

  const stepIcons: Record<Step, React.ReactNode> = {
    country: <Globe className="h-5 w-5 text-primary" />,
    channel: <Store className="h-5 w-5 text-primary" />,
    buyer: <Users className="h-5 w-5 text-primary" />,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {PRESET_LABELS[initialPreset]}
            </span>
          </div>
          <DialogTitle className="flex items-center gap-2">
            {stepIcons[step]}
            {stepTitles[step]}
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-2">
          {(['country', 'channel', 'buyer'] as Step[]).map((s, idx) => (
            <React.Fragment key={s}>
              <div 
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  step === s ? "bg-primary" :
                  (['country', 'channel', 'buyer'].indexOf(step) > idx) ? "bg-primary/50" : "bg-muted"
                )}
              />
            </React.Fragment>
          ))}
        </div>

        <div className="py-4 min-h-[280px]">
          {/* Step 1: Country Selection */}
          {step === 'country' && (
            <div className="grid grid-cols-2 gap-2">
              {ALL_COUNTRIES.map((country) => {
                const isSelected = selectedCountries.includes(country);
                const isDisabled = !isSelected && selectedCountries.length >= 3;
                
                return (
                  <button
                    key={country}
                    onClick={() => handleCountryToggle(country)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : isDisabled
                          ? "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                          : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="font-medium text-foreground">{COUNTRY_NAMES[country]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Sales Channel Selection */}
          {step === 'channel' && (
            <div className="space-y-2">
              {SALES_CHANNELS.map((channel) => {
                const isSelected = selectedChannel === channel;
                
                return (
                  <button
                    key={channel}
                    onClick={() => setSelectedChannel(channel)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{channel}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {channel === '도매' && '대량 주문, 유통사/임포터 대상'}
                        {channel === '리테일' && '소매점, 드러그스토어 등'}
                        {channel === 'D2C' && '직접 소비자 판매'}
                        {channel === '마켓플레이스' && '아마존, 쇼피 등 온라인 마켓'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3: Buyer Type Selection */}
          {step === 'buyer' && (
            <div className="space-y-2">
              {BUYER_TYPES.map((buyerType) => {
                const isSelected = selectedBuyerType === buyerType;
                
                return (
                  <button
                    key={buyerType}
                    onClick={() => setSelectedBuyerType(buyerType)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="font-medium text-foreground">{buyerType}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {step === 'country' && `${selectedCountries.length}/3 선택됨`}
            {step === 'channel' && (selectedChannel || '채널을 선택하세요')}
            {step === 'buyer' && (selectedBuyerType || '바이어 유형을 선택하세요')}
          </div>
          <div className="flex gap-2">
            {step !== 'country' && (
              <Button variant="outline" onClick={handleBack}>
                이전
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              취소
            </Button>
            {step !== 'buyer' ? (
              <Button 
                onClick={handleNext}
                disabled={
                  (step === 'country' && selectedCountries.length === 0) ||
                  (step === 'channel' && !selectedChannel)
                }
                className="gap-1"
              >
                다음
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleConfirm}
                disabled={!selectedBuyerType}
              >
                시작하기
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
