import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// profiles 테이블 스키마와 1:1 매핑 (database_setup.sql 기준)
// profiles.id = auth.users.id (별도 user_id 컬럼 없음)
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'partner';
  language: string;
  timezone: string;
  is_onboarded: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

  // 프로필 조회
  // profiles.id = auth.users.id (PK = FK) — user_id 컬럼이 아닌 id로 조회
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, language, timezone, is_onboarded')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    return data;
  }, []);

  // 초기 세션 로드 및 상태 변경 구독
  useEffect(() => {
    // 먼저 구독 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        
        if (user) {
          // defer profile fetch to avoid blocking
          setTimeout(async () => {
            const profile = await fetchProfile(user.id);
            setState(prev => ({ ...prev, profile }));
          }, 0);
        }
        
        setState(prev => ({
          ...prev,
          user,
          session,
          loading: false,
          error: null,
        }));
      }
    );

    // 그 다음 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      
      setState(prev => ({
        ...prev,
        user,
        session,
        loading: false,
      }));

      if (user) {
        fetchProfile(user.id).then(profile => {
          setState(prev => ({ ...prev, profile }));
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // 로그인
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    return { data };
  }, []);

  // 회원가입
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: displayName,
        },
      },
    });

    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    return { data };
  }, []);

  // 로그아웃
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error };
    }

    setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      error: null,
    });

    return {};
  }, []);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, 'id'>>) => {
    if (!state.user) return { error: new Error('로그인이 필요합니다') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', state.user.id)   // profiles.id = auth.users.id
      .select()
      .single();

    if (error) {
      return { error };
    }

    setState(prev => ({ ...prev, profile: data }));
    return { data };
  }, [state.user]);

  return {
    ...state,
    isAuthenticated: !!state.user,
    // profile.role을 편의상 최상위로 노출 (AdminProtectedRoute 등에서 바로 사용)
    role: state.profile?.role ?? 'user',
    isOnboarded: state.profile?.is_onboarded ?? false,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refetchProfile: () => state.user ? fetchProfile(state.user.id) : Promise.resolve(null),
  };
}
