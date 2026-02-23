/**
 * AuthProvider
 *
 * useAuth 훅(Supabase 실시간 세션)의 상태를 Zustand appStore의 session으로
 * 동기화하는 브리지 컴포넌트입니다.
 *
 * 역할:
 *  - 로그인 → Zustand session에 userId, email, role 기록
 *  - 로그아웃 → Zustand session 초기화
 *  - 앱 전체를 감싸므로 어느 컴포넌트든 useAppStore().session으로 유저 정보 참조 가능
 */

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/appStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, profile, isAuthenticated } = useAuth();
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Supabase auth + profiles 테이블의 role을 Zustand store에 동기화
      // partner role은 Zustand에서 'user'로 취급 (라우팅은 PartnerProtectedRoute가 담당)
      const zustandRole = profile?.role === 'admin' ? 'admin' : 'user';

      setSession({
        userId: user.id,
        email: user.email ?? null,
        role: zustandRole,
      });
    } else if (!isAuthenticated) {
      // 로그아웃 시 Zustand session 초기화
      setSession({ userId: null, email: null, role: 'user' });
    }
  }, [isAuthenticated, user, profile, setSession]);

  return <>{children}</>;
}
