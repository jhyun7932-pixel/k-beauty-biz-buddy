import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompany, type Company } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  CreditCard,
  Upload,
  Package,
  Clock
} from 'lucide-react';

interface CompanyFormModalProps {
  open: boolean;
  onClose: () => void;
}

export function CompanyFormModal({ open, onClose }: CompanyFormModalProps) {
  const { company, createCompany, updateCompany, uploadLogo, loading } = useCompany();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Company>>({
    name: company?.name || '',
    contact_email: company?.contact_email || '',
    contact_phone: company?.contact_phone || '',
    address: company?.address || '',
    website: company?.website || '',
    logo_url: company?.logo_url || '',
    bank_name: company?.bank_name || '',
    bank_account: company?.bank_account || '',
    bank_swift: company?.bank_swift || '',
    default_moq: company?.default_moq || 500,
    default_lead_time: company?.default_lead_time || 20,
    default_incoterms: company?.default_incoterms || 'FOB',
    default_payment_terms: company?.default_payment_terms || 'T/T 30/70',
  });

  // company가 변경되면 formData 업데이트
  React.useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || '',
        address: company.address || '',
        website: company.website || '',
        logo_url: company.logo_url || '',
        bank_name: company.bank_name || '',
        bank_account: company.bank_account || '',
        bank_swift: company.bank_swift || '',
        default_moq: company.default_moq,
        default_lead_time: company.default_lead_time,
        default_incoterms: company.default_incoterms,
        default_payment_terms: company.default_payment_terms,
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      toast({
        title: '이미지 파일만 업로드 가능합니다',
        variant: 'destructive',
      });
      return;
    }

    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '파일 크기는 5MB 이하여야 합니다',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);
    const result = await uploadLogo(file);
    setUploadingLogo(false);

    if (result.error) {
      toast({
        title: '로고 업로드 실패',
        description: result.error.message,
        variant: 'destructive',
      });
    } else if (result.data) {
      setFormData(prev => ({ ...prev, logo_url: result.data!.url }));
      toast({
        title: '로고가 업로드되었습니다',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: '회사명을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const result = company
      ? await updateCompany(formData)
      : await createCompany(formData as Company);

    setSubmitting(false);

    if (result.error) {
      toast({
        title: '저장 실패',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: company ? '회사 정보가 수정되었습니다' : '회사 정보가 저장되었습니다',
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            회사 정보 설정
          </DialogTitle>
          <DialogDescription>
            회사 정보는 PI, 계약서, 바이어 패키지 등 모든 문서에 자동 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              기본 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 로고 업로드 */}
              <div className="space-y-2 md:col-span-2">
                <Label>회사 로고</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <img 
                      src={formData.logo_url} 
                      alt="Company logo" 
                      className="h-16 w-16 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      로고 업로드
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG (최대 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">회사명 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="글로우스킨 코스메틱"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">웹사이트</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    placeholder="www.example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">대표 이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={handleChange}
                    placeholder="export@company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">대표 전화</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone || ''}
                    onChange={handleChange}
                    placeholder="+82-2-1234-5678"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">주소</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    placeholder="서울특별시 강남구 테헤란로 123"
                    className="pl-10 min-h-[60px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 은행 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              은행 정보 (PI/계약서용)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">은행명</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleChange}
                  placeholder="Shinhan Bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">계좌번호</Label>
                <Input
                  id="bank_account"
                  name="bank_account"
                  value={formData.bank_account || ''}
                  onChange={handleChange}
                  placeholder="110-123-456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_swift">SWIFT 코드</Label>
                <Input
                  id="bank_swift"
                  name="bank_swift"
                  value={formData.bank_swift || ''}
                  onChange={handleChange}
                  placeholder="SHBKKRSE"
                />
              </div>
            </div>
          </div>

          {/* 기본 거래 조건 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              기본 거래 조건
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_moq">기본 MOQ</Label>
                <Input
                  id="default_moq"
                  name="default_moq"
                  type="number"
                  value={formData.default_moq || 500}
                  onChange={handleChange}
                  placeholder="500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_lead_time">리드타임 (일)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="default_lead_time"
                    name="default_lead_time"
                    type="number"
                    value={formData.default_lead_time || 20}
                    onChange={handleChange}
                    placeholder="20"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_incoterms">인코텀즈</Label>
                <Input
                  id="default_incoterms"
                  name="default_incoterms"
                  value={formData.default_incoterms || 'FOB'}
                  onChange={handleChange}
                  placeholder="FOB"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_payment_terms">결제 조건</Label>
                <Input
                  id="default_payment_terms"
                  name="default_payment_terms"
                  value={formData.default_payment_terms || 'T/T 30/70'}
                  onChange={handleChange}
                  placeholder="T/T 30/70"
                />
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {company ? '수정' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
