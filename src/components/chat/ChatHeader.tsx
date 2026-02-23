import React from 'react';
import { Globe, ShoppingCart, ArrowRightLeft, Languages, DollarSign, FileText, FlaskConical, Image, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextChip {
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
}

interface MaterialStatus {
  id: string;
  label: string;
  icon: React.ReactNode;
  uploaded: boolean;
}

interface ChatHeaderProps {
  countries?: string[];
  channel?: string;
  tradeStage?: string;
  language?: string;
  currency?: string;
  onMaterialClick?: (materialId: string) => void;
  companyDocUploaded?: boolean;
  ingredientsUploaded?: boolean;
  labelUploaded?: boolean;
}

export function ChatHeader({
  countries = ['홍콩', '일본'],
  channel = '도매',
  tradeStage = '첫 제안',
  language = '영어',
  currency = 'USD',
  onMaterialClick,
  companyDocUploaded = false,
  ingredientsUploaded = false,
  labelUploaded = true,
}: ChatHeaderProps) {
  const contextChips: ContextChip[] = [
    { label: countries.slice(0, 3).join(', '), icon: <Globe className="h-3 w-3" />, variant: 'outline' },
    { label: channel, icon: <ShoppingCart className="h-3 w-3" />, variant: 'secondary' },
    { label: tradeStage, icon: <ArrowRightLeft className="h-3 w-3" />, variant: 'default' },
    { label: language, icon: <Languages className="h-3 w-3" />, variant: 'outline' },
    { label: currency, icon: <DollarSign className="h-3 w-3" />, variant: 'outline' },
  ];

  const materials: MaterialStatus[] = [
    { id: 'company', label: '회사소개서', icon: <FileText className="h-3 w-3" />, uploaded: companyDocUploaded },
    { id: 'ingredients', label: '성분표', icon: <FlaskConical className="h-3 w-3" />, uploaded: ingredientsUploaded },
    { id: 'label', label: '라벨', icon: <Image className="h-3 w-3" />, uploaded: labelUploaded },
  ];

  return (
    <div className="p-3 border-b border-border bg-card/50 backdrop-blur-sm space-y-3">
      {/* Context Chips */}
      <div className="flex flex-wrap gap-1.5">
        {contextChips.map((chip, index) => (
          <Badge 
            key={index} 
            variant={chip.variant}
            className="h-6 px-2 text-xs font-normal gap-1"
          >
            {chip.icon}
            {chip.label}
          </Badge>
        ))}
      </div>

      {/* Material Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">자료:</span>
        <div className="flex gap-1.5">
          {materials.map((material) => (
            <Button
              key={material.id}
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-xs gap-1",
                !material.uploaded && "text-amber-600 hover:text-amber-700"
              )}
              onClick={() => onMaterialClick?.(material.id)}
            >
              {material.icon}
              {material.label}
              {material.uploaded ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
