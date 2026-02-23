import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2, Eye, Ban } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerRow {
  user_id: string;
  display_name: string | null;
  created_at: string;
  company_name: string | null;
  product_count: number;
  deal_count: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        // Get profiles
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('user_id, display_name, created_at')
          .order('created_at', { ascending: false });
        if (pErr) throw pErr;

        // Get companies for names
        const { data: companies } = await supabase.from('companies').select('user_id, name');
        const companyMap = new Map((companies ?? []).map((c: any) => [c.user_id, c.name]));

        // Get product counts per user
        const { data: products } = await supabase.from('products').select('user_id');
        const productCounts = new Map<string, number>();
        (products ?? []).forEach((p: any) => {
          productCounts.set(p.user_id, (productCounts.get(p.user_id) ?? 0) + 1);
        });

        // Get deal counts per user
        const { data: deals } = await supabase.from('deals').select('user_id');
        const dealCounts = new Map<string, number>();
        (deals ?? []).forEach((d: any) => {
          dealCounts.set(d.user_id, (dealCounts.get(d.user_id) ?? 0) + 1);
        });

        const rows: CustomerRow[] = (profiles ?? []).map((p: any) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          created_at: p.created_at,
          company_name: companyMap.get(p.user_id) ?? null,
          product_count: productCounts.get(p.user_id) ?? 0,
          deal_count: dealCounts.get(p.user_id) ?? 0,
        }));

        setCustomers(rows);
      } catch (e) {
        console.error(e);
        toast.error('고객사 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">고객사 관리</h2>
        <Badge variant="secondary" className="ml-auto">{customers.length}사</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              등록된 고객사가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>가입일</TableHead>
                  <TableHead>이름/이메일</TableHead>
                  <TableHead>회사명</TableHead>
                  <TableHead className="text-center">등록 제품 수</TableHead>
                  <TableHead className="text-center">진행 프로젝트</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.user_id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="font-medium">{c.display_name || '-'}</TableCell>
                    <TableCell>{c.company_name || '-'}</TableCell>
                    <TableCell className="text-center">{c.product_count}</TableCell>
                    <TableCell className="text-center">{c.deal_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="상세 보기">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="정지">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
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
