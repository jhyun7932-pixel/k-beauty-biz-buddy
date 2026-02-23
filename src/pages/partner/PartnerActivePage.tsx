import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { FolderKanban } from 'lucide-react';

interface ActiveRequest {
  id: string;
  project_name: string;
  company_name: string | null;
  target_countries: string[];
  status: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  quoted: { label: '견적 제출됨', className: 'bg-warning/10 text-warning border-warning/20' },
  accepted: { label: '수락됨', className: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: '완료', className: 'bg-success/10 text-success border-success/20' },
};

export default function PartnerActivePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ActiveRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('expert_connection_requests')
        .select('*')
        .eq('assigned_partner_id', user.id)
        .in('status', ['quoted', 'accepted', 'completed'])
        .order('updated_at', { ascending: false });

      if (data) {
        setRequests(data.map(d => ({
          ...d,
          target_countries: Array.isArray(d.target_countries) ? d.target_countries as string[] : [],
        })));
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FolderKanban className="h-6 w-6" />
          진행 중인 건
        </h1>
        <p className="text-sm text-muted-foreground mt-1">견적을 제출했거나 수락된 의뢰 목록입니다.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">진행 중인 건이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const st = STATUS_MAP[req.status] || STATUS_MAP.quoted;
            return (
              <div key={req.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{req.project_name}</p>
                  {req.company_name && <p className="text-xs text-muted-foreground">{req.company_name}</p>}
                  <div className="flex gap-1 mt-1">
                    {req.target_countries.slice(0, 3).map(c => (
                      <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={`text-xs ${st.className}`}>{st.label}</Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.updated_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
