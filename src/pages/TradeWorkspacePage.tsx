import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useBuyers } from '@/hooks/useBuyers';
import type { ProductEntry } from '@/stores/types';
import { COUNTRY_NAMES } from '@/stores/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Trash2, Building2, Calculator, Download, FileText, FileDown, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { ComplianceChecklistPanel } from '@/components/compliance/ComplianceChecklistPanel';

// ─── Line Item ───
interface LineItem {
  productId: string;
  productName: string;
  skuCode: string;
  unitPrice: number;
  netWeight: number;
  qtyPerCarton: number;
  qty: number;
}

interface FormData {
  invoiceNo: string;
  date: string;
  paymentTerms: string;
  incoterms: string;
  shippingMethod: string;
  validity: string;
  remarks: string;
}

const DEFAULT_FORM: FormData = {
  invoiceNo: `INV-${Date.now().toString(36).toUpperCase()}`,
  date: new Date().toISOString().slice(0, 10),
  paymentTerms: 'T/T 30/70',
  incoterms: 'FOB',
  shippingMethod: 'Sea Freight',
  validity: '30 days',
  remarks: '',
};

export default function TradeWorkspacePage() {
  const { productEntries, companyProfile } = useAppStore();
  const { buyers } = useBuyers();
  const { companySettings } = useProjectStore();
  const previewRef = useRef<HTMLDivElement>(null);

  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [docType, setDocType] = useState<string>('PI');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newQty, setNewQty] = useState<number>(100);
  const [downloading, setDownloading] = useState(false);
  const [selectedComplianceProductId, setSelectedComplianceProductId] = useState<string>('');

  const selectedBuyer = buyers.find(b => b.id === selectedBuyerId) || null;
  const selectedComplianceProduct = productEntries.find(p => p.id === selectedComplianceProductId) || null;
  const complianceInci = selectedComplianceProduct?.inciText
    ? selectedComplianceProduct.inciText.split(',').map(s => s.trim()).filter(Boolean)
    : undefined;

  const totals = useMemo(() => {
    let totalAmount = 0, totalNetWeight = 0, totalCartons = 0, totalQty = 0;
    lineItems.forEach(li => {
      totalAmount += li.qty * li.unitPrice;
      totalNetWeight += li.qty * li.netWeight;
      totalCartons += li.qtyPerCarton > 0 ? Math.ceil(li.qty / li.qtyPerCarton) : 0;
      totalQty += li.qty;
    });
    return { totalAmount, totalNetWeight, totalCartons, totalQty };
  }, [lineItems]);

  const handleAddProduct = () => {
    const product = productEntries.find(p => p.id === selectedProductId);
    if (!product || newQty <= 0) return;
    if (lineItems.some(li => li.productId === product.id)) return;
    setLineItems(prev => [...prev, {
      productId: product.id, productName: product.productName, skuCode: product.skuCode,
      unitPrice: product.unitPrice, netWeight: product.netWeight, qtyPerCarton: product.qtyPerCarton, qty: newQty,
    }]);
    setAddProductOpen(false);
    setSelectedProductId('');
    setNewQty(100);
  };

  const removeLineItem = (productId: string) => setLineItems(prev => prev.filter(li => li.productId !== productId));
  const updateQty = (productId: string, qty: number) => setLineItems(prev => prev.map(li => li.productId === productId ? { ...li, qty: Math.max(0, qty) } : li));

  const docTitles: Record<string, string> = {
    PI: 'PROFORMA INVOICE', CONTRACT: 'SALES CONTRACT', CI: 'COMMERCIAL INVOICE', PL: 'PACKING LIST',
  };

  // ─── PDF Download ───
  const handleDownloadPDF = useCallback(async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const element = previewRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
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
      pdf.save(`${docTitles[docType].replace(/\s+/g, '_')}_${form.invoiceNo}.pdf`);
      toast.success('PDF 다운로드 완료');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF 생성에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [docType, form.invoiceNo]);

  // ─── Word Download ───
  const handleDownloadWord = useCallback(async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const htmlContent = previewRef.current.innerHTML;
      const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family:Arial,sans-serif;font-size:11pt;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ccc;padding:4px 8px;font-size:10pt;}</style></head><body>`;
      const postHtml = `</body></html>`;
      const blob = new Blob([preHtml + htmlContent + postHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitles[docType].replace(/\s+/g, '_')}_${form.invoiceNo}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Word 다운로드 완료');
    } catch (err) {
      console.error('Word generation failed:', err);
      toast.error('Word 생성에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  }, [docType, form.invoiceNo]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2 min-w-[240px]">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="바이어 선택" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {buyers.length === 0 ? (
                <SelectItem value="_none" disabled>등록된 바이어 없음</SelectItem>
              ) : buyers.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.company_name} ({b.country})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={docType} onValueChange={setDocType} className="flex-1">
          <TabsList>
            <TabsTrigger value="PI">PI (견적서)</TabsTrigger>
            <TabsTrigger value="CONTRACT">Contract (계약서)</TabsTrigger>
            <TabsTrigger value="CI">CI (송장)</TabsTrigger>
            <TabsTrigger value="PL">PL (패킹리스트)</TabsTrigger>
            <TabsTrigger value="COMPLIANCE" className="gap-1 bg-primary/10 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-3.5 w-3.5" />
              규제/인증
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" className="gap-1.5" onClick={handleDownloadPDF} disabled={downloading}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadWord} disabled={downloading}>
            <FileDown className="h-3.5 w-3.5" /> Word
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {docType === 'COMPLIANCE' ? (
          <div className="flex flex-col h-full w-full">
            {/* Product selector for INCI */}
            <div className="px-4 pt-3 pb-1 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">분석 대상 제품:</Label>
                <Select value={selectedComplianceProductId} onValueChange={setSelectedComplianceProductId}>
                  <SelectTrigger className="h-8 text-sm bg-background max-w-[280px]">
                    <SelectValue placeholder="제품 선택 (INCI 연동)" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {productEntries.length === 0 ? (
                      <SelectItem value="_none" disabled>등록된 제품 없음</SelectItem>
                    ) : productEntries.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.productName} {p.inciText ? '🧪' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ComplianceChecklistPanel
              targetCountries={selectedBuyer ? [selectedBuyer.country] : ['US', 'EU', 'JP']}
              inciIngredients={complianceInci}
              productId={selectedComplianceProductId || undefined}
            />
          </div>
        ) : (
        <>
        {/* LEFT: Form */}
        <div className="w-[400px] border-r border-border overflow-y-auto p-5 space-y-5 bg-card">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">기본 정보</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Invoice No.</Label>
                <Input value={form.invoiceNo} onChange={e => setForm({ ...form, invoiceNo: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Payment Terms</Label>
                <Select value={form.paymentTerms} onValueChange={v => setForm({ ...form, paymentTerms: v })}>
                  <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="T/T 30/70">T/T 30/70</SelectItem>
                    <SelectItem value="T/T 100%">T/T 100%</SelectItem>
                    <SelectItem value="L/C">L/C</SelectItem>
                    <SelectItem value="Escrow">Escrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Incoterms</Label>
                <Select value={form.incoterms} onValueChange={v => setForm({ ...form, incoterms: v })}>
                  <SelectTrigger className="h-8 text-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="DDP">DDP</SelectItem>
                    <SelectItem value="EXW">EXW</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Remarks</Label>
              <Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="비고" className="h-8 text-sm" />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">제품 항목</h3>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAddProductOpen(true)}>
                <Plus className="h-3 w-3" /> 제품 추가
              </Button>
            </div>
            {lineItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">제품을 추가해주세요.</p>
            ) : (
              <div className="space-y-2">
                {lineItems.map(li => (
                  <Card key={li.productId} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{li.productName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{li.skuCode}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeLineItem(li.productId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <Label className="text-[10px]">Qty</Label>
                        <Input type="number" min={1} value={li.qty} onChange={e => updateQty(li.productId, parseInt(e.target.value) || 0)} className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Unit Price</Label>
                        <div className="h-7 flex items-center text-xs text-muted-foreground">${li.unitPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <Label className="text-[10px]">Amount</Label>
                        <div className="h-7 flex items-center text-xs font-semibold text-foreground">${(li.qty * li.unitPrice).toFixed(2)}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-2 bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">자동 계산 결과</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Total Qty:</span>
              <span className="font-semibold text-right">{totals.totalQty.toLocaleString()} EA</span>
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-semibold text-right text-primary">${totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-muted-foreground">Net Weight:</span>
              <span className="font-semibold text-right">{(totals.totalNetWeight / 1000).toFixed(2)} kg</span>
              <span className="text-muted-foreground">Total Cartons:</span>
              <span className="font-semibold text-right">{totals.totalCartons} ctns</span>
            </div>
          </section>
        </div>

        {/* RIGHT: A4 Live Preview */}
        <div className="flex-1 overflow-y-auto bg-secondary/30 p-6 flex justify-center">
          <div className="w-full" style={{ maxWidth: '210mm' }}>
            {/* A4 aspect ratio container */}
            <div
              ref={previewRef}
              contentEditable
              suppressContentEditableWarning
              className="bg-white text-black shadow-lg border border-border rounded"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm 18mm',
                fontSize: '10pt',
                lineHeight: '1.6',
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* Document Title */}
              <div style={{ textAlign: 'center', marginBottom: '18pt' }}>
                <h1 style={{ fontSize: '16pt', fontWeight: 700, letterSpacing: '2px', margin: 0 }}>{docTitles[docType]}</h1>
                <p style={{ fontSize: '9pt', color: '#666', marginTop: '4pt' }}>No. {form.invoiceNo} &nbsp;|&nbsp; Date: {form.date}</p>
              </div>

              {/* From / To */}
              <div style={{ display: 'flex', gap: '24pt', marginBottom: '16pt', fontSize: '9pt' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: '4pt', fontSize: '8pt' }}>From (Seller)</p>
                  <p style={{ fontWeight: 600 }}>{companyProfile.companyName}</p>
                  <p>{companyProfile.address}</p>
                  <p>{companyProfile.phone}</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: '4pt', fontSize: '8pt' }}>To (Buyer)</p>
                  {selectedBuyer ? (
                    <>
                      <p style={{ fontWeight: 600 }}>{selectedBuyer.company_name || selectedBuyer.name}</p>
                      <p>{selectedBuyer.notes}</p>
                      {selectedBuyer.contact_name && <p>Attn: {selectedBuyer.contact_name}</p>}
                      <p>{selectedBuyer.contact_phone}</p>
                      <p>{selectedBuyer.contact_email}</p>
                    </>
                  ) : (
                    <p style={{ color: '#aaa', fontStyle: 'italic' }}>바이어를 선택하세요</p>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div style={{ fontSize: '9pt', color: '#666', marginBottom: '12pt', display: 'flex', gap: '24pt' }}>
                <span>Payment: <strong style={{ color: '#000' }}>{form.paymentTerms}</strong></span>
                <span>Incoterms: <strong style={{ color: '#000' }}>{form.incoterms}</strong></span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '12pt 0' }} />

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                    <th style={{ padding: '6pt 4pt' }}>No.</th>
                    <th style={{ padding: '6pt 4pt' }}>Description</th>
                    <th style={{ padding: '6pt 4pt' }}>SKU</th>
                    <th style={{ padding: '6pt 4pt', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '6pt 4pt', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '6pt 4pt', textAlign: 'right' }}>Amount</th>
                    {docType === 'PL' && (
                      <>
                        <th style={{ padding: '6pt 4pt', textAlign: 'right' }}>N.W.(kg)</th>
                        <th style={{ padding: '6pt 4pt', textAlign: 'right' }}>Ctns</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, idx) => (
                    <tr key={li.productId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6pt 4pt' }}>{idx + 1}</td>
                      <td style={{ padding: '6pt 4pt', fontWeight: 500 }}>{li.productName}</td>
                      <td style={{ padding: '6pt 4pt', fontFamily: 'monospace', color: '#666' }}>{li.skuCode}</td>
                      <td style={{ padding: '6pt 4pt', textAlign: 'right' }}>{li.qty.toLocaleString()}</td>
                      <td style={{ padding: '6pt 4pt', textAlign: 'right' }}>${li.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '6pt 4pt', textAlign: 'right', fontWeight: 600 }}>${(li.qty * li.unitPrice).toFixed(2)}</td>
                      {docType === 'PL' && (
                        <>
                          <td style={{ padding: '6pt 4pt', textAlign: 'right' }}>{((li.qty * li.netWeight) / 1000).toFixed(2)}</td>
                          <td style={{ padding: '6pt 4pt', textAlign: 'right' }}>{li.qtyPerCarton > 0 ? Math.ceil(li.qty / li.qtyPerCarton) : '—'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={docType === 'PL' ? 8 : 6} style={{ padding: '24pt', textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>
                        제품을 추가하면 여기에 표시됩니다.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #333', fontWeight: 700 }}>
                    <td colSpan={3} style={{ padding: '6pt 4pt', textAlign: 'right' }}>TOTAL</td>
                    <td style={{ padding: '6pt 4pt', textAlign: 'right' }}>{totals.totalQty.toLocaleString()}</td>
                    <td style={{ padding: '6pt 4pt' }} />
                    <td style={{ padding: '6pt 4pt', textAlign: 'right', color: '#2F6BFF' }}>
                      ${totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    {docType === 'PL' && (
                      <>
                        <td style={{ padding: '6pt 4pt', textAlign: 'right' }}>{(totals.totalNetWeight / 1000).toFixed(2)}</td>
                        <td style={{ padding: '6pt 4pt', textAlign: 'right' }}>{totals.totalCartons}</td>
                      </>
                    )}
                  </tr>
                </tfoot>
              </table>

              {/* Contract terms */}
              {docType === 'CONTRACT' && (
                <div style={{ marginTop: '18pt', fontSize: '8.5pt', color: '#555' }}>
                  <h4 style={{ fontWeight: 600, color: '#000', fontSize: '9pt', marginBottom: '6pt' }}>Terms & Conditions</h4>
                  <p>1. Quality: Products shall conform to the specifications agreed upon by both parties.</p>
                  <p>2. Shipping: Seller shall arrange shipment within 14 working days after receipt of payment.</p>
                  <p>3. Insurance: To be covered by the Buyer under {form.incoterms} terms.</p>
                  <p>4. Claims: Any claim regarding quality must be raised within 30 days of receipt.</p>
                  <p>5. Force Majeure: Neither party shall be liable for delays caused by events beyond their control.</p>
                  <p>6. Governing Law: This contract shall be governed by the laws of the Republic of Korea.</p>
                </div>
              )}

              {/* Remarks */}
              {form.remarks && (
                <div style={{ marginTop: '12pt', fontSize: '9pt' }}>
                  <strong>Remarks:</strong> {form.remarks}
                </div>
              )}

              {/* Signature Block with Stamp */}
              <div style={{ display: 'flex', gap: '24pt', marginTop: '48pt', fontSize: '9pt' }}>
                <div style={{ flex: 1, borderTop: '1px solid #ccc', paddingTop: '8pt' }}>
                  <p style={{ fontWeight: 600 }}>Seller</p>
                  <p style={{ color: '#666' }}>{companyProfile.companyName}</p>
                  {/* Stamp overlay */}
                  <div style={{ position: 'relative', height: '60px', marginTop: '8pt' }}>
                    {(companySettings.stampImageUrl || companyProfile.stampImageUrl) && (
                      <img
                        src={companySettings.stampImageUrl || companyProfile.stampImageUrl}
                        alt="Company Stamp"
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: 0,
                          width: '80px',
                          height: '80px',
                          objectFit: 'contain',
                          opacity: 0.85,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, borderTop: '1px solid #ccc', paddingTop: '8pt' }}>
                  <p style={{ fontWeight: 600 }}>Buyer</p>
                  <p style={{ color: '#666' }}>{selectedBuyer?.companyName || '—'}</p>
                  <div style={{ height: '60px', marginTop: '8pt' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>제품 추가</DialogTitle>
            <DialogDescription>등록된 제품을 선택하고 수량을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제품 선택</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="제품 선택" /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {productEntries.filter(p => !lineItems.some(li => li.productId === p.id)).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.productName} ({p.skuCode}) — ${p.unitPrice}</SelectItem>
                  ))}
                  {productEntries.length === 0 && <SelectItem value="_none" disabled>등록된 제품 없음</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>수량 (Qty)</Label>
              <Input type="number" min={1} value={newQty} onChange={e => setNewQty(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductOpen(false)}>취소</Button>
            <Button onClick={handleAddProduct} disabled={!selectedProductId || newQty <= 0}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
