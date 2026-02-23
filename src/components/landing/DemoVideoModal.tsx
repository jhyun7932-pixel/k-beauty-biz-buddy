import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, RotateCcw, FileText, Building2, Package, Shield, Check, Globe, Star, TrendingUp, Edit3, Download, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';

interface DemoVideoModalProps {
  open: boolean;
  onClose: () => void;
  documentType: 'company' | 'catalog' | 'compliance';
}

// Animated document generation simulation
const CompanyDeckDemo = ({ step, isPlaying }: { step: number; isPlaying: boolean }) => {
  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r from-primary to-accent-violet p-4 transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-white text-lg font-bold">GLOW BEAUTY Co.</div>
            <div className="text-white/70 text-xs">Premium K-Beauty Brand</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-4 overflow-hidden">
        {/* Section 1: Brand Story */}
        <div className={`transition-all duration-500 delay-100 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Brand Introduction
          </h3>
          <div className="space-y-1.5">
            <div className={`h-2.5 bg-muted rounded transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
            <div className={`h-2.5 bg-muted rounded transition-all duration-300 delay-100 ${step >= 2 ? 'w-4/5' : 'w-0'}`} />
            <div className={`h-2.5 bg-muted rounded transition-all duration-300 delay-200 ${step >= 2 ? 'w-3/5' : 'w-0'}`} />
          </div>
        </div>

        {/* Section 2: Key Metrics */}
        <div className={`grid grid-cols-3 gap-3 transition-all duration-500 delay-200 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">15+</div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </div>
          <div className="bg-success/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-success">50+</div>
            <div className="text-xs text-muted-foreground">Products</div>
          </div>
          <div className="bg-accent-violet/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent-violet">10Y</div>
            <div className="text-xs text-muted-foreground">Experience</div>
          </div>
        </div>

        {/* Section 3: Certifications */}
        <div className={`transition-all duration-500 delay-300 ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h3 className="text-sm font-bold text-foreground mb-2">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {['FDA', 'ISO 22716', 'CPNP', 'NMPA'].map((cert, i) => (
              <span 
                key={cert} 
                className={`px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full transition-all duration-300`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                ✓ {cert}
              </span>
            ))}
          </div>
        </div>

        {/* Section 4: Contact */}
        <div className={`transition-all duration-500 delay-400 ${step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-primary/5 to-accent-violet/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Ready to Partner?</div>
                <div className="text-xs text-muted-foreground">export@glowbeauty.com</div>
              </div>
              <Button size="sm" className="text-xs">Contact Us</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t border-border p-3 flex justify-between items-center transition-all duration-500 ${step >= 5 ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-xs text-muted-foreground">Page 1 of 12</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CatalogDemo = ({ step, isPlaying }: { step: number; isPlaying: boolean }) => {
  const products = [
    { name: 'Glow Serum', color: 'bg-gradient-to-br from-pink-200 to-pink-100', price: '$24.00', sku: 'GS-001' },
    { name: 'Sun Shield SPF50', color: 'bg-gradient-to-br from-yellow-200 to-yellow-100', price: '$18.00', sku: 'SS-002' },
    { name: 'Hydra Cream', color: 'bg-gradient-to-br from-blue-200 to-blue-100', price: '$32.00', sku: 'HC-003' },
    { name: 'Clear Toner', color: 'bg-gradient-to-br from-green-200 to-green-100', price: '$15.00', sku: 'CT-004' },
  ];

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r from-accent-violet to-accent-mint p-4 transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white text-lg font-bold">Product Catalog 2025</div>
              <div className="text-white/70 text-xs">K-Beauty Collection</div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 text-white fill-white" />
            <span className="text-white text-xs">Best Sellers</span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-3 overflow-hidden">
        {products.map((product, i) => (
          <div 
            key={product.name}
            className={`bg-card rounded-xl border border-border p-3 space-y-2 transition-all duration-500 ${step >= i + 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <div className={`aspect-square ${product.color} rounded-lg flex items-center justify-center relative overflow-hidden`}>
              <div className="w-8 h-12 bg-white/80 rounded-md shadow-md" />
              <div className="absolute top-1 right-1 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
                NEW
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">{product.name}</div>
              <div className="text-[10px] text-muted-foreground">{product.sku}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-primary">{product.price}</div>
              <div className="text-[10px] text-muted-foreground">MOQ: 500</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`border-t border-border p-3 transition-all duration-500 ${step >= 6 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page 3 of 15 • 48 Products</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-medium">View All →</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComplianceDemo = ({ step, isPlaying }: { step: number; isPlaying: boolean }) => {
  const checkItems = [
    { label: 'Product Registration', status: 'pass', detail: 'FDA registered' },
    { label: 'Ingredient Compliance', status: 'pass', detail: 'All ingredients approved' },
    { label: 'Label Requirements', status: 'warn', detail: 'Review required' },
    { label: 'Safety Assessment', status: 'pass', detail: 'VCRP compliant' },
    { label: 'Facility Registration', status: 'check', detail: 'Pending verification' },
  ];

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r from-success to-primary p-4 transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white text-lg font-bold">Compliance RulePack</div>
              <div className="text-white/70 text-xs">USA (FDA/MoCRA) Requirements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3 overflow-hidden">
        {/* Target Market */}
        <div className={`flex items-center gap-2 p-2 bg-primary/5 rounded-lg transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Target: United States</span>
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">MoCRA 2024</span>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {checkItems.map((item, i) => (
            <div 
              key={item.label}
              className={`flex items-center gap-3 p-3 bg-card rounded-lg border border-border transition-all duration-500 ${step >= i + 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.status === 'pass' ? 'bg-success/20' : 
                item.status === 'warn' ? 'bg-warning/20' : 'bg-muted'
              }`}>
                {item.status === 'pass' && <Check className="h-3.5 w-3.5 text-success" />}
                {item.status === 'warn' && <span className="text-xs text-warning font-bold">!</span>}
                {item.status === 'check' && <span className="text-xs text-muted-foreground font-bold">?</span>}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className={`border-t border-border p-3 transition-all duration-500 ${step >= 8 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">4 Passed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-xs text-muted-foreground">1 Review</span>
            </div>
          </div>
          <div className="text-xs font-medium text-success">80% Ready</div>
        </div>
      </div>
    </div>
  );
};

export function DemoVideoModal({ open, onClose, documentType }: DemoVideoModalProps) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const titles = {
    company: { title: 'Company Deck', subtitle: '브랜드 소개서가 자동으로 생성되는 과정' },
    catalog: { title: 'Product Catalog', subtitle: '제품 카탈로그가 자동으로 구성되는 과정' },
    compliance: { title: 'Compliance RulePack', subtitle: '컴플라이언스 체크가 진행되는 과정' },
  };

  const maxSteps = documentType === 'company' ? 6 : documentType === 'catalog' ? 7 : 9;

  useEffect(() => {
    if (!open) {
      setStep(0);
      setIsPlaying(true);
      return;
    }

    if (!isPlaying) return;

    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= maxSteps) {
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [open, isPlaying, maxSteps]);

  const handleRestart = () => {
    setStep(0);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {titles[documentType].title} 생성 데모
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{titles[documentType].subtitle}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">생성 진행률</span>
              <span className="text-xs font-medium text-primary">{Math.min(Math.round((step / maxSteps) * 100), 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent-violet rounded-full transition-all duration-300"
                style={{ width: `${Math.min((step / maxSteps) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Demo Preview */}
          <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted rounded-xl p-4">
            {documentType === 'company' && <CompanyDeckDemo step={step} isPlaying={isPlaying} />}
            {documentType === 'catalog' && <CatalogDemo step={step} isPlaying={isPlaying} />}
            {documentType === 'compliance' && <ComplianceDemo step={step} isPlaying={isPlaying} />}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePlayPause}
                className="gap-1.5"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? '일시정지' : '재생'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRestart}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                다시보기
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {step >= maxSteps && (
                <span className="text-xs text-success font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  생성 완료!
                </span>
              )}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs text-foreground">AI 자동 생성</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-accent-violet/5 rounded-lg">
                <Edit3 className="h-4 w-4 text-accent-violet" />
                <span className="text-xs text-foreground">대화로 수정</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-success/5 rounded-lg">
                <Download className="h-4 w-4 text-success" />
                <span className="text-xs text-foreground">PDF 다운로드</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="p-6 pt-0">
          <Button className="w-full gap-2" size="lg" onClick={onClose}>
            <span>직접 만들어보기</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
