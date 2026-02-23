import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Inbox, FolderKanban, CheckCircle2, Clock } from 'lucide-react';

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0 });

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      const { data } = await supabase
        .from('expert_connection_requests')
        .select('status');
      
      if (data) {
        setStats({
          pending: data.filter(r => r.status === 'pending').length,
          active: data.filter(r => r.status === 'quoted' || r.status === 'accepted').length,
          completed: data.filter(r => r.status === 'completed').length,
        });
      }
    };
    fetchStats();
  }, [user]);

  const cards = [
    { label: '신규 견적 요청', value: stats.pending, icon: Inbox, color: 'hsl(160 60% 40%)' },
    { label: '진행 중', value: stats.active, icon: FolderKanban, color: 'hsl(38 92% 50%)' },
    { label: '완료', value: stats.completed, icon: CheckCircle2, color: 'hsl(142 76% 36%)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">파트너 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">수출 기업의 통관/물류 의뢰 현황을 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${card.color} / 0.1` }}>
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">최근 활동</h2>
        </div>
        <p className="text-sm text-muted-foreground">아직 활동 내역이 없습니다. 신규 견적 요청 탭에서 의뢰를 확인하세요.</p>
      </div>
    </div>
  );
}
