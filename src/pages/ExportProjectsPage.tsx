import React, { useState, useRef, useCallback } from 'react';
import { Plus, FileText, Calendar, Trash2, MoreVertical, ChevronRight, Download, FileDown, History, Clock, Building2, Package, CheckSquare, Square, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useProjectStore, PIPELINE_STAGES, type PipelineStage, type Project } from '@/stores/projectStore';
import { useBuyers } from '@/hooks/useBuyers';
import { useAppStore } from '@/stores/appStore';
import { getBuyerCountryDisplay } from '@/lib/countryFlags';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────
const STAGE_COLORS: Record<PipelineStage, string> = {
  '첫 제안 진행': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  '샘플 검토': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  '본 오더 및 계약': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  '선적 및 통관': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  '수출 완료': 'bg-green-500/10 text-green-600 border-green-500/30',
};

const STAGE_HEADER_COLORS: Record<PipelineStage, string> = {
  '첫 제안 진행': 'bg-blue-500',
  '샘플 검토': 'bg-amber-500',
  '본 오더 및 계약': 'bg-purple-500',
  '선적 및 통관': 'bg-orange-500',
  '수출 완료': 'bg-green-500',
};

// ──────────────────────────────────────────────────────────
// Stage-based document tab definitions
// ──────────────────────────────────────────────────────────
interface DocTabDef {
  key: string;
  label: string;
  emoji: string;
  docType: string;
}

const PROPOSAL_TABS: DocTabDef[] = [
  { key: 'proposal', label: '제안서/소개서', emoji: '🏢', docType: 'PROPOSAL' },
  { key: 'sample_email', label: '샘플 발송 안내 메일', emoji: '✉️', docType: 'SAMPLE_EMAIL' },
];

const SAMPLE_TABS: DocTabDef[] = [
  { key: 'sample_pi', label: '샘플 PI', emoji: '📄', docType: 'SAMPLE_PI' },
  { key: 'sample_pl', label: '샘플 발송장', emoji: '📦', docType: 'SAMPLE_PL' },
];

const BULK_TABS: DocTabDef[] = [
  { key: 'final_pi', label: '본 오더 PI', emoji: '📄', docType: 'PI' },
  { key: 'contract', label: 'Sales Contract', emoji: '📝', docType: 'CONTRACT' },
  { key: 'ci', label: 'CI (인보이스)', emoji: '💰', docType: 'CI' },
  { key: 'pl', label: 'PL (패킹리스트)', emoji: '📦', docType: 'PL' },
];

function getTabsForStage(stage: PipelineStage): { active: DocTabDef[]; history: DocTabDef[] } {
  switch (stage) {
    case '첫 제안 진행':
      return { active: PROPOSAL_TABS, history: [] };
    case '샘플 검토':
      return { active: [...PROPOSAL_TABS, ...SAMPLE_TABS], history: [] };
    case '본 오더 및 계약':
      return { active: BULK_TABS, history: [...PROPOSAL_TABS, ...SAMPLE_TABS] };
    case '선적 및 통관':
    case '수출 완료':
      return { active: BULK_TABS, history: [...PROPOSAL_TABS, ...SAMPLE_TABS] };
    default:
      return { active: PROPOSAL_TABS, history: [] };
  }
}

// ──────────────────────────────────────────────────────────
// Document HTML generator per type
// ──────────────────────────────────────────────────────────
function getDocHtml(type: string, project: Project): string {
  const base = {
    companyName: 'K-Beauty Co., Ltd.',
    buyerName: 'International Buyer Co.',
    piNumber: `PI-${project.id.slice(-6).toUpperCase()}`,
    date: new Date().toLocaleDateString('en-US'),
  };

  switch (type) {
    case 'PROPOSAL':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #2563eb;padding-bottom:10px;color:#1e40af">COMPANY / BRAND INTRODUCTION</h2>
        <p><strong>Date:</strong> ${base.date}</p>
        <p><strong>Company:</strong> ${base.companyName}</p>
        <h3 style="margin-top:20px">About Us</h3>
        <p>We are a leading K-Beauty manufacturer with 10+ years of experience, CGMP/ISO 22716 certified, serving 50+ global partners.</p>
        <h3 style="margin-top:15px">Core Products</h3>
        <table style="width:100%;border-collapse:collapse;margin-top:10px">
          <thead><tr style="background:#eff6ff"><th style="border:1px solid #ddd;padding:8px;text-align:left">Product</th><th style="border:1px solid #ddd;padding:8px">Category</th><th style="border:1px solid #ddd;padding:8px">MOQ</th></tr></thead>
          <tbody>
            <tr><td style="border:1px solid #ddd;padding:8px">Hydra Serum 30ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">Skincare</td><td style="border:1px solid #ddd;padding:8px;text-align:center">500</td></tr>
            <tr><td style="border:1px solid #ddd;padding:8px">Glow Cream 50ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">Skincare</td><td style="border:1px solid #ddd;padding:8px;text-align:center">300</td></tr>
          </tbody>
        </table>
        <h3 style="margin-top:15px">Certifications</h3>
        <p>✅ CGMP · ✅ ISO 22716 · ✅ Vegan Certified · ✅ EWG Verified</p>
      </div>`;
    case 'SAMPLE_EMAIL':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #2563eb;padding-bottom:10px;color:#1e40af">SAMPLE SHIPMENT NOTICE</h2>
        <p style="margin-top:15px">Dear Valued Buyer,</p>
        <p>Thank you for your interest in our products. We are pleased to inform you that your sample package has been prepared and will be shipped shortly.</p>
        <h3 style="margin-top:15px">Sample Package Contents:</h3>
        <ul><li>Hydra Serum 30ml × 3</li><li>Glow Cream 50ml × 2</li><li>Product Catalog</li><li>Certificate copies</li></ul>
        <p style="margin-top:15px"><strong>Estimated Delivery:</strong> 5-7 business days via DHL Express</p>
        <p><strong>Tracking Number:</strong> (Will be provided upon shipment)</p>
        <p style="margin-top:20px">Best regards,<br/>${base.companyName} Export Team</p>
      </div>`;
    case 'SAMPLE_PI':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #333;padding-bottom:10px">SAMPLE PROFORMA INVOICE</h2>
        <p><strong>PI No.:</strong> SPI-${base.piNumber}</p><p><strong>Date:</strong> ${base.date}</p>
        <p><strong>Seller:</strong> ${base.companyName}</p><p><strong>Buyer:</strong> ${base.buyerName}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:15px">
          <thead><tr style="background:#f5f5f5"><th style="border:1px solid #ddd;padding:8px;text-align:left">Description</th><th style="border:1px solid #ddd;padding:8px">Qty</th><th style="border:1px solid #ddd;padding:8px">Unit Price</th><th style="border:1px solid #ddd;padding:8px">Amount</th></tr></thead>
          <tbody>
            <tr><td style="border:1px solid #ddd;padding:8px">Hydra Serum 30ml (Sample)</td><td style="border:1px solid #ddd;padding:8px;text-align:center">3</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$4.50</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$13.50</td></tr>
            <tr><td style="border:1px solid #ddd;padding:8px">Glow Cream 50ml (Sample)</td><td style="border:1px solid #ddd;padding:8px;text-align:center">2</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$5.20</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$10.40</td></tr>
          </tbody>
        </table>
        <p style="text-align:right;margin-top:10px"><strong>Total: $23.90</strong></p>
        <p><strong>Note:</strong> Sample shipment - no charge for product; buyer covers shipping.</p>
      </div>`;
    case 'SAMPLE_PL':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #333;padding-bottom:10px">SAMPLE PACKING LIST</h2>
        <p><strong>PL No.:</strong> SPL-${base.piNumber}</p><p><strong>Date:</strong> ${base.date}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:15px">
          <thead><tr style="background:#f5f5f5"><th style="border:1px solid #ddd;padding:8px">Item</th><th style="border:1px solid #ddd;padding:8px">Qty</th><th style="border:1px solid #ddd;padding:8px">N.W. (g)</th></tr></thead>
          <tbody>
            <tr><td style="border:1px solid #ddd;padding:8px">Hydra Serum 30ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">3</td><td style="border:1px solid #ddd;padding:8px;text-align:right">90</td></tr>
            <tr><td style="border:1px solid #ddd;padding:8px">Glow Cream 50ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">2</td><td style="border:1px solid #ddd;padding:8px;text-align:right">100</td></tr>
          </tbody>
        </table>
        <p style="text-align:right;margin-top:10px"><strong>Total: 1 Box / N.W. 190g</strong></p>
      </div>`;
    case 'PI':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #333;padding-bottom:10px">PROFORMA INVOICE</h2>
        <p><strong>PI No.:</strong> ${base.piNumber}</p><p><strong>Date:</strong> ${base.date}</p>
        <p><strong>Seller:</strong> ${base.companyName}</p><p><strong>Buyer:</strong> ${base.buyerName}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:15px">
          <thead><tr style="background:#f5f5f5"><th style="border:1px solid #ddd;padding:8px;text-align:left">Description</th><th style="border:1px solid #ddd;padding:8px">Qty</th><th style="border:1px solid #ddd;padding:8px">Unit Price</th><th style="border:1px solid #ddd;padding:8px">Amount</th></tr></thead>
          <tbody>
            <tr><td style="border:1px solid #ddd;padding:8px">Hydra Serum 30ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">500</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$4.50</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$2,250</td></tr>
            <tr><td style="border:1px solid #ddd;padding:8px">Glow Cream 50ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">500</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$5.20</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$2,600</td></tr>
          </tbody>
        </table>
        <p style="text-align:right;margin-top:10px"><strong>Total: $4,850.00</strong></p>
        <p><strong>Payment Terms:</strong> T/T 30/70</p><p><strong>Incoterms:</strong> FOB Incheon</p>
      </div>`;
    case 'CONTRACT':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #333;padding-bottom:10px">SALES CONTRACT</h2>
        <p><strong>Contract No.:</strong> SC-${base.piNumber}</p><p><strong>Date:</strong> ${base.date}</p>
        <p><strong>Seller:</strong> ${base.companyName}</p><p><strong>Buyer:</strong> ${base.buyerName}</p>
        <h3 style="margin-top:20px">Article 1. Products & Quantity</h3>
        <p>As per Proforma Invoice ${base.piNumber}</p>
        <h3 style="margin-top:15px">Article 2. Price & Payment</h3>
        <p>Total Amount: USD 4,850.00 / Payment: T/T 30% deposit, 70% before shipment</p>
        <h3 style="margin-top:15px">Article 3. Delivery</h3>
        <p>FOB Incheon, within 20 working days after deposit received</p>
        <h3 style="margin-top:15px">Article 4. Quality</h3>
        <p>Products shall conform to CGMP standards and comply with destination country regulations.</p>
        <div style="display:flex;gap:80px;margin-top:40px"><div><p><strong>SELLER:</strong></p><br/><p>___________________</p><p>${base.companyName}</p></div><div><p><strong>BUYER:</strong></p><br/><p>___________________</p><p>${base.buyerName}</p></div></div>
      </div>`;
    case 'CI':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #333;padding-bottom:10px">COMMERCIAL INVOICE</h2>
        <p><strong>Invoice No.:</strong> CI-${base.piNumber}</p><p><strong>Date:</strong> ${base.date}</p>
        <p><strong>Exporter:</strong> ${base.companyName}, Seoul, South Korea</p>
        <p><strong>Consignee:</strong> ${base.buyerName}</p>
        <p><strong>Country of Origin:</strong> Republic of Korea</p><p><strong>HS Code:</strong> 3304.99</p>
        <table style="width:100%;border-collapse:collapse;margin-top:15px">
          <thead><tr style="background:#f5f5f5"><th style="border:1px solid #ddd;padding:8px;text-align:left">Description</th><th style="border:1px solid #ddd;padding:8px">Qty</th><th style="border:1px solid #ddd;padding:8px">Unit Price</th><th style="border:1px solid #ddd;padding:8px">Amount</th></tr></thead>
          <tbody>
            <tr><td style="border:1px solid #ddd;padding:8px">Hydra Serum 30ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">500</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$4.50</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$2,250</td></tr>
            <tr><td style="border:1px solid #ddd;padding:8px">Glow Cream 50ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">500</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$5.20</td><td style="border:1px solid #ddd;padding:8px;text-align:right">$2,600</td></tr>
          </tbody>
        </table>
        <p style="text-align:right;margin-top:10px"><strong>Total: USD 4,850.00</strong></p>
      </div>`;
    case 'PL':
      return `<div style="font-family:sans-serif;padding:20px;max-width:700px">
        <h2 style="border-bottom:2px solid #333;padding-bottom:10px">PACKING LIST</h2>
        <p><strong>PL No.:</strong> PL-${base.piNumber}</p><p><strong>Date:</strong> ${base.date}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:15px">
          <thead><tr style="background:#f5f5f5"><th style="border:1px solid #ddd;padding:8px">Item</th><th style="border:1px solid #ddd;padding:8px">Qty</th><th style="border:1px solid #ddd;padding:8px">Cartons</th><th style="border:1px solid #ddd;padding:8px">G.W. (kg)</th><th style="border:1px solid #ddd;padding:8px">N.W. (kg)</th></tr></thead>
          <tbody>
            <tr><td style="border:1px solid #ddd;padding:8px">Hydra Serum 30ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">500</td><td style="border:1px solid #ddd;padding:8px;text-align:center">25</td><td style="border:1px solid #ddd;padding:8px;text-align:right">18.5</td><td style="border:1px solid #ddd;padding:8px;text-align:right">15.0</td></tr>
            <tr><td style="border:1px solid #ddd;padding:8px">Glow Cream 50ml</td><td style="border:1px solid #ddd;padding:8px;text-align:center">500</td><td style="border:1px solid #ddd;padding:8px;text-align:center">25</td><td style="border:1px solid #ddd;padding:8px;text-align:right">27.5</td><td style="border:1px solid #ddd;padding:8px;text-align:right">25.0</td></tr>
          </tbody>
        </table>
        <p style="text-align:right;margin-top:10px"><strong>Total: 50 Cartons / G.W. 46.0 kg</strong></p>
      </div>`;
    default:
      return '<p>문서 내용이 준비 중입니다.</p>';
  }
}

// ──────────────────────────────────────────────────────────
// Project Detail View (Stage-based Dynamic Tabs)
// ──────────────────────────────────────────────────────────
function ProjectDetailView({ project, onBack }: { project: Project; onBack: () => void }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { active: activeTabs, history: historyTabs } = getTabsForStage(project.pipelineStage);
  const [activeTabKey, setActiveTabKey] = useState(activeTabs[0]?.key || 'proposal');

  const currentTab = [...activeTabs, ...historyTabs].find(t => t.key === activeTabKey);
  const isHistoryDoc = historyTabs.some(t => t.key === activeTabKey);

  // Check if AI-generated doc exists
  const aiDoc = project.documents?.find(d => d.docKey === currentTab?.docType);
  const htmlContent = aiDoc ? aiDoc.html : getDocHtml(currentTab?.docType || 'PROPOSAL', project);

  // PDF Download
  const handleDownloadPDF = useCallback(async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      const filename = `${currentTab?.label || 'document'}_${project.name}.pdf`;
      pdf.save(filename.replace(/\s+/g, '_'));
      toast.success('PDF 다운로드 완료');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF 생성에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [currentTab, project.name]);

  // Word Download
  const handleDownloadWord = useCallback(async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const content = previewRef.current.innerHTML;
      const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;font-size:11pt;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ccc;padding:4px 8px;font-size:10pt;}</style></head><body>`;
      const postHtml = `</body></html>`;
      const blob = new Blob([preHtml + content + postHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `${currentTab?.label || 'document'}_${project.name}.doc`;
      a.download = filename.replace(/\s+/g, '_');
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Word 다운로드 완료');
    } catch (err) {
      console.error('Word generation failed:', err);
      toast.error('Word 생성에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [currentTab, project.name]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Detail Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground h-8">
            <ChevronRight className="h-4 w-4 rotate-180" />
            목록으로
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-base font-bold text-foreground truncate flex-1">{project.name}</h1>
          <Badge variant="outline" className={`text-xs border ${STAGE_COLORS[project.pipelineStage]}`}>
            {project.pipelineStage}
          </Badge>
        </div>
      </div>

      {/* Document Tabs */}
      <Tabs value={activeTabKey} onValueChange={setActiveTabKey} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 pt-3 border-b border-border bg-card/20">
          <div className="flex items-center gap-2">
            <TabsList className="h-10 flex-wrap">
              {activeTabs.map(tab => (
                <TabsTrigger key={tab.key} value={tab.key} className="text-xs gap-1">
                  <span>{tab.emoji}</span> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {historyTabs.length > 0 && (
              <Button
                variant={showHistory ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5 text-xs ml-2 h-8"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-3.5 w-3.5" />
                히스토리 ({historyTabs.length})
              </Button>
            )}
          </div>

          {/* History tabs row */}
          {showHistory && historyTabs.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pb-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground mr-1">이전 단계:</span>
              {historyTabs.map(tab => (
                <Button
                  key={tab.key}
                  variant={activeTabKey === tab.key ? 'secondary' : 'outline'}
                  size="sm"
                  className="text-[11px] h-7 gap-1 opacity-80"
                  onClick={() => setActiveTabKey(tab.key)}
                >
                  <span>{tab.emoji}</span> {tab.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Document Content - single content area for all tabs */}
        {[...activeTabs, ...historyTabs].map(tab => {
          const tabAiDoc = project.documents?.find(d => d.docKey === tab.docType);
          const tabHtml = tabAiDoc ? tabAiDoc.html : getDocHtml(tab.docType, project);
          const isHistory = historyTabs.some(h => h.key === tab.key);

          return (
            <TabsContent key={tab.key} value={tab.key} className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">
                          {tab.emoji} {tab.label}
                        </h2>
                        {tabAiDoc && (
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/5">
                            ✨ AI 생성
                          </Badge>
                        )}
                        {isHistory && (
                          <Badge variant="secondary" className="text-[10px]">
                            📁 읽기 전용
                          </Badge>
                        )}
                      </div>
                      {!isHistory && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleDownloadWord}
                            disabled={downloading}
                          >
                            <FileDown className="h-3.5 w-3.5" /> Word
                          </Button>
                        </div>
                      )}
                    </div>
                    <Card className={cn("shadow-sm", isHistory && "opacity-75 border-dashed")}>
                      <CardContent className="p-0">
                        <div
                          ref={tab.key === activeTabKey ? previewRef : undefined}
                          className="p-4"
                          dangerouslySetInnerHTML={{ __html: tabHtml }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Draggable Project Card
// ──────────────────────────────────────────────────────────
interface DraggableCardProps {
  project: Project;
  onCardClick: (project: Project) => void;
  onStageChange: (projectId: string, stage: PipelineStage) => void;
  onDelete: (projectId: string) => void;
  currentStage: PipelineStage;
}

function DraggableCard({ project, onCardClick, onStageChange, onDelete, currentStage }: DraggableCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('projectId', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md',
        'transition-all duration-200 hover:border-primary/30 group',
        'active:opacity-60 active:scale-95'
      )}
      onClick={() => onCardClick(project)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1 min-w-0">
            {project.name}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PIPELINE_STAGES.filter(s => s !== currentStage).map(nextStage => (
                <DropdownMenuItem
                  key={nextStage}
                  onClick={e => {
                    e.stopPropagation();
                    onStageChange(project.id, nextStage);
                    toast.success(`"${project.name}" → ${nextStage}`);
                  }}
                >
                  {nextStage}(으)로 이동
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="text-destructive"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(project.id);
                  toast.success('삭제되었습니다.');
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {project.context.targetCountries.slice(0, 3).map(c => (
            <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 h-4">{c}</Badge>
          ))}
          {project.context.targetCountries.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              +{project.context.targetCountries.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {project.documents.length}개 문서
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────
// Drop Column
// ──────────────────────────────────────────────────────────
interface DropColumnProps {
  stage: PipelineStage;
  projects: Project[];
  onCardClick: (project: Project) => void;
  onStageChange: (projectId: string, stage: PipelineStage) => void;
  onDelete: (projectId: string) => void;
}

function DropColumn({ stage, projects, onCardClick, onStageChange, onDelete }: DropColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const projectId = e.dataTransfer.getData('projectId');
    if (projectId) {
      onStageChange(projectId, stage);
      toast.success(`프로젝트가 "${stage}"(으)로 이동되었습니다.`);
    }
  };

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column Header */}
      <div className="flex-shrink-0 mb-3">
        <div className={`h-1 rounded-full mb-2 ${STAGE_HEADER_COLORS[stage]}`} />
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground truncate">{stage}</h3>
          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
            {projects.length}
          </Badge>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          'flex-1 space-y-2 min-h-[200px] pb-4 rounded-xl transition-all duration-200 p-1',
          isDragOver
            ? 'bg-primary/5 border-2 border-dashed border-primary/40'
            : 'border-2 border-dashed border-transparent'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {projects.map(project => (
          <DraggableCard
            key={project.id}
            project={project}
            currentStage={stage}
            onCardClick={onCardClick}
            onStageChange={onStageChange}
            onDelete={onDelete}
          />
        ))}

        {projects.length === 0 && (
          <div className={cn(
            'flex flex-col items-center justify-center py-8 px-4 rounded-xl text-center h-full min-h-[120px]',
            isDragOver ? 'opacity-0' : 'opacity-100'
          )}>
            <p className="text-xs text-muted-foreground">프로젝트 없음</p>
            {isDragOver && <p className="text-xs text-primary mt-1">여기에 놓으세요</p>}
          </div>
        )}

        {isDragOver && (
          <div className="flex items-center justify-center py-4 rounded-lg border-2 border-dashed border-primary/60 bg-primary/5">
            <p className="text-xs text-primary font-medium">여기에 놓으세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 3-Step Project Creation Wizard
// ──────────────────────────────────────────────────────────
interface WizardState {
  step: 1 | 2 | 3;
  buyerId: string;
  buyerName: string;
  selectedProductIds: string[];
  stage: PipelineStage;
  customName: string;
}

const WIZARD_INITIAL: WizardState = {
  step: 1,
  buyerId: '',
  buyerName: '',
  selectedProductIds: [],
  stage: '첫 제안 진행',
  customName: '',
};

function CreateProjectWizard({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, stage: PipelineStage) => void;
}) {
  const { buyers } = useBuyers();
  const { productEntries } = useAppStore();
  const [wizard, setWizard] = useState<WizardState>(WIZARD_INITIAL);

  const autoName = wizard.buyerName
    ? `${wizard.buyerName} × ${wizard.selectedProductIds.length > 0 ? `${wizard.selectedProductIds.length}개 제품` : '신규 거래'}`
    : '';

  const finalName = wizard.customName.trim() || autoName;

  const toggleProduct = (id: string) => {
    setWizard(w => ({
      ...w,
      selectedProductIds: w.selectedProductIds.includes(id)
        ? w.selectedProductIds.filter(pid => pid !== id)
        : [...w.selectedProductIds, id],
    }));
  };

  const handleFinish = () => {
    if (!finalName) { toast.error('프로젝트 이름을 입력해주세요.'); return; }
    onCreate(finalName, wizard.stage);
  };

  const stepTitles = ['① 바이어 선택', '② 제품 선택', '③ 단계 설정'];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="text-primary">🚀</span> 새 프로젝트 만들기
        </DialogTitle>
        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                wizard.step === s
                  ? 'bg-primary text-primary-foreground'
                  : wizard.step > s
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}>{s}</div>
              <span className={cn(
                'text-xs hidden sm:inline',
                wizard.step === s ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>{stepTitles[s - 1].slice(2)}</span>
              {s < 3 && <div className="w-6 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>
      </DialogHeader>

      {/* Step 1: 바이어 선택 */}
      {wizard.step === 1 && (
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">거래할 바이어를 선택하세요.</p>
          {buyers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">등록된 바이어가 없습니다.</p>
              <p className="text-xs mt-1">마이 데이터에서 바이어를 먼저 등록해주세요.</p>
            </div>
          ) : (
            <ScrollArea className="h-56">
              <div className="space-y-2 pr-2">
                {buyers.map(b => (
                  <div
                    key={b.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      wizard.buyerId === b.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                    onClick={() => setWizard(w => ({ ...w, buyerId: b.id, buyerName: b.company_name }))}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.company_name}</p>
                      <p className="text-xs text-muted-foreground">{getBuyerCountryDisplay(b.country)}</p>
                    </div>
                    {wizard.buyerId === b.id && (
                      <Badge variant="default" className="text-[10px] flex-shrink-0">선택됨</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          {/* Skip option */}
          <p className="text-xs text-muted-foreground text-center">
            바이어 없이 진행하려면{' '}
            <button
              className="text-primary underline underline-offset-2"
              onClick={() => setWizard(w => ({ ...w, buyerId: '', buyerName: '', step: 2 }))}
            >
              건너뛰기
            </button>
          </p>
        </div>
      )}

      {/* Step 2: 제품 선택 */}
      {wizard.step === 2 && (
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">포함할 제품을 선택하세요. (복수 선택 가능)</p>
          {productEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">등록된 제품이 없습니다.</p>
              <p className="text-xs mt-1">마이 데이터에서 제품을 먼저 등록해주세요.</p>
            </div>
          ) : (
            <ScrollArea className="h-52">
              <div className="space-y-2 pr-2">
                {productEntries.map(p => {
                  const isSelected = wizard.selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      )}
                      onClick={() => toggleProduct(p.id)}
                    >
                      {isSelected
                        ? <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
                        : <Square className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      }
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.productName}</p>
                        <p className="text-xs text-muted-foreground">{p.skuCode} · ${p.unitPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          {wizard.selectedProductIds.length > 0 && (
            <p className="text-xs text-primary text-center">{wizard.selectedProductIds.length}개 제품 선택됨</p>
          )}
        </div>
      )}

      {/* Step 3: 단계 + 이름 설정 */}
      {wizard.step === 3 && (
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">시작 단계 선택</p>
            <div className="grid grid-cols-1 gap-2">
              {PIPELINE_STAGES.map(stage => (
                <div
                  key={stage}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                    wizard.stage === stage
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  )}
                  onClick={() => setWizard(w => ({ ...w, stage }))}
                >
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STAGE_HEADER_COLORS[stage])} />
                  {stage}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">프로젝트 이름</p>
            {autoName && (
              <p className="text-xs text-muted-foreground">자동 생성: <span className="text-foreground">{autoName}</span></p>
            )}
            <Input
              placeholder={autoName || '프로젝트 이름 직접 입력'}
              value={wizard.customName}
              onChange={e => setWizard(w => ({ ...w, customName: e.target.value }))}
            />
          </div>
        </div>
      )}

      <DialogFooter className="gap-2">
        {wizard.step > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setWizard(w => ({ ...w, step: (w.step - 1) as 1 | 2 | 3 }))}
          >
            <ChevronLeft className="h-4 w-4" /> 이전
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="mr-auto">취소</Button>
        {wizard.step < 3 ? (
          <Button
            onClick={() => setWizard(w => ({ ...w, step: (w.step + 1) as 1 | 2 | 3 }))}
            disabled={wizard.step === 1 && buyers.length > 0 && !wizard.buyerId}
          >
            다음 <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={!finalName}>
            만들기
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

// ──────────────────────────────────────────────────────────
// Main Export Projects Page
// ──────────────────────────────────────────────────────────
export default function ExportProjectsPage() {
  const { projects, createProject, setActiveProject, deleteProject, updateProjectStage } = useProjectStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateProject = (name: string, stage: PipelineStage) => {
    const id = createProject(name);
    updateProjectStage(id, stage);
    setActiveProject(id);
    setShowCreateDialog(false);
    toast.success('새 프로젝트가 생성되었습니다.');
  };

  const handleCardClick = (project: Project) => {
    setActiveProject(project.id);
    setSelectedProject(project);
  };

  const handleStageChange = (projectId: string, stage: PipelineStage) => {
    updateProjectStage(projectId, stage);
  };

  const handleDelete = (projectId: string) => {
    deleteProject(projectId);
  };

  if (selectedProject) {
    const latestProject = projects.find(p => p.id === selectedProject.id) || selectedProject;
    return <ProjectDetailView project={latestProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">🚀 수출 프로젝트</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              카드를 드래그해서 단계를 변경하거나, 클릭해서 문서를 관리하세요.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> 새 프로젝트
          </Button>
        </div>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-4 p-4 min-w-max">
          {PIPELINE_STAGES.map(stage => {
            const stageProjects = projects.filter(
              p => (p.pipelineStage || '첫 제안 진행') === stage
            );
            return (
              <DropColumn
                key={stage}
                stage={stage}
                projects={stageProjects}
                onCardClick={handleCardClick}
                onStageChange={handleStageChange}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      </div>

      {/* 3-Step Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <CreateProjectWizard
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateProject}
        />
      </Dialog>
    </div>
  );
}
