import type { StateCreator } from 'zustand';
import type { AppStore, AuthState, AuthActions } from '../types';

export const defaultAuthState: AuthState = {
  session: { userId: null, email: null, role: 'user' },
  workspace: { workspaceId: null, name: '기본 워크스페이스' },
};

export const createAuthSlice: StateCreator<AppStore, [], [], AuthState & AuthActions> = (set) => ({
  ...defaultAuthState,

  // Supabase 로그인 성공 시 AuthProvider에서 호출 — session 전체/부분 업데이트
  setSession: (session) => {
    set((s) => ({ session: { ...s.session, ...session } }));
  },
});
