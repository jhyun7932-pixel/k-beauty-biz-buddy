import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface PartnerProtectedRouteProps {
  children: React.ReactNode;
}

export function PartnerProtectedRoute({ children }: PartnerProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [isPartner, setIsPartner] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsPartner(false);
      return;
    }

    // profiles.role 컬럼으로 파트너 여부 확인 (user_roles 테이블 대신)
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsPartner(data?.role === 'partner'));
  }, [user, authLoading]);

  if (authLoading || isPartner === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isPartner) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
