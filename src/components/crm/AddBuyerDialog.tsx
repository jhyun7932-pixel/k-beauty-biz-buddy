import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COUNTRY_OPTIONS } from '@/lib/countryFlags';
import { toast } from 'sonner';
import type { Buyer } from '@/hooks/useBuyers';

const CHANNEL_OPTIONS = [
  { value: 'wholesale', label: '도매 (Wholesale)' },
  { value: 'retail', label: '리테일 (Retail)' },
  { value: 'online', label: '온라인 (Online)' },
  { value: 'd2c', label: 'D2C' },
];

const STAGE_OPTIONS = [
  { value: 'lead', label: '리드' },
  { value: 'contacted', label: '연락완료' },
  { value: 'replied', label: '회신' },
  { value: 'sample', label: '샘플' },
  { value: 'negotiation', label: '협상중' },
  { value: 'won', label: '계약' },
  { value: 'lost', label: '보류' },
];

interface AddBuyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Partial<Buyer>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { name: string; country: string }) => Promise<{ error?: any }>;
}

export function AddBuyerDialog({ open, onOpenChange, onSubmit }: AddBuyerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    country: '',
    channel: '',
    status_stage: 'lead',
    contact_name: '',
    contact_email: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.country) {
      toast.error('이름과 국가는 필수입니다.');
      return;
    }
    setLoading(true);
    const result = await onSubmit({
      name: form.name,
      country: form.country,
      channel: form.channel || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
    });
    setLoading(false);

    if (result.error) {
      toast.error('바이어 추가 실패: ' + (result.error.message || '알 수 없는 오류'));
    } else {
      toast.success('바이어가 추가되었습니다.');
      setForm({ name: '', country: '', channel: '', status_stage: 'lead', contact_name: '', contact_email: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 바이어 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>바이어명 *</Label>
            <Input
              placeholder="예: Tokyo Beauty Co."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>국가 *</Label>
            <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="국가 선택" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>채널</Label>
            <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="채널 선택" />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>담당자</Label>
            <Input
              placeholder="담당자 이름"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>이메일</Label>
            <Input
              type="email"
              placeholder="buyer@example.com"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '저장 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
