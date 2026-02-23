import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquareMore, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Inquiry {
  id: string;
  company_name: string;
  contact_name: string;
  contact_info: string;
  brand_link: string | null;
  target_countries: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: '신규 접수', variant: 'default' as const },
  { value: 'contacted', label: '컨택 완료', variant: 'secondary' as const },
  { value: 'in_progress', label: '계약 진행', variant: 'default' as const },
  { value: 'closed', label: '종료', variant: 'outline' as const },
];

const statusLabel = (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
const statusVariant = (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.variant ?? ('outline' as const);

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('문의 목록을 불러오지 못했습니다.');
    } else {
      setInquiries((data as Inquiry[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('sales_inquiries')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      toast.error('상태 변경에 실패했습니다.');
      return;
    }
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    toast.success('상태가 변경되었습니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquareMore className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">세일즈 프로젝트 문의 관리</h2>
        <Badge variant="secondary" className="ml-auto">{inquiries.length}건</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              아직 접수된 문의가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>접수일</TableHead>
                  <TableHead>회사명</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>희망 국가</TableHead>
                  <TableHead>브랜드 링크</TableHead>
                  <TableHead className="w-[160px]">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inq) => (
                  <TableRow key={inq.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(inq.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="font-medium">{inq.company_name}</TableCell>
                    <TableCell>{inq.contact_name}</TableCell>
                    <TableCell className="text-sm">{inq.contact_info}</TableCell>
                    <TableCell className="text-sm">{inq.target_countries || '-'}</TableCell>
                    <TableCell>
                      {inq.brand_link ? (
                        <a href={inq.brand_link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm truncate max-w-[120px] block">
                          링크
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Select value={inq.status} onValueChange={(v) => handleStatusChange(inq.id, v)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue>
                            <Badge variant={statusVariant(inq.status)} className="text-xs">
                              {statusLabel(inq.status)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
