import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBuyers, type Buyer } from '@/hooks/useBuyers';
import { useToast } from '@/hooks/use-toast';
import { BUYER_COUNTRY_OPTIONS } from '@/lib/countryFlags';
import {
  Loader2,
  UserPlus,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Store
} from 'lucide-react';

interface BuyerFormModalProps {
  open: boolean;
  onClose: () => void;
  buyer?: Buyer | null; // 수정 모드일 때
  onSuccess?: () => void; // 성공 콜백
}

const CHANNELS = [
  { value: 'distributor', label: '유통/도매' },
  { value: 'retail', label: '리테일(오프라인)' },
  { value: 'online_market', label: '온라인 마켓' },
  { value: 'd2c', label: 'D2C' },
];

const BUYER_TYPES = [
  { value: 'importer', label: '수입사' },
  { value: 'distributor', label: '유통사' },
  { value: 'retailer', label: '리테일러' },
  { value: 'reseller', label: '마켓 셀러' },
];

export function BuyerFormModal({ open, onClose, buyer, onSuccess }: BuyerFormModalProps) {
  const { createBuyer, updateBuyer } = useBuyers();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: buyer?.name || '',
    country: buyer?.country || '',
    company_name: buyer?.company_name || '',
    contact_name: buyer?.contact_name || '',
    contact_email: buyer?.contact_email || '',
    contact_phone: buyer?.contact_phone || '',
    website: buyer?.website || '',
    channel: buyer?.channel || '',
    buyer_type: buyer?.buyer_type || '',
    notes: buyer?.notes || '',
  });

  // buyer가 변경되면 formData 업데이트
  React.useEffect(() => {
    if (buyer) {
      setFormData({
        name: buyer.name,
        country: buyer.country,
        company_name: buyer.company_name || '',
        contact_name: buyer.contact_name || '',
        contact_email: buyer.contact_email || '',
        contact_phone: buyer.contact_phone || '',
        website: buyer.website || '',
        channel: buyer.channel || '',
        buyer_type: buyer.buyer_type || '',
        notes: buyer.notes || '',
      });
    } else {
      setFormData({
        name: '',
        country: '',
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        channel: '',
        buyer_type: '',
        notes: '',
      });
    }
  }, [buyer, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: '바이어명을 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.country) {
      toast({
        title: '국가를 선택해주세요',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const result = buyer
      ? await updateBuyer(buyer.id, formData)
      : await createBuyer(formData as { name: string; country: string });

    setSubmitting(false);

    if (result.error) {
      toast({
        title: '저장 실패',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: buyer ? '바이어 정보가 수정되었습니다' : '바이어가 추가되었습니다',
      });
      onClose();
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {buyer ? '바이어 정보 수정' : '새 바이어 추가'}
          </DialogTitle>
          <DialogDescription>
            바이어 정보를 입력하면 거래 시 자동으로 불러올 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">바이어명 / 회사명 *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Beauty Hub Ltd."
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">국가 *</Label>
              <Select 
                value={formData.country} 
                onValueChange={(v) => handleSelectChange('country', v)}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="국가 선택" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {BUYER_COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">판매 채널</Label>
              <Select 
                value={formData.channel} 
                onValueChange={(v) => handleSelectChange('channel', v)}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="채널 선택" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map(ch => (
                    <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer_type">바이어 타입</Label>
              <Select 
                value={formData.buyer_type} 
                onValueChange={(v) => handleSelectChange('buyer_type', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  {BUYER_TYPES.map(bt => (
                    <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">담당자 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">담당자명</Label>
                <Input
                  id="contact_name"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="buyer@company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">전화번호</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="+852-1234-5678"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">웹사이트</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="www.beautyhub.hk"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="바이어에 대한 추가 정보나 특이사항..."
              className="min-h-[80px]"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {buyer ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
