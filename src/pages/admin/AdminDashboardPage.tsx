import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, MessageSquareMore, Building2, FileText, Users, UserPlus, FolderKanban, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  newUsers7d: number;
  totalProjects: number;
  totalDocuments: number;
  newInquiries: number;
}

const QUICK_LINKS = [
  { label: '세일즈 문의 관리', to: '/admin/inquiries', icon: MessageSquareMore },
  { label: '고객사 관리', to: '/admin/customers', icon: Building2 },
  { label: '사용자 역할 관리', to: '/admin/users', icon: Users },
  { label: 'RulePack DB 관리', to: '/admin/rulepacks', icon: FileText },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsers7d: 0,
    totalProjects: 0,
    totalDocuments: 0,
    newInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        const [profilesRes, newProfilesRes, dealsRes, docsRes, inquiriesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
          supabase.from('deals').select('id', { count: 'exact', head: true }),
          supabase.from('documents').select('id', { count: 'exact', head: true }),
          supabase.from('sales_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        ]);

        setStats({
          totalUsers: profilesRes.count ?? 0,
          newUsers7d: newProfilesRes.count ?? 0,
          totalProjects: dealsRes.count ?? 0,
          totalDocuments: docsRes.count ?? 0,
          newInquiries: inquiriesRes.count ?? 0,
        });
      } catch (e) {
        console.error('Stats fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const KPI_CARDS = [
    {
      label: '총 사용자 수',
      value: stats.totalUsers,
      icon: Users,
      description: '가입된 전체 사용자',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: '신규 가입자 (7일)',
      value: stats.newUsers7d,
      icon: UserPlus,
      description: '최근 7일 신규 가입',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: '총 프로젝트 수',
      value: stats.totalProjects,
      icon: FolderKanban,
      description: '생성된 전체 딜/프로젝트',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      label: '총 문서 수',
      value: stats.totalDocuments,
      icon: FileText,
      description: '생성된 전체 무역 서류',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: '신규 세일즈 문의',
      value: stats.newInquiries,
      icon: MessageSquareMore,
      description: '미처리 문의 건수',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">관리자 대시보드</h2>
          <p className="text-sm text-muted-foreground">서비스 전체 현황을 한눈에 확인하세요</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="relative overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
                    {card.label}
                  </CardTitle>
                  <div className={`p-1.5 rounded-lg ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p className={`text-3xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{card.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Nav */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          빠른 이동
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.to} to={link.to}>
                <Card className="hover:border-primary/50 hover:bg-muted/40 transition-all cursor-pointer group">
                  <CardContent className="flex items-center gap-3 py-4 px-4">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
