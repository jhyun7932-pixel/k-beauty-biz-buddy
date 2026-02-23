import React, { useState, useRef } from 'react';
import { Plus, Trash2, Package, Weight, Box, Upload, Loader2, FlaskConical, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export default function ProductListPage() {
  const { productEntries, addProductEntry, removeProductEntry } = useAppStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    category: '',
    skuCode: '',
    hsCode: '',
    unitPrice: 0,
    netWeight: 0,
    qtyPerCarton: 0,
  });

  const handleCategoryChange = (value: string) => {
    const mapped = CATEGORY_HS_MAP[value];
    setForm(prev => ({
      ...prev,
      category: value,
      hsCode: mapped ? mapped.hsCode : prev.hsCode,
    }));
  };
  const [inciText, setInciText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setOcrLoading(true);
    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call ocr-extract edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-extract`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64 }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'OCR 처리에 실패했습니다');
      }

      const data = await response.json();
      const ingredients: string[] = (data.ingredients || []).map((ing: any) => ing.name);

      if (ingredients.length > 0) {
        setInciText(ingredients.join(', '));
        toast.success(`${ingredients.length}개 성분이 추출되었습니다.`);
      } else {
        toast.warning('성분을 추출하지 못했습니다. 직접 입력해주세요.');
      }
    } catch (err: any) {
      console.error('OCR extraction failed:', err);
      toast.error(err.message || 'OCR 추출 중 오류가 발생했습니다.');
    } finally {
      setOcrLoading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOcrClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!form.productName || !form.skuCode) return;
    addProductEntry({ ...form, inciText });

    // Persist INCI data to Supabase product_ingredients table
    if (inciText.trim()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ingredientList = inciText.split(',').map(s => s.trim()).filter(Boolean);
          await supabase.from('product_ingredients').insert({
            user_id: user.id,
            raw_ocr_text: inciText,
            cleaned_ingredient_list: ingredientList,
            inci_mapped_list: ingredientList.map(name => ({ inci: name, mapped: true })),
          });
          toast.success('INCI 데이터가 저장되었습니다.');
        }
      } catch (err) {
        console.error('Failed to save INCI to DB:', err);
      }
    }

    setForm({ productName: '', category: '', skuCode: '', hsCode: '', unitPrice: 0, netWeight: 0, qtyPerCarton: 0 });
    setInciText('');
    setOpen(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product List</h1>
          <p className="text-sm text-muted-foreground mt-1">수출 제품 정보를 등록·관리합니다. 물류 정보는 패킹리스트 자동 계산에 사용됩니다.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {productEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm">등록된 제품이 없습니다.</p>
          <Button variant="link" size="sm" onClick={() => setOpen(true)}>제품 추가하기</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productEntries.map((p) => (
            <Card key={p.id} className="group relative">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">{p.productName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">{p.skuCode}</Badge>
                </div>
                {p.category && CATEGORY_HS_MAP[p.category] && (
                  <Badge variant="secondary" className="text-xs">{CATEGORY_HS_MAP[p.category].label}</Badge>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>HS Code: <span className="text-foreground font-mono">{p.hsCode || '—'}</span></div>
                  <div>Unit Price: <span className="text-foreground">${p.unitPrice.toFixed(2)}</span></div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Weight className="h-3 w-3" /> {p.netWeight}g</div>
                  <div className="flex items-center gap-1"><Box className="h-3 w-3" /> {p.qtyPerCarton}ea/ctn</div>
                </div>
                {p.inciText && (
                  <div className="flex items-center gap-1 text-xs text-primary/80">
                    <FlaskConical className="h-3 w-3" />
                    <span>INCI 등록됨 ({p.inciText.split(',').length}종)</span>
                  </div>
                )}
                <Button variant="ghost" size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-destructive"
                  onClick={() => removeProductEntry(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Add Product Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>제품 추가</DialogTitle>
            <DialogDescription>수출 제품의 기본 정보와 물류 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제품명 (영문) *</Label>
              <Input placeholder="e.g. Hydra Serum 30ml" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            </div>
            <div>
              <Label>뷰티 제품 카테고리 *</Label>
              <Select value={form.category} onValueChange={handleCategoryChange}>
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
                <Label>HS Code {form.category && <span className="text-xs text-muted-foreground ml-1">(자동 매핑됨)</span>}</Label>
                <Input placeholder="e.g. 3304.99" value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} />
              </div>
              <div>
                <Label>SKU Code *</Label>
                <Input placeholder="e.g. HS-001" value={form.skuCode} onChange={(e) => setForm({ ...form, skuCode: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Unit Price (USD)</Label>
              <Input type="number" step="0.01" min="0" value={form.unitPrice || ''} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} />
            </div>

            {/* OCR INCI Section */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">🧪 전성분(INCI) 등록</p>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                onClick={handleOcrClick}
              >
                {ocrLoading ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-primary font-medium">AI OCR 분석 중...</p>
                    <p className="text-xs text-muted-foreground">전성분 라벨을 인식하고 있습니다.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">전성분 라벨 이미지 업로드 (AI OCR)</p>
                    <p className="text-xs text-muted-foreground">클릭하여 이미지를 업로드하면 AI가 INCI를 자동 추출합니다.</p>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <Label className="text-xs">추출된 전성분 (수정 가능)</Label>
                <Textarea
                  rows={3}
                  placeholder="Water, Glycerin, Butylene Glycol, ..."
                  value={inciText}
                  onChange={(e) => setInciText(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">📦 물류 정보 (Packing List 자동 계산용)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>개당 무게 (Net Weight, g)</Label>
                  <Input type="number" step="0.1" min="0" value={form.netWeight || ''} onChange={(e) => setForm({ ...form, netWeight: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>박스당 입수량 (Qty/Carton)</Label>
                  <Input type="number" step="1" min="0" value={form.qtyPerCarton || ''} onChange={(e) => setForm({ ...form, qtyPerCarton: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={!form.productName || !form.skuCode || !form.category}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
