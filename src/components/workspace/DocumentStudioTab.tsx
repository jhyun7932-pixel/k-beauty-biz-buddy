import React, { useState, useCallback, useMemo } from 'react';
import { sanitizeHTML } from '@/lib/sanitize';
import { 
  FileText, 
  BookOpen,
  ClipboardCheck,
  Receipt,
  FileSignature,
  Sparkles, 
  Save, 
  RotateCcw, 
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Printer,
  FileArchive,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { renderDocument, extractSections } from '@/lib/templates/templateEngine';
import { validateCrossDocument, extractDocumentValues, getValidationSummary } from '@/lib/templates/crossDocumentValidation';
import { downloadDocumentsAsZip, type DocumentData } from '@/lib/export/zipExport';
import type { DocumentType, DocumentMode } from '@/lib/templates/documentStyles';
import { PAGE_LIMITS } from '@/lib/templates/documentStyles';
import type { DocumentTemplateData, PITemplateData, ContractTemplateData, ValidationWarning } from '@/lib/templates/documentTypes';
import { toast } from 'sonner';


interface DocumentStudioTabProps {
  onExport?: (format: 'pdf' | 'docx' | 'zip') => void;
}

// 문서 타입 정보
const DOCUMENT_TYPES: { 
  id: DocumentType; 
  label: string; 
  icon: React.ElementType;
  description: string;
}[] = [
  { id: 'brand_deck', label: '브랜드 소개서', icon: BookOpen, description: 'Company/Brand Deck' },
  { id: 'catalog', label: '카탈로그', icon: FileText, description: 'Product Catalog' },
  { id: 'compliance', label: '수출 준비 요약', icon: ClipboardCheck, description: 'Compliance Snapshot' },
  { id: 'pi', label: '견적서(PI)', icon: Receipt, description: 'Proforma Invoice' },
  { id: 'contract', label: '계약서', icon: FileSignature, description: 'Sales Contract' },
];

// 샘플 데이터 (실제로는 상위에서 전달받음)
const getSampleData = (): DocumentTemplateData => ({
  workspace: {
    companyName: 'K-Beauty Corp',
    brandName: 'Glow Lab',
    address: 'Seoul, South Korea',
    contactEmail: 'export@kbeauty.com',
    contactPhone: '+82-2-1234-5678',
    website: 'www.kbeauty.com',
    defaultIncoterms: 'FOB',
    defaultPaymentTerms: 'T/T 30/70',
    defaultMoq: 500,
    defaultLeadTime: 20,
    bankName: 'Kookmin Bank',
    bankAccountName: 'K-Beauty Corp',
    bankAccountNo: '123-456-789012',
    bankSwift: 'CZNBKRSE',
  },
  project: {
    countries: ['US', 'JP'],
    channel: 'Wholesale',
    buyerType: 'Importer',
    tradeStage: 'first_proposal',
    currency: 'USD',
    language: 'en',
  },
  skus: [
    { id: '1', no: 1, productName: 'Hydra Glow Serum', sku: 'HGS-001', category: 'Serum', sizeMlG: 30, qty: 1000, unitPrice: 8.5, amount: 8500, moq: 500, hsCode: '3304.99' },
    { id: '2', no: 2, productName: 'Vita C Cream', sku: 'VCC-002', category: 'Cream', sizeMlG: 50, qty: 800, unitPrice: 12.0, amount: 9600, moq: 500, hsCode: '3304.99' },
    { id: '3', no: 3, productName: 'Gentle Foam Cleanser', sku: 'GFC-003', category: 'Cleanser', sizeMlG: 150, qty: 1200, unitPrice: 5.5, amount: 6600, moq: 500, hsCode: '3401.30' },
  ],
  trade: {
    incoterms: 'FOB Busan',
    paymentTerms: 'T/T 30% deposit, 70% before shipment',
    leadTime: '20 days after deposit',
    moq: 500,
    currency: 'USD',
    validityDays: 30,
  },
});

export function DocumentStudioTab({ onExport }: DocumentStudioTabProps) {
  const [activeDocType, setActiveDocType] = useState<DocumentType>('brand_deck');
  const [mode, setMode] = useState<DocumentMode>('summary');
  const [zoom, setZoom] = useState([80]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<Record<DocumentType, string>>({
    brand_deck: '',
    catalog: '',
    compliance: '',
    pi: '',
    contract: '',
  });
  const [showMistakeCheck, setShowMistakeCheck] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);

  // 샘플 데이터
  const templateData = useMemo(() => getSampleData(), []);
  
  // DocumentData로 변환 (ZIP 내보내기용)
  const getDocumentData = useCallback((): DocumentData => ({
    workspace: {
      companyName: templateData.workspace.companyName,
      companyNameKr: templateData.workspace.companyNameKr,
      brandName: templateData.workspace.brandName,
      address: templateData.workspace.address,
      email: templateData.workspace.contactEmail,
      phone: templateData.workspace.contactPhone,
      website: templateData.workspace.website,
      logoUrl: templateData.workspace.logoUrl,
      incoterms: templateData.workspace.defaultIncoterms,
      paymentTerms: templateData.workspace.defaultPaymentTerms,
      moq: templateData.workspace.defaultMoq,
      leadTime: templateData.workspace.defaultLeadTime,
      bankName: templateData.workspace.bankName,
      bankAccountName: templateData.workspace.bankAccountName,
      bankAccountNo: templateData.workspace.bankAccountNo,
      bankSwift: templateData.workspace.bankSwift,
      certifications: templateData.workspace.certifications,
    },
    project: {
      targetCountries: templateData.project.countries,
      channel: templateData.project.channel,
      buyerType: templateData.project.buyerType,
      tradeStage: templateData.project.tradeStage,
      currency: templateData.project.currency,
      language: templateData.project.language,
    },
    skus: templateData.skus.map(sku => ({
      id: sku.id,
      name: sku.productName,
      nameEn: sku.productNameEn,
      category: sku.category,
      skuCode: sku.sku,
      sizeMlG: sku.sizeMlG,
      moq: sku.moq,
      unitPriceRange: { min: sku.unitPrice, max: sku.unitPrice },
      leadTime: sku.leadTime,
      hsCode: sku.hsCode,
      ingredients: sku.ingredients,
      claims: sku.claims,
      imageUrl: sku.imageUrl,
    })),
    buyer: templateData.buyer ? {
      company: templateData.buyer.companyName,
      contact: templateData.buyer.contactName,
      email: templateData.buyer.contactEmail,
      country: templateData.buyer.country,
      channel: templateData.buyer.channel,
      address: templateData.buyer.address,
    } : undefined,
    trade: {
      incoterms: templateData.trade.incoterms,
      paymentTerms: templateData.trade.paymentTerms,
      leadTime: templateData.trade.leadTime,
      moq: templateData.trade.moq,
      currency: templateData.trade.currency,
      validityDays: templateData.trade.validityDays,
    },
  }), [templateData]);


  // 문서 생성
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    
    // 시뮬레이션 딜레이
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      let data: DocumentTemplateData | PITemplateData | ContractTemplateData = templateData;

      if (activeDocType === 'pi') {
        data = {
          ...templateData,
          piNumber: `PI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
        } as PITemplateData;
      } else if (activeDocType === 'contract') {
        data = {
          ...templateData,
          contractNumber: `SC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
          governingLaw: 'Republic of Korea',
        } as ContractTemplateData;
      }

      const html = renderDocument(activeDocType, mode, data);
      
      setGeneratedHtml(prev => ({
        ...prev,
        [activeDocType]: html,
      }));

      toast.success(`${DOCUMENT_TYPES.find(d => d.id === activeDocType)?.label} 초안 생성 완료`, {
        description: `${mode === 'summary' ? '요약' : '자세히'} 모드 · ${PAGE_LIMITS[activeDocType][mode].max}p 이내`,
      });
    } catch (error) {
      toast.error('문서 생성 실패');
    } finally {
      setIsGenerating(false);
    }
  }, [activeDocType, mode, templateData]);

  // 실수 체크 (Cross-document validation)
  const handleMistakeCheck = useCallback(() => {
    const documents: Record<string, ReturnType<typeof extractDocumentValues>> = {};
    
    // 생성된 문서들의 값 추출
    (['pi', 'contract', 'catalog'] as const).forEach(docType => {
      if (generatedHtml[docType]) {
        documents[docType] = extractDocumentValues(docType, templateData);
      }
    });

    const warnings = validateCrossDocument(documents);
    setValidationWarnings(warnings);
    setShowMistakeCheck(true);

    if (warnings.length === 0) {
      toast.success('실수 체크 완료', { description: '문서 간 불일치가 없습니다' });
    } else {
      toast.warning(`${warnings.length}개 항목 확인 필요`);
    }
  }, [generatedHtml, templateData]);

  // PDF 인쇄
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (printWindow && generatedHtml[activeDocType]) {
      printWindow.document.write(generatedHtml[activeDocType]);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.info('먼저 문서를 생성해주세요');
    }
  }, [activeDocType, generatedHtml]);

  // ZIP 다운로드
  const handleZipDownload = useCallback(async () => {
    setIsExportingZip(true);
    
    try {
      const docData = getDocumentData();
      
      // 생성된 문서 목록 확인
      const generatedDocs: { type: DocumentType; mode: DocumentMode }[] = [];
      (Object.keys(generatedHtml) as DocumentType[]).forEach(docType => {
        if (generatedHtml[docType]) {
          generatedDocs.push({ type: docType, mode: mode });
        }
      });

      // 생성된 문서가 없으면 모든 문서를 summary 모드로 포함
      const includeAll = generatedDocs.length === 0;
      
      await downloadDocumentsAsZip({
        documents: generatedDocs,
        data: docData,
        includeAllDocuments: includeAll,
      });

      toast.success('ZIP 다운로드 완료!', {
        description: includeAll 
          ? '5종 문서 전체가 포함되었습니다'
          : `${generatedDocs.length}개 문서가 포함되었습니다`,
      });
      
      onExport?.('zip');
    } catch (error) {
      console.error('ZIP export error:', error);
      toast.error('ZIP 다운로드 실패', {
        description: '파일 생성 중 오류가 발생했습니다',
      });
    } finally {
      setIsExportingZip(false);
    }
  }, [generatedHtml, mode, getDocumentData, onExport]);


  const currentDoc = DOCUMENT_TYPES.find(d => d.id === activeDocType)!;
  const pageLimit = PAGE_LIMITS[activeDocType][mode];
  const hasGenerated = !!generatedHtml[activeDocType];
  const validationSummary = getValidationSummary(validationWarnings);

  return (
    <div className="flex flex-col h-full">
      {/* Header with document type tabs */}
      <div className="border-b border-border bg-card">
        <Tabs value={activeDocType} onValueChange={(v) => setActiveDocType(v as DocumentType)}>
          <TabsList className="w-full justify-start rounded-none bg-transparent h-10 px-2">
            {DOCUMENT_TYPES.map(doc => {
              const Icon = doc.icon;
              const isGenerated = !!generatedHtml[doc.id];
              return (
                <TabsTrigger 
                  key={doc.id}
                  value={doc.id}
                  className="gap-1.5 text-xs data-[state=active]:bg-background relative"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {doc.label}
                  {isGenerated && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="p-3 border-b border-border bg-card flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Mode selector */}
          <Select value={mode} onValueChange={(v) => setMode(v as DocumentMode)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">요약 ({pageLimit.min}-{PAGE_LIMITS[activeDocType].summary.max}p)</SelectItem>
              <SelectItem value="detailed">자세히 ({PAGE_LIMITS[activeDocType].detailed.min}-{PAGE_LIMITS[activeDocType].detailed.max}p)</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            size="sm" 
            className="h-8 text-xs gap-1"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating ? '생성 중...' : '초안 만들기'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {hasGenerated && (
            <>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                <Save className="h-3.5 w-3.5" />
                저장
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                되돌리기
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1"
            onClick={handleMistakeCheck}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            실수 체크
            {validationWarnings.length > 0 && (
              <Badge variant="destructive" className="h-4 px-1 text-[10px] ml-1">
                {validationWarnings.length}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1">
                <Download className="h-3.5 w-3.5" />
                출력
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                PDF로 저장 (인쇄)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleZipDownload} disabled={isExportingZip}>
                {isExportingZip ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileArchive className="h-4 w-4 mr-2" />
                )}
                ZIP로 받기 (HTML + meta)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Validation Warning Banner */}
      {validationWarnings.length > 0 && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            문서 간 {validationSummary.totalWarnings}개 불일치 발견 ({validationSummary.fields.join(', ')})
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs ml-auto"
            onClick={() => setShowMistakeCheck(true)}
          >
            자세히 보기
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-muted/20">
          {/* Zoom Controls */}
          <div className="p-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={50}
                max={150}
                step={10}
                className="w-24"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-1">{zoom}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {currentDoc.description}
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-5">
                최대 {pageLimit.max}p
              </Badge>
            </div>
          </div>

          {/* Document Preview */}
          <ScrollArea className="flex-1">
            <div className="p-4" style={{ transform: `scale(${zoom[0] / 100})`, transformOrigin: 'top center' }}>
              {hasGenerated ? (
                <div 
                  className="document-preview"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(generatedHtml[activeDocType]) }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
                  <currentDoc.icon className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">{currentDoc.label}</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">{currentDoc.description}</p>
                  <p className="text-xs text-muted-foreground/50 mt-4">
                    "초안 만들기" 버튼을 클릭하여 문서를 생성하세요
                  </p>
                  <Button className="mt-6 gap-2" onClick={handleGenerate} disabled={isGenerating}>
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? '생성 중...' : '초안 만들기'}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Expert Teaser */}
      <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-5">준비중</Badge>
          <span className="text-xs text-muted-foreground">전문가 확인으로 한 번 더 점검하세요</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
          자세히 보기
        </Button>
      </div>

      {/* Mistake Check Dialog */}
      <Dialog open={showMistakeCheck} onOpenChange={setShowMistakeCheck}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              실수 체크 결과
            </DialogTitle>
            <DialogDescription>
              문서 간 불일치 항목을 확인하고 수정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {validationWarnings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium">문제 없음!</p>
                <p className="text-sm text-muted-foreground">모든 문서의 조건이 일치합니다.</p>
              </div>
            ) : (
              validationWarnings.map((warning) => (
                <div 
                  key={warning.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "text-[10px]",
                      warning.field.includes('currency') || warning.field.includes('incoterms') 
                        ? "border-red-300 text-red-600" 
                        : "border-amber-300 text-amber-600"
                    )}>
                      {warning.field}
                    </Badge>
                    <span className="text-sm font-medium">{warning.message}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(warning.values).map(([doc, value]) => (
                      <div key={doc} className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground uppercase">{doc}</span>
                        <span className="font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMistakeCheck(false)}>
              닫기
            </Button>
            {validationWarnings.length > 0 && (
              <Button onClick={() => {
                toast.info('값 통일 기능은 준비 중입니다');
              }}>
                한 번에 맞추기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
