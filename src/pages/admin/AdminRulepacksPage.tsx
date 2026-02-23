import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Database, RefreshCw, CheckCircle2, XCircle, ChevronDown,
  Search, CheckCheck, Clock, Wifi, ShieldAlert, ExternalLink,
  ArrowRight, MessageSquare, Loader2, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PendingUpdate {
  id: string;
  country: string;
  country_code: string;
  ingredient: string;
  change_description: string;
  source: string;
  severity: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  evidence_links: { label: string; url: string }[];
  regulation_before: string | null;
  regulation_after: string | null;
  detected_at: string;
}

// ── Mock live DB data (from existing rulepacks table) ──────────────────────────
const LIVE_RULES = [
  { country: '미국 (US)', regulation: 'FDA MoCRA (2022)', rules: 42, lastUpdated: '2026-02-01' },
  { country: 'EU', regulation: 'EC No 1223/2009', rules: 38, lastUpdated: '2026-01-28' },
  { country: '일본 (JP)', regulation: '약기법 (薬機法)', rules: 31, lastUpdated: '2026-01-25' },
  { country: '중국 (CN)', regulation: '화장품감독관리조례 (2021)', rules: 29, lastUpdated: '2026-02-05' },
  { country: '태국 (TH)', regulation: 'Cosmetic Act B.E. 2558', rules: 24, lastUpdated: '2026-01-20' },
  { country: '베트남 (VN)', regulation: 'Decree 93/2016/ND-CP', rules: 22, lastUpdated: '2026-01-18' },
  { country: '인도네시아 (ID)', regulation: 'BPOM Regulation', rules: 27, lastUpdated: '2026-02-03' },
  { country: '말레이시아 (MY)', regulation: 'Control of Drugs and Cosmetics Regulations', rules: 19, lastUpdated: '2026-01-15' },
  { country: '대만 (TW)', regulation: '화장품위생관리조례', rules: 21, lastUpdated: '2026-01-22' },
  { country: '호주 (AU)', regulation: 'Industrial Chemicals Act 2019', rules: 18, lastUpdated: '2026-01-30' },
  { country: '홍콩 (HK)', regulation: '약품조례/소비자안전조례', rules: 15, lastUpdated: '2026-01-12' },
];

const SEVERITY_CONFIG = {
  high: { label: '긴급', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  medium: { label: '주의', className: 'bg-[hsl(40,70%,50%)]/10 text-[hsl(40,70%,50%)] border-[hsl(40,70%,50%)]/20' },
  low: { label: '일반', className: 'bg-muted text-muted-foreground border-border' },
};

const totalRules = LIVE_RULES.reduce((s, r) => s + r.rules, 0);

// ── RegDiff Component ──────────────────────────────────────────────────────────
function RegDiff({ before, after }: { before?: string | null; after?: string | null }) {
  if (!before && !after) return null;
  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      {before && (
        <div className="px-4 py-3 bg-destructive/5 border-b border-border">
          <p className="text-[10px] font-semibold text-destructive/60 uppercase tracking-wider mb-1">변경 전</p>
          <p className="text-foreground">{before}</p>
        </div>
      )}
      {after && (
        <div className="px-4 py-3 bg-success/5">
          <p className="text-[10px] font-semibold text-success/70 uppercase tracking-wider mb-1">변경 후</p>
          <p className="text-foreground">{after}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminRulepacksPage() {
  const { toast } = useToast();

  // State
  const [pending, setPending] = useState<PendingUpdate[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<string>('—');

  // Slide-over state
  const [selectedItem, setSelectedItem] = useState<PendingUpdate | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch pending updates ────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    const { data, error } = await (supabase as any)
      .from('rulepack_pending_updates')
      .select('*')
      .order('detected_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      toast({ title: '데이터 로드 실패', description: error.message, variant: 'destructive' });
    } else if (data) {
      const rows = data as PendingUpdate[];
      // Find latest detected_at for "last sync" display
      if (rows.length > 0) {
        const latest = new Date(rows[0].detected_at);
        setLastSync(latest.toLocaleDateString('ko-KR', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit',
        }));
      }
      setPending(data as unknown as PendingUpdate[]);
    }
    setLoadingPending(false);
  }, [toast]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const pendingItems = pending.filter((p) => p.status === 'pending');

  // ── Row action (approve / reject) ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const handleRowAction = async (id: string, newStatus: 'approved' | 'rejected', notes?: string) => {
    setActionLoading(id);

    if (newStatus === 'approved') {
      // Call edge function: applies change to compliance_rules + rulepacks, then marks approved
      const { data, error } = await supabase.functions.invoke('approve-rulepack-update', {
        body: { ids: [id], admin_notes: notes ?? null },
      });

      if (error || (data as any)?.error) {
        const msg = error?.message ?? (data as any)?.error ?? '알 수 없는 오류';
        toast({ title: '승인 처리 실패', description: msg, variant: 'destructive' });
      } else {
        const applied = (data as any)?.applied ?? 1;
        const countries = ((data as any)?.countries_updated ?? []).join(', ');
        setPending((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved', admin_notes: notes ?? null } : p));
        if (selectedItem?.id === id) setSelectedItem(null);
        toast({
          title: '✅ 승인 완료 — 라이브 DB 반영됨',
          description: `규제 변경안이 compliance_rules 및 rulepacks 테이블에 즉시 반영되었습니다. (국가: ${countries})`,
        });
      }
    } else {
      // Reject: simple DB status update, no engine sync needed
      const { error } = await db
        .from('rulepack_pending_updates')
        .update({ status: 'rejected', admin_notes: notes ?? null })
        .eq('id', id);

      if (error) {
        toast({ title: '거절 처리 실패', description: error.message, variant: 'destructive' });
      } else {
        setPending((prev) => prev.map((p) => p.id === id ? { ...p, status: 'rejected', admin_notes: notes ?? null } : p));
        if (selectedItem?.id === id) setSelectedItem(null);
        toast({
          title: '❌ 거절 완료',
          description: '규제 변경안이 거절되었습니다.',
          variant: 'destructive',
        });
      }
    }

    setActionLoading(null);
  };

  // ── Save note (without changing status) ─────────────────────────────────────
  const handleSaveNote = async () => {
    if (!selectedItem) return;
    setSavingNote(true);
    const { error } = await db
      .from('rulepack_pending_updates')
      .update({ admin_notes: noteText })
      .eq('id', selectedItem.id);
    setSavingNote(false);
    if (error) {
      toast({ title: '저장 실패', description: error.message, variant: 'destructive' });
    } else {
      setPending((prev) => prev.map((p) => p.id === selectedItem.id ? { ...p, admin_notes: noteText } : p));
      toast({ title: '메모 저장 완료' });
    }
  };

  // ── Bulk approve ─────────────────────────────────────────────────────────────
  const handleBulkApprove = async () => {
    setShowBulkConfirm(false);
    const ids = pendingItems.map((p) => p.id);
    if (ids.length === 0) return;

    const { data, error } = await supabase.functions.invoke('approve-rulepack-update', {
      body: { ids, bulk: true },
    });

    if (error || (data as any)?.error) {
      const msg = error?.message ?? (data as any)?.error ?? '알 수 없는 오류';
      toast({ title: '전체 승인 실패', description: msg, variant: 'destructive' });
    } else {
      const applied = (data as any)?.applied ?? ids.length;
      const countries = ((data as any)?.countries_updated ?? []).join(', ');
      setPending((prev) => prev.map((p) => p.status === 'pending' ? { ...p, status: 'approved' } : p));
      toast({
        title: `전체 승인 완료 🎉 — ${applied}건 라이브 DB 반영`,
        description: `compliance_rules 및 rulepacks 테이블이 갱신되었습니다. (적용 국가: ${countries || '없음'})`,
      });
    }
  };

  // ── Force sync (calls edge function) ────────────────────────────────────────
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('rulepack-crawler');
      if (error) throw new Error(error.message);

      const inserted = (data as any)?.inserted ?? 0;
      toast({
        title: `🔄 수집 완료 — ${inserted}건 신규 추가`,
        description: 'AI 크롤러가 최신 규제 데이터를 수집했습니다.',
      });
      await fetchPending();
      setLastSync(new Date().toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }));
    } catch (err: any) {
      toast({ title: '수집 실패', description: err.message, variant: 'destructive' });
    }
    setIsSyncing(false);
  };

  const filteredLive = LIVE_RULES.filter((r) =>
    r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.regulation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">RulePack Auto-Sync 관리</h2>
      </div>

      {/* ── 1. Auto-Sync Status Board ── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            시스템 동기화 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">최근 DB 동기화</p>
                  <p className="text-sm font-semibold text-foreground">{lastSync}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <Wifi className="h-4 w-4 text-success shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">크롤러 상태</p>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                    정상 운영 중
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">적용된 규제 룰</p>
                  <p className="text-sm font-semibold text-foreground">{totalRules.toLocaleString()}건 (11개국)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <AlertTriangle className="h-4 w-4 text-[hsl(40,70%,50%)] shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">승인 대기</p>
                  <p className="text-sm font-semibold text-foreground">{pendingItems.length}건</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              onClick={handleForceSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'AI 수집 중...' : '실시간 수집 강제 실행'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 2 & 3. Pending Updates ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                새로 감지된 규제 변경안
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                승인 대기 중 <span className="font-semibold text-foreground">{pendingItems.length}건</span>
                {' '}· 행을 클릭하면 상세 검토 패널이 열립니다
              </p>
            </div>
            {pendingItems.length > 0 && (
              <Button className="gap-2 shrink-0" onClick={() => setShowBulkConfirm(true)}>
                <CheckCheck className="h-4 w-4" />
                전체 승인 및 라이브 DB 반영
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPending ? (
            <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">데이터 로드 중...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success opacity-50" />
              <p className="font-medium">대기 중인 변경안이 없습니다.</p>
              <p className="text-sm mt-1">우측 상단의 '실시간 수집 강제 실행'을 눌러 새 데이터를 수집하세요.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px]">국가</TableHead>
                    <TableHead>성분</TableHead>
                    <TableHead className="min-w-[200px]">감지된 변경 내용</TableHead>
                    <TableHead className="min-w-[160px]">출처</TableHead>
                    <TableHead className="w-[70px]">긴급도</TableHead>
                    <TableHead className="w-[90px]">감지일</TableHead>
                    <TableHead className="w-[160px] text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((item) => (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer transition-colors ${item.status !== 'pending' ? 'opacity-40' : 'hover:bg-muted/40'}`}
                      onClick={() => {
                        if (item.status === 'pending') {
                          setSelectedItem(item);
                          setNoteText(item.admin_notes ?? '');
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs">{item.country_code}</span>
                          <span className="text-[11px] text-muted-foreground">{item.country}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm text-foreground">{item.ingredient}</TableCell>
                      <TableCell className="text-sm text-foreground">{item.change_description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.source}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] font-medium ${SEVERITY_CONFIG[item.severity]?.className ?? ''}`}>
                          {SEVERITY_CONFIG[item.severity]?.label ?? item.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.detected_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {item.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 gap-1 text-xs text-success border-success/30 hover:bg-success/10 hover:text-success"
                              disabled={actionLoading === item.id}
                              onClick={() => handleRowAction(item.id, 'approved')}
                            >
                              {actionLoading === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                              disabled={actionLoading === item.id}
                              onClick={() => handleRowAction(item.id, 'rejected')}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              거절
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className={item.status === 'approved'
                            ? 'text-success border-success/30 bg-success/10'
                            : 'text-destructive border-destructive/30 bg-destructive/10'
                          }>
                            {item.status === 'approved' ? '승인됨' : '거절됨'}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Live Database View ── */}
      <Collapsible open={liveOpen} onOpenChange={setLiveOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold text-foreground">현재 적용된 전체 규제 보기</CardTitle>
                  <Badge variant="secondary" className="text-xs ml-1">{totalRules}건</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${liveOpen ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-sm text-muted-foreground">현재 라이브 서비스 중인 11개국 규제 데이터 전체 목록</p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="국가명 또는 규정명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead>국가</TableHead>
                      <TableHead>적용 규정</TableHead>
                      <TableHead className="text-center">규제 룰 수</TableHead>
                      <TableHead>마지막 업데이트</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLive.map((row) => (
                      <TableRow key={row.country}>
                        <TableCell className="font-medium text-foreground">{row.country}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.regulation}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{row.rules}건</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.lastUpdated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredLive.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-sm">검색 결과가 없습니다.</div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Bulk Approve Confirm Modal ── */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-primary" />
              전체 승인 및 라이브 DB 반영
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              대기 중인 <strong className="text-foreground">{pendingItems.length}건</strong>의 규제 변경안이
              고객들의 규제 진단 엔진에 <strong className="text-foreground">즉시 반영</strong>됩니다.
              <br /><br />
              진행하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkApprove} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              전체 승인 및 반영
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Detail Slide-Over Panel ── */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base font-bold text-foreground leading-snug">
                      {selectedItem.ingredient}
                    </SheetTitle>
                    <SheetDescription className="text-sm mt-1">
                      {selectedItem.country} ({selectedItem.country_code}) · {selectedItem.source}
                    </SheetDescription>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs font-medium ${SEVERITY_CONFIG[selectedItem.severity]?.className ?? ''}`}>
                    {SEVERITY_CONFIG[selectedItem.severity]?.label}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-5">
                {/* Summary */}
                <div className="rounded-lg bg-muted/40 border border-border px-4 py-3">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">변경 요약</p>
                  <p className="text-sm text-foreground">{selectedItem.change_description}</p>
                </div>

                {/* Regulation diff */}
                {(selectedItem.regulation_before || selectedItem.regulation_after) && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ArrowRight className="h-3.5 w-3.5" />
                      규제 변경 내용 (Diff)
                    </p>
                    <RegDiff before={selectedItem.regulation_before} after={selectedItem.regulation_after} />
                  </div>
                )}

                {/* Evidence links */}
                {selectedItem.evidence_links?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />
                      출처 / 근거 문서
                    </p>
                    <div className="space-y-2">
                      {selectedItem.evidence_links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm text-primary group"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                          <span className="truncate">{link.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Admin notes */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    관리자 메모
                  </p>
                  <Textarea
                    placeholder="검토 의견, 추가 확인 필요 사항 등을 메모하세요..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="resize-none text-sm"
                    rows={3}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={handleSaveNote}
                    disabled={savingNote}
                  >
                    {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    메모 저장
                  </Button>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-3 pb-4">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleRowAction(selectedItem.id, 'approved', noteText)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === selectedItem.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    승인 (Approve)
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => handleRowAction(selectedItem.id, 'rejected', noteText)}
                    disabled={!!actionLoading}
                  >
                    <XCircle className="h-4 w-4" />
                    거절 (Reject)
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
