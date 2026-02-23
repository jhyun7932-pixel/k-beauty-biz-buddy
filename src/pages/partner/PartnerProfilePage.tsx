import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserCircle, Mail, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PartnerProfilePage() {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCircle className="h-6 w-6" />
          내 프로필 / 정산
        </h1>
        <p className="text-sm text-muted-foreground mt-1">파트너 계정 정보 및 정산 내역을 확인하세요.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'hsl(160 60% 40% / 0.15)' }}>
            <UserCircle className="h-8 w-8" style={{ color: 'hsl(160 60% 40%)' }} />
          </div>
          <div>
            <p className="font-semibold text-lg text-foreground">{profile?.display_name || '파트너'}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-xs" style={{ backgroundColor: 'hsl(160 60% 40% / 0.15)', color: 'hsl(160 60% 35%)' }}>파트너</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">이메일</p>
              <p className="text-sm text-foreground">{user?.email || '-'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">소속</p>
              <p className="text-sm text-foreground">관세법인 / 포워딩 회사</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-3">정산 내역</h2>
        <p className="text-sm text-muted-foreground">아직 정산 내역이 없습니다. 견적이 수락되면 이곳에 표시됩니다.</p>
      </div>
    </div>
  );
}
