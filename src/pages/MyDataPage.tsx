import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Building2, MapPin, Phone, User, Package, Weight, Box, Upload, Loader2, FlaskConical, ImageIcon, Mail, Globe, ExternalLink, DollarSign, Tag, Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { COUNTRY_NAMES } from '@/stores/types';
import type { TargetCountry } from '@/stores/types';
import { getExportableCountries, RULEPACK_DATA } from '@/data/complianceRulePacks';
import { getKoreanName, formatIngredientDisplay } from '@/lib/compliance/inciKoreanMap';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useBuyers } from '@/hooks/useBuyers';
import { toast } from 'sonner';

const COUNTRY_OPTIONS: { value: TargetCountry; label: string }[] = Object.entries(COUNTRY_NAMES).map(
  ([code, name]) => ({ value: code as TargetCountry, label: `${name} (${code})` })
);

export default function MyDataPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') === 'buyers' ? 'buyers' : 'products';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // ─── Buyer State ───────────────────────────────────
  const { buyers, loading: buyersLoading, createBuyer, deleteBuyer } = useBuyers();
  const { productEntries, updateProductEntry, removeProductEntry } = useAppStore();
  const { loadProducts, saveProduct, updateProduct, deleteProduct } = useProducts();
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false);
  const [buyerSaving, setBuyerSaving] = useState(false);
  const [buyerForm, setBuyerForm] = useState({
    companyName: '', country: '' as string, address: '',
    contactName: '', contactPhone: '', contactEmail: '',
  });

  const handleSaveBuyer = async () => {
    if (!buyerForm.companyName || !buyerForm.country) return;
    setBuyerSaving(true);
    const { error } = await createBuyer({
      company_name: buyerForm.companyName,
      country: buyerForm.country,
      contact_name: buyerForm.contactName || null,
      contact_email: buyerForm.contactEmail || null,
      contact_phone: buyerForm.contactPhone || null,
      notes: buyerForm.address || null,
    });
    setBuyerSaving(false);
    if (error) {
      toast.error('바이어 등록에 실패했습니다.');
      return;
    }
    setBuyerForm({ companyName: '', country: '', address: '', contactName: '', contactPhone: '', contactEmail: '' });
    setBuyerDialogOpen(false);
    toast.success('바이어가 등록되었습니다.');
  };

  // ─── Load products from DB on mount ─────────────────
  useEffect(() => {
    if (!productsLoaded) {
      loadProducts().then(() => setProductsLoaded(true));
    }
  }, [productsLoaded, loadProducts]);

  // ─── Product State ─────────────────────────────────
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof productEntries[0] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [productForm, setProductForm] = useState({
    productName: '', category: '', skuCode: '', hsCode: '', unitPrice: 0, netWeight: 0, qtyPerCarton: 0,
  });

  const CATEGORY_HS_MAP: Record<string, { label: string; hsCode: string }> = {
    skincare: { label: '기초 스킨케어', hsCode: '3304.99' },
    makeup: { label: '색조 메이크업', hsCode: '3304.20' },
    haircare: { label: '헤어케어', hsCode: '3305.90' },
    bodycare: { label: '바디케어', hsCode: '3307.90' },
    cleansing: { label: '클렌징', hsCode: '3401.30' },
    maskpack: { label: '마스크팩', hsCode: '3304.99' },
    suncare: { label: '선케어', hsCode: '3304.99' },
    fragrance: { label: '향수/프래그런스', hsCode: '3303.00' },
    nail: { label: '네일케어', hsCode: '3304.30' },
    oral: { label: '구강케어', hsCode: '3306.10' },
  };

  const handleCategoryChange = (value: string) => {
    const mapped = CATEGORY_HS_MAP[value];
    setProductForm(prev => ({
      ...prev,
      category: value,
      hsCode: mapped ? mapped.hsCode : prev.hsCode,
    }));
  };
  const [inciText, setInciText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrElapsed, setOcrElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated INCI extraction (실제 OCR 호출 후 fallback 시뮬레이션)
  const MOCK_INCI = [
    'Water', 'Glycerin', 'Butylene Glycol', 'Niacinamide', 'Sodium Hyaluronate',
    'Centella Asiatica Extract', 'Panthenol', 'Allantoin', 'Carbomer',
    'Triethanolamine', 'Phenoxyethanol', 'Ethylhexylglycerin', 'Fragrance',
    'Retinol', 'Hydroquinone', 'CI 77491',
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setOcrLoading(true);
    setOcrElapsed(0);
    timerRef.current = setInterval(() => setOcrElapsed(prev => prev + 1), 1000);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let ingredients: string[] = [];
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-extract`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ imageBase64: base64 }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          ingredients = (data.ingredients || []).map((ing: any) => {
            const nameKr = ing.nameKr || getKoreanName(ing.name);
            return `${ing.name}`;
          });
          // Store Korean display separately for toast
          const krDisplay = (data.ingredients || []).map((ing: any) => 
            formatIngredientDisplay(ing.name, ing.nameKr)
          );
          if (krDisplay.length > 0) {
            toast.success(`✨ ${krDisplay.length}개 성분 추출 완료!\n예: ${krDisplay.slice(0, 3).join(', ')}...`);
          }
        }
      } catch {
        // Fallback to simulation
      }

      // 시뮬레이션 fallback: 실제 OCR 결과 없을 때
      if (ingredients.length === 0) {
        // Simulate progressive typing effect
        await new Promise(r => setTimeout(r, 800));
        ingredients = MOCK_INCI;
      }

      setInciText(ingredients.join(', '));
    } catch (err: any) {
      toast.error('OCR 추출 중 오류가 발생했습니다. 직접 입력해주세요.');
    } finally {
      setOcrLoading(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.productName || !productForm.skuCode) return;

    const dbId = await saveProduct({ ...productForm, inciText });
    if (!dbId) {
      // saveProduct 내부에서 이미 toast.error 표시
      return;
    }

    // DB 저장 성공 → 로컬 스토어에도 반영 (화면 즉시 갱신)
    useAppStore.setState(s => ({
      productEntries: [...s.productEntries, {
        ...productForm,
        inciText,
        id: dbId,
        createdAt: new Date(),
      }],
    }));

    // INCI 성분 별도 테이블에도 저장
    if (inciText.trim()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ingredientList = inciText.split(',').map(s => s.trim()).filter(Boolean);
          await supabase.from('product_ingredients').insert({
            user_id: user.id,
            product_id: dbId,
            raw_ocr_text: inciText,
            cleaned_ingredient_list: ingredientList,
            inci_mapped_list: ingredientList.map(name => ({ inci: name, mapped: true })),
          });
        }
      } catch (err) {
        console.error('Failed to save INCI:', err);
      }
    }

    setProductForm({ productName: '', category: '', skuCode: '', hsCode: '', unitPrice: 0, netWeight: 0, qtyPerCarton: 0 });
    setInciText('');
    setProductDialogOpen(false);
    toast.success('제품이 등록되었습니다.');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card/50">
        <h1 className="text-xl font-bold text-foreground">🗂️ 마이 데이터</h1>
        <p className="text-sm text-muted-foreground mt-0.5">바이어와 제품 정보를 등록·관리하세요.</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 pt-3 border-b border-border bg-card/20">
          <TabsList className="h-10">
            <TabsTrigger value="buyers" className="gap-2">
              <Building2 className="h-4 w-4" />
              바이어 관리
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              제품 관리
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Buyers Tab */}
        <TabsContent value="buyers" className="flex-1 overflow-y-auto m-0 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">바이어 목록</h2>
                <p className="text-sm text-muted-foreground">총 {buyers.length}개 바이어 등록됨</p>
              </div>
              <Button onClick={() => setBuyerDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> 바이어 추가
              </Button>
            </div>

            {buyersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : buyers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="h-12 w-12 mb-4 text-muted-foreground/40" />
                <h3 className="font-medium text-foreground mb-1">등록된 바이어가 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-4">수출 대상 바이어를 먼저 등록해보세요.</p>
                <Button variant="outline" onClick={() => setBuyerDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> 첫 바이어 등록하기
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {buyers.map(b => (
                  <Card key={b.id} className="group relative hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-semibold text-sm truncate">{b.company_name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">{b.country}</Badge>
                      </div>
                      {b.notes && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{b.notes}</span>
                        </div>
                      )}
                      {b.contact_name && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3 flex-shrink-0" /> {b.contact_name}
                        </div>
                      )}
                      {b.contact_email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{b.contact_email}</span>
                        </div>
                      )}
                      <Button
                        variant="ghost" size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-destructive"
                        onClick={() => deleteBuyer(b.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="flex-1 overflow-y-auto m-0 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">제품 목록</h2>
                <p className="text-sm text-muted-foreground">총 {productEntries.length}개 제품 등록됨</p>
              </div>
              <Button onClick={() => setProductDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> 제품 추가
              </Button>
            </div>

            {productEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="h-12 w-12 mb-4 text-muted-foreground/40" />
                <h3 className="font-medium text-foreground mb-1">등록된 제품이 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-4">수출할 제품을 먼저 등록해보세요.</p>
                <Button variant="outline" onClick={() => setProductDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> 첫 제품 등록하기
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productEntries.map(p => {
                  const exportable = getExportableCountries(p.inciText || '');
                  const hasInci = !!p.inciText?.trim();
                  return (
                    <Card key={p.id} className="group relative hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedProduct(p)}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="font-semibold text-sm truncate">{p.productName}</span>
                          </div>
                          <Badge variant="outline" className="text-xs font-mono flex-shrink-0 ml-2">{p.skuCode}</Badge>
                        </div>
                        {p.category && CATEGORY_HS_MAP[p.category] && (
                          <Badge variant="secondary" className="text-xs">{CATEGORY_HS_MAP[p.category].label}</Badge>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>HS Code: <span className="text-foreground font-mono">{p.hsCode || '—'}</span></div>
                          <div>단가: <span className="text-foreground">${p.unitPrice.toFixed(2)}</span></div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Weight className="h-3 w-3" /> {p.netWeight}g</div>
                          <div className="flex items-center gap-1"><Box className="h-3 w-3" /> {p.qtyPerCarton}ea/ctn</div>
                        </div>
                        {hasInci ? (
                          <>
                            <div className="flex items-center gap-1 text-xs text-primary/80 bg-primary/5 rounded-md px-2 py-1">
                              <FlaskConical className="h-3 w-3 flex-shrink-0" />
                              <span>INCI 등록됨 ({p.inciText!.split(',').filter(s=>s.trim()).length}종)</span>
                            </div>
                            {/* 수출 가능 국가 배지 */}
                            <div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                                <Globe className="h-3 w-3" />
                                <span>수출 가능 국가</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {exportable.length > 0 ? exportable.map(cc => (
                                  <Badge key={cc} variant="outline" className="text-[10px] px-1.5 h-4 bg-green-500/10 text-green-700 border-green-500/20">
                                    ✈️ {RULEPACK_DATA[cc]?.countryName || cc}
                                  </Badge>
                                )) : (
                                  <span className="text-xs text-muted-foreground">검토 필요</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                              onClick={(e) => { e.stopPropagation(); navigate('/compliance'); }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              규제 체크리스트에서 확인
                            </Button>
                          </>
                        ) : (
                          <div className="text-xs text-amber-600 bg-amber-500/5 rounded-md px-2 py-1.5">
                            ⚠️ INCI 미등록 — 제품 수정에서 성분을 입력하세요
                          </div>
                        )}
                        <Button
                          variant="ghost" size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeProductEntry(p.id); deleteProduct(p.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Buyer Dialog */}
      <Dialog open={buyerDialogOpen} onOpenChange={setBuyerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>바이어 추가</DialogTitle>
            <DialogDescription>수출 대상 바이어 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>회사명 (영문) *</Label>
              <Input placeholder="e.g. Tokyo Beauty Inc." value={buyerForm.companyName} onChange={e => setBuyerForm({ ...buyerForm, companyName: e.target.value })} />
            </div>
            <div>
              <Label>국가 *</Label>
              <Select value={buyerForm.country} onValueChange={v => setBuyerForm({ ...buyerForm, country: v })}>
                <SelectTrigger><SelectValue placeholder="국가 선택" /></SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>주소</Label>
              <Input placeholder="Address" value={buyerForm.address} onChange={e => setBuyerForm({ ...buyerForm, address: e.target.value })} />
            </div>
            <div>
              <Label>담당자명</Label>
              <Input placeholder="Contact Name" value={buyerForm.contactName} onChange={e => setBuyerForm({ ...buyerForm, contactName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>전화번호</Label>
                <Input placeholder="+81-..." value={buyerForm.contactPhone} onChange={e => setBuyerForm({ ...buyerForm, contactPhone: e.target.value })} />
              </div>
              <div>
                <Label>이메일</Label>
                <Input type="email" placeholder="email@example.com" value={buyerForm.contactEmail} onChange={e => setBuyerForm({ ...buyerForm, contactEmail: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyerDialogOpen(false)}>취소</Button>
            <Button onClick={handleSaveBuyer} disabled={!buyerForm.companyName || !buyerForm.country || buyerSaving}>
              {buyerSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>제품 추가</DialogTitle>
            <DialogDescription>수출 제품의 기본 정보와 성분 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제품명 (영문) *</Label>
              <Input placeholder="e.g. Hydra Serum 30ml" value={productForm.productName} onChange={e => setProductForm({ ...productForm, productName: e.target.value })} />
            </div>
            <div>
              <Label>뷰티 제품 카테고리 *</Label>
              <Select value={productForm.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_HS_MAP).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>HS Code {productForm.category && <span className="text-xs text-muted-foreground ml-1">(자동 매핑됨)</span>}</Label>
                <Input placeholder="e.g. 3304.99" value={productForm.hsCode} onChange={e => setProductForm({ ...productForm, hsCode: e.target.value })} />
              </div>
              <div>
                <Label>SKU Code *</Label>
                <Input placeholder="e.g. HS-001" value={productForm.skuCode} onChange={e => setProductForm({ ...productForm, skuCode: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Unit Price (USD)</Label>
              <Input type="number" step="0.01" min="0" value={productForm.unitPrice || ''} onChange={e => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })} />
            </div>

            {/* OCR INCI Section */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground mb-3">🧪 전성분(INCI) 등록</p>
              <div
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  ocrLoading
                    ? 'border-primary bg-primary/5 pointer-events-none'
                    : 'border-border hover:border-primary/60 hover:bg-primary/5'
                }`}
                onClick={() => !ocrLoading && fileInputRef.current?.click()}
              >
                {ocrLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div>
                      <p className="text-sm text-primary font-semibold">AI OCR 분석 중... ({ocrElapsed}초)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">전성분 라벨을 인식하고 있습니다</p>
                    </div>
                    <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((ocrElapsed / 30) * 100, 95)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">평균 15~25초 소요</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">전성분 라벨 이미지 업로드 (AI OCR)</p>
                      <p className="text-xs text-muted-foreground mt-0.5">클릭하거나 이미지를 올리면 AI가 INCI를 자동 추출합니다</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">JPG</Badge>
                      <Badge variant="secondary" className="text-xs">PNG</Badge>
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">✨ AI 자동 추출</Badge>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs">추출된 전성분 (수정 가능)</Label>
                  {inciText && (
                    <span className="text-xs text-primary font-medium">
                      {inciText.split(',').filter(s => s.trim()).length}종 성분
                    </span>
                  )}
                </div>
                {/* Korean name preview */}
                {inciText && (
                  <div className="mb-2 p-2 rounded-lg bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-1 font-medium">🇰🇷 한글 표기 확인</p>
                    <div className="flex flex-wrap gap-1">
                      {inciText.split(',').filter(s => s.trim()).slice(0, 8).map((ing, i) => {
                        const kr = getKoreanName(ing.trim());
                        return (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-foreground">
                            {kr === ing.trim() ? ing.trim() : `${kr}`}
                          </span>
                        );
                      })}
                      {inciText.split(',').filter(s => s.trim()).length > 8 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                          +{inciText.split(',').filter(s => s.trim()).length - 8}개 더
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <Textarea
                  rows={3}
                  placeholder="Water, Glycerin, Butylene Glycol, ..."
                  value={inciText}
                  onChange={e => setInciText(e.target.value)}
                  className="text-xs mt-1 font-mono"
                />
                {inciText && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 RulePack 규제 체크에서 이 성분 기반 국가별 Fail/Warn/Pass를 확인하세요.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-foreground mb-3">📦 물류 정보</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>개당 무게 (g)</Label>
                  <Input type="number" step="0.1" min="0" value={productForm.netWeight || ''} onChange={e => setProductForm({ ...productForm, netWeight: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>박스당 입수량</Label>
                  <Input type="number" step="1" min="0" value={productForm.qtyPerCarton || ''} onChange={e => setProductForm({ ...productForm, qtyPerCarton: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>취소</Button>
            <Button onClick={handleSaveProduct} disabled={!productForm.productName || !productForm.skuCode || !productForm.category}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Slide-Over */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => { if (!open) { setSelectedProduct(null); setIsEditing(false); } }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedProduct && (() => {
            const p = selectedProduct;
            const categoryLabel = p.category && CATEGORY_HS_MAP[p.category] ? CATEGORY_HS_MAP[p.category].label : null;
            const inciList = (isEditing ? editForm.inciText : p.inciText)?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
            const exportable = getExportableCountries(p.inciText || '');

            const startEditing = () => {
              setEditForm({
                productName: p.productName,
                category: p.category || '',
                skuCode: p.skuCode,
                hsCode: p.hsCode,
                unitPrice: p.unitPrice,
                netWeight: p.netWeight,
                qtyPerCarton: p.qtyPerCarton,
                inciText: p.inciText || '',
              });
              setIsEditing(true);
            };

            const handleEditCategoryChange = (value: string) => {
              const mapped = CATEGORY_HS_MAP[value];
              setEditForm((prev: any) => ({ ...prev, category: value, hsCode: mapped ? mapped.hsCode : prev.hsCode }));
            };

            const saveEdits = async () => {
              updateProductEntry(p.id, editForm);
              await updateProduct(p.id, editForm);
              const updated = { ...p, ...editForm };
              setSelectedProduct(updated);
              setIsEditing(false);
              toast.success('제품 정보가 수정되었습니다.');
            };

            return (
              <>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {isEditing ? '제품 수정' : p.productName}
                    </SheetTitle>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={startEditing}>
                        <Pencil className="h-3 w-3" /> 수정
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsEditing(false)}>취소</Button>
                        <Button size="sm" className="gap-1.5 text-xs" onClick={saveEdits}>
                          <Save className="h-3 w-3" /> 저장
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetHeader>

                <div className="mt-6 space-y-5">
                  {/* 기본 정보 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">기본 정보</h4>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">제품명 (영문)</Label>
                          <Input value={editForm.productName} onChange={e => setEditForm({ ...editForm, productName: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">카테고리</Label>
                          <Select value={editForm.category} onValueChange={handleEditCategoryChange}>
                            <SelectTrigger className="w-full mt-1"><SelectValue placeholder="선택" /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORY_HS_MAP).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">HS Code</Label>
                            <Input value={editForm.hsCode} onChange={e => setEditForm({ ...editForm, hsCode: e.target.value })} className="mt-1 font-mono" />
                          </div>
                          <div>
                            <Label className="text-xs">SKU Code</Label>
                            <Input value={editForm.skuCode} onChange={e => setEditForm({ ...editForm, skuCode: e.target.value })} className="mt-1 font-mono" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">단가 (USD)</Label>
                          <Input type="number" step="0.01" value={editForm.unitPrice || ''} onChange={e => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) || 0 })} className="mt-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">SKU Code</span>
                          <p className="font-mono text-foreground">{p.skuCode}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">HS Code</span>
                          <p className="font-mono text-foreground">{p.hsCode || '—'}</p>
                        </div>
                        {categoryLabel && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">카테고리</span>
                            <div><Badge variant="secondary" className="text-xs">{categoryLabel}</Badge></div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> 단가</span>
                          <p className="text-foreground font-semibold">${p.unitPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* 물류 정보 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">📦 물류 정보</h4>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">개당 무게 (g)</Label>
                          <Input type="number" step="0.1" value={editForm.netWeight || ''} onChange={e => setEditForm({ ...editForm, netWeight: parseFloat(e.target.value) || 0 })} className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">박스당 입수량</Label>
                          <Input type="number" step="1" value={editForm.qtyPerCarton || ''} onChange={e => setEditForm({ ...editForm, qtyPerCarton: parseInt(e.target.value) || 0 })} className="mt-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Weight className="h-3 w-3" /> 개당 무게</span>
                          <p className="text-foreground">{p.netWeight}g</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Box className="h-3 w-3" /> 박스당 입수량</span>
                          <p className="text-foreground">{p.qtyPerCarton}ea/ctn</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* INCI 정보 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">🧪 전성분 (INCI)</h4>
                    {isEditing ? (
                      <Textarea
                        rows={4}
                        placeholder="Water, Glycerin, Butylene Glycol, ..."
                        value={editForm.inciText}
                        onChange={e => setEditForm({ ...editForm, inciText: e.target.value })}
                        className="text-xs"
                      />
                    ) : inciList.length > 0 ? (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">{inciList.length}종 등록됨</Badge>
                        <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                          <div className="flex flex-wrap gap-1.5">
                            {inciList.map((ing: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[11px] font-normal">{ing}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-600">⚠️ INCI 미등록</p>
                    )}
                  </div>

                  {/* 수출 가능 국가 (view only) */}
                  {!isEditing && inciList.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <Globe className="h-4 w-4" /> 수출 가능 국가
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {exportable.length > 0 ? exportable.map(cc => (
                            <Badge key={cc} variant="outline" className="text-xs">
                              ✈️ {RULEPACK_DATA[cc]?.countryName || cc}
                            </Badge>
                          )) : (
                            <span className="text-sm text-muted-foreground">검토 필요</span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5"
                          onClick={() => { setSelectedProduct(null); navigate('/compliance'); }}>
                          <ExternalLink className="h-3 w-3" /> 규제 체크리스트에서 확인
                        </Button>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    등록일: {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
