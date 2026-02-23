import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CRMBuyer, CRMDeal, CRMInteraction, CRMKPIData, DealStatusStage } from '@/types/onboarding';

interface DealOSState {
  buyers: CRMBuyer[];
  deals: CRMDeal[];
  interactions: CRMInteraction[];
  kpi: CRMKPIData;
  loading: boolean;
  error: string | null;
}

export function useDealOS() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<DealOSState>({
    buyers: [],
    deals: [],
    interactions: [],
    kpi: {
      followUpNeeded: 0,
      activeDeals: 0,
      sampleToOrderCandidates: 0,
      unsentDocuments: 0,
    },
    loading: true,
    error: null,
  });

  // 바이어 목록 + 딜 + 인터랙션 로드
  const loadData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // 바이어 로드
      const { data: buyers, error: buyersError } = await supabase
        .from('buyers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (buyersError) throw buyersError;

      // 딜 로드
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      // 인터랙션 로드
      const { data: interactions, error: intError } = await supabase
        .from('buyer_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (intError) throw intError;

      // KPI 계산
      const today = new Date();
      const followUpNeeded = (buyers || []).filter(b => {
        if (!b.next_follow_up_date) return false;
        return new Date(b.next_follow_up_date) <= today;
      }).length;

      const activeDeals = (deals || []).filter(d => 
        d.status === 'draft' || d.status === 'sent'
      ).length;

      const sampleToOrderCandidates = (buyers || []).filter(b => 
        b.status_stage === 'sample'
      ).length;

      // 미발송 문서 = 딜이 있지만 doc_refs가 비어있는 경우
      const unsentDocuments = (deals || []).filter(d => {
        const refs = (d.doc_refs as string[]) || [];
        return refs.length === 0 && d.status === 'draft';
      }).length;

      // 데이터 변환
      const transformedBuyers: CRMBuyer[] = (buyers || []).map(b => ({
        buyerId: b.id,
        workspaceId: b.workspace_id || undefined,
        companyName: b.company_name || b.name,
        country: b.country,
        channelFocus: b.channel_focus || b.channel || 'wholesale',
        buyerType: (b.buyer_type as any) || 'importer',
        preferredLanguage: b.preferred_language || 'en',
        contactName: b.contact_name || undefined,
        contactEmail: b.contact_email || undefined,
        contactPhone: b.contact_phone || undefined,
        website: b.website || undefined,
        statusStage: (b.status_stage as DealStatusStage) || 'lead',
        rating: b.rating || 3,
        notes: b.notes || undefined,
        nextFollowUpDate: b.next_follow_up_date ? new Date(b.next_follow_up_date) : undefined,
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at),
      }));

      const transformedDeals: CRMDeal[] = (deals || []).map(d => ({
        dealId: d.id,
        buyerId: d.buyer_id || '',
        productId: d.product_id || undefined,
        tradeStage: (d.trade_stage_enum as any) || (d.stage as any) || 'first_proposal',
        incoterms: d.incoterms || 'FOB',
        paymentTerms: d.payment_terms || 'T/T 30/70',
        moq: d.quantity || 500,
        unitPrice: Number(d.unit_price) || 0,
        qty: d.quantity || 0,
        currency: d.currency || 'USD',
        leadTime: d.lead_time || 20,
        docRefs: (d.doc_refs as string[]) || [],
        status: (d.status as any) || 'draft',
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      }));

      const transformedInteractions: CRMInteraction[] = (interactions || []).map(i => ({
        interactionId: i.interaction_id,
        buyerId: i.buyer_id,
        interactionType: i.interaction_type,
        subject: i.subject || undefined,
        messageSnippet: i.message_snippet || undefined,
        sentAt: i.sent_at ? new Date(i.sent_at) : undefined,
        opened: i.opened,
        replied: i.replied,
        nextFollowUpDate: i.next_follow_up_date ? new Date(i.next_follow_up_date) : undefined,
        createdAt: new Date(i.created_at),
      }));

      setState({
        buyers: transformedBuyers,
        deals: transformedDeals,
        interactions: transformedInteractions,
        kpi: {
          followUpNeeded,
          activeDeals,
          sampleToOrderCandidates,
          unsentDocuments,
        },
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated, loadData]);

  // 바이어 상태 업데이트
  const updateBuyerStage = useCallback(async (buyerId: string, stage: DealStatusStage) => {
    if (!user) return { error: new Error('로그인 필요') };

    const { error } = await supabase
      .from('buyers')
      .update({ status_stage: stage })
      .eq('id', buyerId);

    if (error) return { error };

    setState(prev => ({
      ...prev,
      buyers: prev.buyers.map(b =>
        b.buyerId === buyerId ? { ...b, statusStage: stage } : b
      ),
    }));

    return { data: true };
  }, [user]);

  // 후속 날짜 업데이트
  const updateFollowUpDate = useCallback(async (buyerId: string, date: Date | null) => {
    if (!user) return { error: new Error('로그인 필요') };

    const { error } = await supabase
      .from('buyers')
      .update({ next_follow_up_date: date?.toISOString().split('T')[0] || null })
      .eq('id', buyerId);

    if (error) return { error };

    setState(prev => ({
      ...prev,
      buyers: prev.buyers.map(b =>
        b.buyerId === buyerId ? { ...b, nextFollowUpDate: date || undefined } : b
      ),
    }));

    return { data: true };
  }, [user]);

  // 인터랙션 추가
  const addInteraction = useCallback(async (
    buyerId: string,
    type: 'email' | 'call' | 'meeting' | 'chat',
    subject?: string,
    snippet?: string
  ) => {
    if (!user) return { error: new Error('로그인 필요') };

    const { data, error } = await supabase
      .from('buyer_interactions')
      .insert({
        buyer_id: buyerId,
        user_id: user.id,
        interaction_type: type,
        subject,
        message_snippet: snippet,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { error };

    const newInteraction: CRMInteraction = {
      interactionId: data.interaction_id,
      buyerId: data.buyer_id,
      interactionType: data.interaction_type,
      subject: data.subject || undefined,
      messageSnippet: data.message_snippet || undefined,
      sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
      opened: data.opened,
      replied: data.replied,
      createdAt: new Date(data.created_at),
    };

    setState(prev => ({
      ...prev,
      interactions: [newInteraction, ...prev.interactions],
    }));

    return { data: newInteraction };
  }, [user]);

  // 딜 생성
  const createDeal = useCallback(async (buyerId: string, dealData: Partial<CRMDeal>) => {
    if (!user) return { error: new Error('로그인 필요') };

    const { data, error } = await supabase
      .from('deals')
      .insert({
        user_id: user.id,
        buyer_id: buyerId,
        product_id: dealData.productId || null,
        quantity: dealData.qty || dealData.moq || 500,
        unit_price: dealData.unitPrice || 0,
        currency: dealData.currency || 'USD',
        incoterms: dealData.incoterms || 'FOB',
        payment_terms: dealData.paymentTerms || 'T/T 30/70',
        lead_time: dealData.leadTime || 20,
        trade_stage_enum: dealData.tradeStage || 'first_proposal',
        doc_refs: [],
        status: 'draft',
      })
      .select()
      .single();

    if (error) return { error };

    const newDeal: CRMDeal = {
      dealId: data.id,
      buyerId: data.buyer_id || '',
      productId: data.product_id || undefined,
      tradeStage: (data.trade_stage_enum as any) || 'first_proposal',
      incoterms: data.incoterms || 'FOB',
      paymentTerms: data.payment_terms || 'T/T 30/70',
      moq: data.quantity || 500,
      unitPrice: Number(data.unit_price) || 0,
      qty: data.quantity || 0,
      currency: data.currency || 'USD',
      leadTime: data.lead_time || 20,
      docRefs: [],
      status: 'draft',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    setState(prev => ({
      ...prev,
      deals: [newDeal, ...prev.deals],
    }));

    return { data: newDeal };
  }, [user]);

  // 바이어별 딜 가져오기
  const getDealsForBuyer = useCallback((buyerId: string) => {
    return state.deals.filter(d => d.buyerId === buyerId);
  }, [state.deals]);

  // 바이어별 인터랙션 가져오기
  const getInteractionsForBuyer = useCallback((buyerId: string) => {
    return state.interactions.filter(i => i.buyerId === buyerId);
  }, [state.interactions]);

  // 스테이지별 바이어 그룹핑
  const getBuyersByStage = useCallback(() => {
    const grouped: Record<DealStatusStage, CRMBuyer[]> = {
      lead: [],
      contacted: [],
      replied: [],
      sample: [],
      negotiation: [],
      won: [],
      lost: [],
    };

    state.buyers.forEach(buyer => {
      const stage = buyer.statusStage || 'lead';
      if (grouped[stage]) {
        grouped[stage].push(buyer);
      }
    });

    return grouped;
  }, [state.buyers]);

  return {
    ...state,
    loadData,
    updateBuyerStage,
    updateFollowUpDate,
    addInteraction,
    createDeal,
    getDealsForBuyer,
    getInteractionsForBuyer,
    getBuyersByStage,
  };
}
