import React, { useState } from 'react';
import { Package, FileText, Download, Edit, ChevronDown, ChevronUp, CheckCircle2, Clock, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface PackageDocument {
  id: string;
  name: string;
  type: string;
  pages: number;
  status: 'draft' | 'edited' | 'final';
  selected: boolean;
}

interface BuyerPackageTab2Props {
  onNavigate?: (tab: string, docId?: string) => void;
  onExport?: (type: 'zip' | 'pdf') => void;
}

const presets = [
  { id: 'first_proposal', label: '첫 제안', description: '브랜드 소개 + 카탈로그 + 제안 조건', icon: Package },
  { id: 'sample', label: '샘플', description: '샘플 정책 + 물류 안내', icon: Package },
  { id: 'main_order', label: '본오더', description: 'PI + 계약서 초안 + 납품 일정', icon: Package },
];

const initialDocs: PackageDocument[] = [
  { id: '1', name: 'Company Deck', type: 'company', pages: 5, status: 'final', selected: true },
  { id: '2', name: 'Product Catalog - 2024', type: 'catalog', pages: 12, status: 'edited', selected: true },
  { id: '3', name: 'Compliance Snapshot', type: 'compliance', pages: 3, status: 'draft', selected: true },
  { id: '4', name: 'Deal Sheet - 홍콩 바이어', type: 'deal', pages: 1, status: 'draft', selected: true },
  { id: '5', name: '첫 제안 이메일', type: 'email', pages: 1, status: 'edited', selected: true },
];

export function BuyerPackageTab2({ onNavigate, onExport }: BuyerPackageTab2Props) {
  const [selectedPreset, setSelectedPreset] = useState<string>('first_proposal');
  const [documents, setDocuments] = useState<PackageDocument[]>(initialDocs);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, selected: !doc.selected } : doc
    ));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      edited: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      final: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    const labels = { draft: '초안', edited: '편집됨', final: '최종' };
    return (
      <Badge className={cn("text-[10px] h-4 px-1.5", styles[status as keyof typeof styles])}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const selectedCount = documents.filter(d => d.selected).length;
  const totalPages = documents.filter(d => d.selected).reduce((sum, d) => sum + d.pages, 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Preset Buttons */}
        <section>
          <h3 className="text-sm font-semibold mb-3">패키지 프리셋</h3>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant={selectedPreset === preset.id ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-3 flex-col items-center gap-1",
                  selectedPreset === preset.id && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => setSelectedPreset(preset.id)}
              >
                <preset.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{preset.label}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {presets.find(p => p.id === selectedPreset)?.description}
          </p>
        </section>

        {/* Document Selection */}
        <section>
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">포함 문서</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  고급 옵션
                  {showAdvanced ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {documents.map((doc) => (
                      <li 
                        key={doc.id} 
                        className="p-3 flex items-center gap-3 hover:bg-muted/50"
                      >
                        <Checkbox 
                          checked={doc.selected}
                          onCheckedChange={() => toggleDocument(doc.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.pages}p</p>
                        </div>
                        {getStatusBadge(doc.status)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Generated Result */}
        <section>
          <h3 className="text-sm font-semibold mb-3">생성 결과</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-bold">{selectedCount}개 문서</p>
                  <p className="text-xs text-muted-foreground">총 {totalPages}페이지</p>
                </div>
                <Badge variant="outline" className="h-6">
                  {presets.find(p => p.id === selectedPreset)?.label} 패키지
                </Badge>
              </div>

              <div className="space-y-2">
                {documents.filter(d => d.selected).map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">({doc.pages}p)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      {doc.status === 'final' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : doc.status === 'edited' ? (
                        <PenLine className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Buttons */}
        <section className="flex gap-2">
          <Button 
            className="flex-1"
            onClick={() => onExport?.('zip')}
          >
            <Download className="h-4 w-4 mr-2" />
            ZIP로 받기
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => onNavigate?.('studio')}
          >
            <Edit className="h-4 w-4 mr-2" />
            편집하러 가기
          </Button>
        </section>
      </div>
    </ScrollArea>
  );
}
