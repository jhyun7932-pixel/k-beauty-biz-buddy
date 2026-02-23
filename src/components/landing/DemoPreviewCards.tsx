import React, { useState } from 'react';
import { FileText, Building2, Package, Shield, Check, Globe, Star, TrendingUp, Play } from 'lucide-react';
import { DemoVideoModal } from './DemoVideoModal';

const CompanyDeckPreview = () => (
  <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-inner flex flex-col">
    {/* Header */}
    <div className="bg-gradient-to-r from-primary to-accent-violet p-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
          <Building2 className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="text-white text-[10px] font-bold">GLOW BEAUTY Co.</div>
      </div>
    </div>
    {/* Content */}
    <div className="flex-1 p-3 space-y-2">
      <div className="text-[8px] font-bold text-foreground">Brand Introduction</div>
      <div className="space-y-1">
        <div className="h-1.5 bg-muted rounded w-full" />
        <div className="h-1.5 bg-muted rounded w-4/5" />
        <div className="h-1.5 bg-muted rounded w-3/5" />
      </div>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <div className="bg-primary/10 rounded p-1.5">
          <div className="flex items-center gap-1">
            <Globe className="h-2.5 w-2.5 text-primary" />
            <span className="text-[6px] text-primary font-medium">Global</span>
          </div>
        </div>
        <div className="bg-success/10 rounded p-1.5">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5 text-success" />
            <span className="text-[6px] text-success font-medium">Growth</span>
          </div>
        </div>
      </div>
      <div className="space-y-1 pt-1">
        <div className="h-1.5 bg-muted rounded w-full" />
        <div className="h-1.5 bg-muted rounded w-5/6" />
      </div>
    </div>
    {/* Footer */}
    <div className="border-t border-border p-2 flex justify-between items-center">
      <span className="text-[6px] text-muted-foreground">Page 1 of 12</span>
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-1 h-1 rounded-full ${i === 1 ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  </div>
);

const CatalogPreview = () => (
  <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-inner flex flex-col">
    {/* Header */}
    <div className="bg-gradient-to-r from-accent-violet to-accent-mint p-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
          <Package className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="text-white text-[10px] font-bold">Product Catalog 2025</div>
      </div>
    </div>
    {/* Product Grid */}
    <div className="flex-1 p-2 grid grid-cols-2 gap-1.5">
      {[
        { name: 'Glow Serum', color: 'bg-pink-100', price: '$24.00' },
        { name: 'Sun Shield', color: 'bg-yellow-100', price: '$18.00' },
        { name: 'Hydra Cream', color: 'bg-blue-100', price: '$32.00' },
        { name: 'Clear Toner', color: 'bg-green-100', price: '$15.00' },
      ].map((product, i) => (
        <div key={i} className="bg-card rounded border border-border p-1.5 space-y-1">
          <div className={`aspect-square ${product.color} rounded flex items-center justify-center`}>
            <div className="w-4 h-6 bg-white/60 rounded-sm shadow-sm" />
          </div>
          <div className="text-[6px] font-medium text-foreground truncate">{product.name}</div>
          <div className="text-[6px] text-primary font-bold">{product.price}</div>
        </div>
      ))}
    </div>
    {/* Footer */}
    <div className="border-t border-border p-2 flex justify-between items-center">
      <span className="text-[6px] text-muted-foreground">Page 3 of 15</span>
      <div className="flex items-center gap-1">
        <Star className="h-2 w-2 text-warning fill-warning" />
        <span className="text-[6px] text-muted-foreground">Best Sellers</span>
      </div>
    </div>
  </div>
);

const CompliancePreview = () => (
  <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-inner flex flex-col">
    {/* Header */}
    <div className="bg-gradient-to-r from-success to-primary p-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
          <Shield className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="text-white text-[10px] font-bold">Compliance RulePack</div>
      </div>
    </div>
    {/* Checklist */}
    <div className="flex-1 p-2 space-y-1.5">
      <div className="flex items-center gap-1 px-1">
        <Globe className="h-2.5 w-2.5 text-muted-foreground" />
        <span className="text-[7px] font-medium text-foreground">USA (FDA/MoCRA)</span>
      </div>
      {[
        { label: 'Product Registration', status: 'pass' },
        { label: 'Ingredient Compliance', status: 'pass' },
        { label: 'Label Requirements', status: 'warn' },
        { label: 'Safety Assessment', status: 'pass' },
        { label: 'Facility Registration', status: 'check' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 p-1.5 bg-card rounded border border-border">
          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
            item.status === 'pass' ? 'bg-success/20' : 
            item.status === 'warn' ? 'bg-warning/20' : 'bg-muted'
          }`}>
            {item.status === 'pass' && <Check className="h-2 w-2 text-success" />}
            {item.status === 'warn' && <span className="text-[6px] text-warning font-bold">!</span>}
            {item.status === 'check' && <span className="text-[6px] text-muted-foreground">?</span>}
          </div>
          <span className="text-[6px] text-foreground flex-1">{item.label}</span>
        </div>
      ))}
    </div>
    {/* Footer */}
    <div className="border-t border-border p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[6px] text-muted-foreground">4 Pass</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-[6px] text-muted-foreground">1 Review</span>
        </div>
      </div>
    </div>
  </div>
);

type DocumentType = 'company' | 'catalog' | 'compliance';

export function DemoPreviewCards() {
  const [selectedDemo, setSelectedDemo] = useState<DocumentType | null>(null);

  const cards: { 
    title: string; 
    subtitle: string; 
    preview: React.ReactNode; 
    badge: string;
    type: DocumentType;
  }[] = [
    { 
      title: 'Company Deck', 
      subtitle: '브랜드 소개서',
      preview: <CompanyDeckPreview />,
      badge: '12p',
      type: 'company'
    },
    { 
      title: 'Product Catalog', 
      subtitle: '제품 카탈로그',
      preview: <CatalogPreview />,
      badge: '15p',
      type: 'catalog'
    },
    { 
      title: 'Compliance', 
      subtitle: '컴플라이언스 체크',
      preview: <CompliancePreview />,
      badge: 'RulePack',
      type: 'compliance'
    },
  ];

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">예시 화면(샘플)</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-success font-medium">Live Preview</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <div 
              key={i} 
              className="group cursor-pointer"
              onClick={() => setSelectedDemo(card.type)}
            >
              <div className="aspect-[3/4] rounded-xl border-2 border-border bg-gradient-to-br from-muted/50 to-muted overflow-hidden mb-3 group-hover:border-primary/30 group-hover:shadow-lg transition-all duration-300 relative">
                <div className="absolute inset-1">
                  {card.preview}
                </div>
                {/* Hover overlay with play button */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                    <div className="bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-primary/20">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Play className="h-3 w-3 text-primary-foreground fill-primary-foreground ml-0.5" />
                      </div>
                      <span className="text-sm font-medium text-primary">데모 보기</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{card.title}</p>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{card.badge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              다운로드 가능(PDF) / 편집 가능
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-success" />
              <span className="text-xs text-success font-medium">자동 생성 완료</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Video Modal */}
      <DemoVideoModal 
        open={selectedDemo !== null}
        onClose={() => setSelectedDemo(null)}
        documentType={selectedDemo || 'company'}
      />
    </>
  );
}
