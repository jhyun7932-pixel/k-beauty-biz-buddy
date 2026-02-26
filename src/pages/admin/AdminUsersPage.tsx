import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Loader2, Search, Shield, ShieldOff, MoreHorizontal, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface UserRow {
  user_id: string;
  display_name: string | null;
  created_at: string;
  company_name: string | null;
  role: 'admin' | 'user';
}

interface RoleChangeTarget {
  user: UserRow;
  newRole: 'admin' | 'user';
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleChangeTarget, setRoleChangeTarget] = useState<RoleChangeTarget | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all profiles (admin can see all via RLS)
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, display_name, created_at')
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;

      // Fetch all roles (RLS 오류 시 빈 배열로 fallback)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .then(res => res)
        .catch(() => ({ data: null, error: null }));
      const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role as 'admin' | 'user']));

      // Fetch company names
      const { data: companies } = await supabase
        .from('companies')
        .select('user_id, name');
      const companyMap = new Map((companies ?? []).map((c: any) => [c.user_id, c.name]));

      const rows: UserRow[] = (profiles ?? []).map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        created_at: p.created_at,
        company_name: companyMap.get(p.user_id) ?? null,
        role: roleMap.get(p.user_id) ?? 'user',
      }));

      setUsers(rows);
    } catch (e: any) {
      console.error(e);
      toast.error('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { user, newRole } = roleChangeTarget;
    setUpdatingId(user.user_id);
    setRoleChangeTarget(null);

    try {
      // Delete existing role first (RLS 오류 시 무시 — Edge Function에서 처리)
      await supabase.from('user_roles').delete().eq('user_id', user.user_id).catch(() => {});

      // Insert new role — uses service role via edge function to bypass "Deny direct role inserts" RLS
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await supabase.functions.invoke('manage-user-role', {
        body: { target_user_id: user.user_id, new_role: newRole },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.error) throw new Error(res.error.message);

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, role: newRole } : u))
      );
      toast.success(
        `${user.display_name || '사용자'}의 역할이 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경되었습니다.`
      );
    } catch (e: any) {
      console.error(e);
      toast.error('역할 변경에 실패했습니다: ' + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.company_name ?? '').toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">사용자 역할 관리</h2>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={fetchUsers} title="새로고침">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <div className="text-sm text-muted-foreground">전체 사용자</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-primary">{adminCount}</div>
            <div className="text-sm text-muted-foreground">관리자</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-foreground">{userCount}</div>
            <div className="text-sm text-muted-foreground">일반 사용자</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">사용자 목록</CardTitle>
            <div className="relative ml-auto w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 회사명으로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">검색 결과가 없습니다.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>가입일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>회사명</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isSelf = u.user_id === currentUser?.id;
                  const isUpdating = updatingId === u.user_id;
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{u.display_name || '-'}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{u.user_id.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell className="text-sm">{u.company_name || '-'}</TableCell>
                      <TableCell>
                        {u.role === 'admin' ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            관리자
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            일반 사용자
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                        ) : isSelf ? (
                          <span className="text-xs text-muted-foreground pr-2">본인</span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.role === 'user' ? (
                                <DropdownMenuItem
                                  onClick={() => setRoleChangeTarget({ user: u, newRole: 'admin' })}
                                  className="gap-2"
                                >
                                  <Shield className="h-4 w-4 text-primary" />
                                  관리자로 승격
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setRoleChangeTarget({ user: u, newRole: 'user' })}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <ShieldOff className="h-4 w-4" />
                                  일반 사용자로 변경
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={!!roleChangeTarget} onOpenChange={(o) => !o && setRoleChangeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>역할 변경 확인</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{roleChangeTarget?.user.display_name || '이 사용자'}</strong>의 역할을{' '}
              <strong>
                {roleChangeTarget?.newRole === 'admin' ? '관리자' : '일반 사용자'}
              </strong>
              로 변경하시겠습니까?
              {roleChangeTarget?.newRole === 'admin' && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  ⚠️ 관리자 권한을 부여하면 모든 사용자 데이터 및 어드민 기능에 접근할 수 있습니다.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              className={roleChangeTarget?.newRole === 'user' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              변경 확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
