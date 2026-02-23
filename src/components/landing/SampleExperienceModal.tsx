import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, Check, Globe, Package } from 'lucide-react';

interface SampleExperienceModalProps {
  open: boolean;
  onClose: () => void;
}

const COUNTRIES = [
  { code: 'US', name: '미국', flag: '🇺🇸' },
  { code: 'JP', name: '일본', flag: '🇯🇵' },
  { code: 'EU', name: 'EU', flag: '🇪🇺' },
  { code: 'CN', name: '중국', flag: '🇨🇳' },
];

const CATEGORIES = [
  { id: 'sunscreen', name: '선크림' },
  { id: 'cream', name: '크림' },
  { id: 'serum', name: '세럼/에센스' },
  { id: 'mask', name: '마스크팩' },
];

const SAMPLE_DOCS = [
  {
    title: 'Brand Introduction Deck',
    subtitle: '회사/브랜드 소개서',
    pages: '12p',
  },
  {
    title: 'Product Catalog',
    subtitle: '제품 카탈로그',
    pages: '15p',
  },
  {
    title: 'Compliance Snapshot',
    subtitle: '컴플라이언스 요약',
    pages: '6p',
  },
];

export function SampleExperienceModal({ open, onClose }: SampleExperienceModalProps) {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = () => {
    if (selectedCountry && selectedCategory) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setSelectedCountry(null);
    setSelectedCategory(null);
    setShowResults(false);
  };

  const handleStartWithMyData = () => {
    onClose();
    navigate('/signup');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            샘플 체험
          </DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              간단히 선택하면 어떤 결과물이 나오는지 미리 볼 수 있어요.
            </p>

            {/* Country Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                수출 대상 국가
              </label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      selectedCountry === country.code
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <span className="mr-2">{country.flag}</span>
                    {country.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                제품 카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      selectedCategory === category.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!selectedCountry || !selectedCategory}
              className="w-full gap-2"
            >
              샘플 결과 보기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Selected Context */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                {COUNTRIES.find((c) => c.code === selectedCountry)?.flag}{' '}
                {COUNTRIES.find((c) => c.code === selectedCountry)?.name}
              </Badge>
              <Badge variant="outline">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </Badge>
              <button
                onClick={handleReset}
                className="text-sm text-primary hover:underline ml-auto"
              >
                다시 선택
              </button>
            </div>

            {/* Sample Results */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">이런 결과물이 생성됩니다:</h3>
              
              <div className="grid gap-4">
                {SAMPLE_DOCS.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border"
                  >
                    <div className="w-16 h-20 bg-gradient-to-br from-primary/10 to-accent-violet/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground">{doc.subtitle}</p>
                      <Badge variant="secondary" className="mt-2">
                        {doc.pages}
                      </Badge>
                    </div>
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-foreground text-sm">포함 내용:</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-success" />
                    선택한 국가 규제에 맞춘 컴플라이언스 체크
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-success" />
                    제품 카테고리별 맞춤 문구 및 클레임
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-success" />
                    바이어 유형에 따른 프레젠테이션 스타일
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Button onClick={handleStartWithMyData} className="w-full gap-2" size="lg">
                내 데이터로 만들어보기
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                가입 직후 샘플 프로젝트가 자동으로 생성돼요.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
