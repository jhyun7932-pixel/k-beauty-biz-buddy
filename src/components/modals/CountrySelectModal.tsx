import React, { useState } from 'react';
import { Globe, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { countryOptions } from '@/data/sampleData';

interface CountrySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (countries: string[], mode: 'detailed' | 'simple') => void;
}

export function CountrySelectModal({ open, onClose, onSelect }: CountrySelectModalProps) {
  const [mode, setMode] = useState<'detailed' | 'simple'>('detailed');
  const [selected, setSelected] = useState<string[]>([]);

  const countries = mode === 'detailed' ? countryOptions.detailed : countryOptions.simple;

  const toggleCountry = (country: string) => {
    setSelected(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const handleConfirm = () => {
    onSelect(selected, mode);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            어느 나라로 수출할까요?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setMode('detailed'); setSelected([]); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'detailed' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {mode === 'detailed' && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="font-medium text-foreground">상세 점검(권장)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                미국/대만/EU - 규제 상세 분석
              </p>
            </button>

            <button
              onClick={() => { setMode('simple'); setSelected([]); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'simple' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {mode === 'simple' && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="font-medium text-foreground">간편 체크(기본)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                아시아/호주 - 체크리스트 중심
              </p>
            </button>
          </div>

          {/* Hint for Simple Mode */}
          {mode === 'simple' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 text-xs text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>간편 체크는 체크리스트 중심으로 빠르게 확인해요.</span>
            </div>
          )}

          {/* Country Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">국가 선택</label>
            <div className="flex flex-wrap gap-2">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => toggleCountry(country)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selected.includes(country)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-foreground hover:bg-muted/50'
                  }`}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• 선택한 국가에 맞춰 자료를 '바이어 제출용'으로 정리해드려요.</p>
            <p>• 결과는 초안이며 최종 제출 전 확인이 필요해요.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleConfirm} disabled={selected.length === 0}>
            선택 완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
