import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { 
  OnboardingContext, 
  OnboardingSalesChannel, 
  OnboardingTradeStage, 
  OnboardingBuyerType 
} from '@/types/onboarding';
import { DEFAULT_ONBOARDING_CONTEXT } from '@/types/onboarding';

interface OnboardingState {
  context: OnboardingContext;
  step: 1 | 2;
  isComplete: boolean;
  loading: boolean;
  workspaceId: string | null;
}

export function useOnboarding() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    context: DEFAULT_ONBOARDING_CONTEXT,
    step: 1,
    isComplete: false,
    loading: true,
    workspaceId: null,
  });

  // 기존 온보딩 컨텍스트 로드
  const loadOnboardingContext = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // 먼저 워크스페이스 확인
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('workspace_id, workspace_name')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (workspace) {
        // 온보딩 컨텍스트 로드
        const { data: context } = await supabase
          .from('onboarding_context')
          .select('*')
          .eq('workspace_id', workspace.workspace_id)
          .maybeSingle();

        if (context) {
          setState(prev => ({
            ...prev,
            workspaceId: workspace.workspace_id,
            context: {
              contextId: context.context_id,
              workspaceId: context.workspace_id,
              userId: context.user_id,
              targetCountries: (context.target_countries as string[]) || [],
              targetChannel: context.target_channel as OnboardingSalesChannel | null,
              buyerType: (context.buyer_type as OnboardingBuyerType) || 'importer',
              tradeStage: (context.trade_stage as OnboardingTradeStage) || 'first_proposal',
              language: context.language || 'en',
              currency: context.currency || 'USD',
            },
            isComplete: true,
            loading: false,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          workspaceId: workspace.workspace_id,
          loading: false,
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading onboarding context:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOnboardingContext();
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated, loadOnboardingContext]);

  // Step 1 필수 정보 업데이트
  const updateContext = useCallback((updates: Partial<OnboardingContext>) => {
    setState(prev => ({
      ...prev,
      context: { ...prev.context, ...updates },
    }));
  }, []);

  // 국가 토글
  const toggleCountry = useCallback((countryCode: string) => {
    setState(prev => {
      const countries = prev.context.targetCountries;
      const isSelected = countries.includes(countryCode);
      
      if (isSelected) {
        return {
          ...prev,
          context: {
            ...prev.context,
            targetCountries: countries.filter(c => c !== countryCode),
          },
        };
      } else if (countries.length < 3) {
        return {
          ...prev,
          context: {
            ...prev.context,
            targetCountries: [...countries, countryCode],
          },
        };
      }
      return prev;
    });
  }, []);

  // Step 1 완료 체크
  const isStep1Complete = useCallback(() => {
    const { targetCountries, targetChannel, tradeStage } = state.context;
    return targetCountries.length > 0 && targetChannel !== null && tradeStage !== null;
  }, [state.context]);

  // Step 1 완료 → 워크스페이스 생성 + 온보딩 컨텍스트 저장
  const completeStep1 = useCallback(async () => {
    if (!user || !isStep1Complete()) return { error: new Error('필수 정보가 부족합니다') };

    try {
      setState(prev => ({ ...prev, loading: true }));

      // 워크스페이스가 없으면 생성
      let workspaceId = state.workspaceId;
      
      if (!workspaceId) {
        const { data: newWorkspace, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            workspace_name: `${user.email}'s Workspace`,
            owner_user_id: user.id,
          })
          .select('workspace_id')
          .single();

        if (wsError) throw wsError;
        workspaceId = newWorkspace.workspace_id;
      }

      // 온보딩 컨텍스트 저장/업데이트
      const contextData = {
        workspace_id: workspaceId,
        user_id: user.id,
        target_countries: state.context.targetCountries,
        target_channel: state.context.targetChannel,
        buyer_type: state.context.buyerType,
        trade_stage: state.context.tradeStage,
        language: state.context.language,
        currency: state.context.currency,
        updated_by: user.id,
      };

      const { data: savedContext, error: ctxError } = await supabase
        .from('onboarding_context')
        .upsert(contextData, { onConflict: 'workspace_id' })
        .select()
        .single();

      if (ctxError) throw ctxError;

      setState(prev => ({
        ...prev,
        workspaceId,
        context: {
          ...prev.context,
          contextId: savedContext.context_id,
          workspaceId,
        },
        step: 2,
        isComplete: true,
        loading: false,
      }));

      return { data: { workspaceId, contextId: savedContext.context_id } };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { error };
    }
  }, [user, state.workspaceId, state.context, isStep1Complete]);

  // 컨텍스트 업데이트 (Step 2 또는 설정에서)
  const saveContext = useCallback(async () => {
    if (!user || !state.workspaceId) return { error: new Error('워크스페이스가 없습니다') };

    try {
      const { error } = await supabase
        .from('onboarding_context')
        .update({
          target_countries: state.context.targetCountries,
          target_channel: state.context.targetChannel,
          buyer_type: state.context.buyerType,
          trade_stage: state.context.tradeStage,
          language: state.context.language,
          currency: state.context.currency,
          updated_by: user.id,
        })
        .eq('workspace_id', state.workspaceId);

      if (error) throw error;
      return { data: true };
    } catch (error) {
      return { error };
    }
  }, [user, state.workspaceId, state.context]);

  // 바로 시작 (최소 정보로)
  const startImmediately = useCallback(async () => {
    return await completeStep1();
  }, [completeStep1]);

  return {
    ...state,
    updateContext,
    toggleCountry,
    isStep1Complete,
    completeStep1,
    saveContext,
    startImmediately,
    reload: loadOnboardingContext,
  };
}
