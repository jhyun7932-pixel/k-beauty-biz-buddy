import React, { useState } from 'react';
import { Plus, Trash2, Building2, MapPin, Phone, User, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { COUNTRY_NAMES } from '@/stores/types';
import type { TargetCountry } from '@/stores/types';
import { useBuyers } from '@/hooks/useBuyers';
import { toast } from 'sonner';

const COUNTRY_OPTIONS: { value: TargetCountry; label: string }[] = Object.entries(COUNTRY_NAMES).map(
  ([code, name]) => ({ value: code as TargetCountry, label: `${name} (${code})` })
);

export default function BuyerListPage() {
  const { buyers, loading, createBuyer, deleteBuyer } = useBuyers();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    country: '' as string,
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  const handleSave = async () => {
    if (!form.companyName || !form.country) return;
    setSaving(true);
    const { error } = await createBuyer({
      company_name: form.companyName,
      country: form.country,
      contact_name: form.contactName || null,
      contact_email: form.contactEmail || null,
      contact_phone: form.contactPhone || null,
      notes: form.address || null,
    });
    setSaving(false);
    if (error) {
      toast.error('바이어 등록에 실패했습니다.');
      return;
    }
    setForm({ companyName: '', country: '', address: '', contactName: '', contactPhone: '', contactEmail: '' });
    setOpen(false);
    toast.success('바이어가 등록되었습니다.');
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteBuyer(id);
    if (error) {
      toast.error('바이어 삭제에 실패했습니다.');
    } else {
      toast.success('바이어가 삭제되었습니다.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Buyer List</h1>
          <p className="text-sm text-muted-foreground mt-1">수출 대상 바이어 정보를 등록·관리합니다.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Buyer
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : buyers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm">등록된 바이어가 없습니다.</p>
          <Button variant="link" size="sm" onClick={() => setOpen(true)}>바이어 추가하기</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buyers.map((b) => (
            <Card key={b.id} className="group relative">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">{b.company_name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{b.country}</Badge>
                </div>
                {b.notes && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {b.notes}
                  </div>
                )}
                {b.contact_name && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /> {b.contact_name}
                  </div>
                )}
                {b.contact_phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {b.contact_phone}
                  </div>
                )}
                {b.contact_email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> {b.contact_email}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-destructive"
                  onClick={() => handleDelete(b.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Buyer Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>바이어 추가</DialogTitle>
            <DialogDescription>수출 대상 바이어 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>회사명 (영문) *</Label>
              <Input placeholder="e.g. Tokyo Beauty Inc." value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div>
              <Label>국가 *</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger><SelectValue placeholder="국가 선택" /></SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>주소</Label>
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>담당자명</Label>
              <Input placeholder="Contact Name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>전화번호</Label>
                <Input placeholder="+81-..." value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
              <div>
                <Label>이메일</Label>
                <Input type="email" placeholder="email@example.com" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={!form.companyName || !form.country || saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
