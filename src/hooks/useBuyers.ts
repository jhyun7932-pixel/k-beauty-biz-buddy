import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Buyer {
  id: string;
  user_id: string;
  company_name: string;
  country: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  channel: string | null;
  buyer_type: string | null;
  notes: string | null;
  status_stage: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface BuyersState {
  buyers: Buyer[];
  loading: boolean;
  error: string | null;
}

export function useBuyers() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<BuyersState>({
    buyers: [],
    loading: true,
    error: null,
  });

  // 바이어 목록 조회
  const fetchBuyers = useCallback(async () => {
    if (!user) {
      setState({ buyers: [], loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setState({ buyers: [], loading: false, error: error.message });
      return;
    }

    setState({ buyers: data || [], loading: false, error: null });
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBuyers();
    } else {
      setState({ buyers: [], loading: false, error: null });
    }
  }, [isAuthenticated, fetchBuyers]);

  // 바이어 생성
  const createBuyer = useCallback(async (buyerData: Omit<Partial<Buyer>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { company_name: string; country: string }) => {
    if (!user) return { error: new Error('로그인이 필요합니다') };

    const insertData = {
      company_name: buyerData.company_name,
      country: buyerData.country,
      user_id: user.id,
      contact_name: buyerData.contact_name ?? null,
      contact_email: buyerData.contact_email ?? null,
      contact_phone: buyerData.contact_phone ?? null,
      website: buyerData.website ?? null,
      channel: buyerData.channel ?? null,
      buyer_type: buyerData.buyer_type ?? null,
      notes: buyerData.notes ?? null,
    };

    const { data, error } = await supabase
      .from('buyers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[useBuyers] createBuyer 실패:', error.code, error.message, error.details);
      return { error };
    }

    setState(prev => ({ ...prev, buyers: [data, ...prev.buyers] }));
    return { data };
  }, [user]);

  // 바이어 업데이트
  const updateBuyer = useCallback(async (buyerId: string, updates: Partial<Buyer>) => {
    if (!user) return { error: new Error('로그인이 필요합니다') };

    const { data, error } = await supabase
      .from('buyers')
      .update(updates)
      .eq('id', buyerId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return { error };
    }

    setState(prev => ({
      ...prev,
      buyers: prev.buyers.map(b => b.id === buyerId ? data : b),
    }));
    return { data };
  }, [user]);

  // 바이어 삭제
  const deleteBuyer = useCallback(async (buyerId: string) => {
    if (!user) return { error: new Error('로그인이 필요합니다') };

    const { error } = await supabase
      .from('buyers')
      .delete()
      .eq('id', buyerId)
      .eq('user_id', user.id);

    if (error) {
      return { error };
    }

    setState(prev => ({
      ...prev,
      buyers: prev.buyers.filter(b => b.id !== buyerId),
    }));
    return {};
  }, [user]);

  // 특정 바이어 조회
  const getBuyer = useCallback((buyerId: string) => {
    return state.buyers.find(b => b.id === buyerId);
  }, [state.buyers]);

  return {
    ...state,
    fetchBuyers,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    getBuyer,
  };
}
