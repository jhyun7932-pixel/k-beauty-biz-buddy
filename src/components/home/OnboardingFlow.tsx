import React, { useState } from 'react';
import { Globe, Package, Upload, FileText, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: (data: { countries: string[]; preset: string; hasFiles: boolean }) => void;
}

const COUNTRIES = [
  { code: 'US', name: '미국', flag: '🇺🇸' },
  { code: 'JP', name: '일본', flag: '🇯🇵' },
  { code: 'EU', name: 'EU', flag: '🇪🇺' },
  { code: 'HK', name: '홍콩', flag: '🇭🇰' },
  { code: 'TW', name: '대만', flag: '🇹🇼' },
  { code: 'CN', name: '중국', flag: '🇨🇳' },
  { code: 'VN', name: '베트남', flag: '🇻🇳' },
  { code: 'ID', name: '인도네시아', flag: '🇮🇩' },
  { code: 'MY', name: '말레이시아', flag: '🇲🇾' },
  { code: 'TH', name: '태국', flag: '🇹🇭' },
  { code: 'AU', name: '호주', flag: '🇦🇺' },
];

const PRESETS = [
  { id: 'FIRST_PROPOSAL', name: '첫 제안', description: '브랜드 소개, 카탈로그, 제안 메일', icon: '📧' },
  { id: 'SAMPLE', name: '샘플', description: 'PI, 포장명세서, 발송 이메일', icon: '📦' },
  { id: 'PURCHASE_ORDER', name: '본오더', description: 'PI, 계약서, 인보이스, Gate 검증', icon: '📝' },
];

const FILE_OPTIONS = [
  { id: 'company_deck', label: '회사소개서', icon: FileText },
  { id: 'inci', label: '성분표(INCI)', icon: FileText },
  { id: 'label', label: '라벨 이미지', icon: FileText },
  { id: 'none', label: '아직 없음 (샘플로 시작)', icon: Sparkles },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), code];
      }
      return [...prev, code];
    });
  };
  
  const handleCountryNext = () => {
    if (selectedCountries.length > 0) {
      setStep(2);
    }
  };
  
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    setStep(3);
  };
  
  const handleFileToggle = (fileId: string) => {
    if (fileId === 'none') {
      setSelectedFiles(['none']);
      return;
    }
    setSelectedFiles(prev => {
      const filtered = prev.filter(f => f !== 'none');
      if (prev.includes(fileId)) {
        return filtered.filter(f => f !== fileId);
      }
      return [...filtered, fileId];
    });
  };
  
  const handleComplete = () => {
    if (selectedPreset) {
      onComplete({
        countries: selectedCountries,
        preset: selectedPreset,
        hasFiles: !selectedFiles.includes('none') && selectedFiles.length > 0,
      });
    }
  };
  
  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Progress indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  s < step && "bg-primary text-primary-foreground",
                  s === step && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  s > step && "bg-muted text-muted-foreground"
                )}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 h-0.5",
                    s < step ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Step 1: Country Selection */}
      {step === 1 && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">어느 나라로 보낼까요?</h2>
          <p className="text-sm text-muted-foreground mb-6">최대 3개까지 선택할 수 있어요</p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => toggleCountry(country.code)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all",
                  selectedCountries.includes(country.code)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
              </button>
            ))}
          </div>
          
          <Button
            onClick={handleCountryNext}
            disabled={selectedCountries.length === 0}
            size="lg"
            className="gap-2"
          >
            다음
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          {selectedCountries.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              선택됨: {selectedCountries.map(c => COUNTRIES.find(co => co.code === c)?.name).join(', ')}
            </p>
          )}
        </div>
      )}
      
      {/* Step 2: Preset Selection */}
      {step === 2 && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">지금 단계는 어디에 가까우세요?</h2>
          <p className="text-sm text-muted-foreground mb-6">단계에 맞는 문서 패키지를 준비해드릴게요</p>
          
          <div className="space-y-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  selectedPreset === preset.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <span className="text-3xl">{preset.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-sm text-muted-foreground">{preset.description}</div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 이전으로
          </button>
        </div>
      )}
      
      {/* Step 3: File Selection */}
      {step === 3 && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">자료가 있으신가요?</h2>
          <p className="text-sm text-muted-foreground mb-6">있으면 업로드하고, 없으면 샘플로 시작해도 돼요</p>
          
          <div className="space-y-3 mb-8">
            {FILE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleFileToggle(option.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    selectedFiles.includes(option.id)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <span className="flex-1 font-medium">{option.label}</span>
                  {selectedFiles.includes(option.id) && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
          
          <Button
            onClick={handleComplete}
            size="lg"
            className="gap-2"
          >
            시작하기
            <Sparkles className="h-4 w-4" />
          </Button>
          
          <button
            onClick={() => setStep(2)}
            className="block w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 이전으로
          </button>
        </div>
      )}
    </div>
  );
}
