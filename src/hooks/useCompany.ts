import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_swift: string | null;
  default_moq: number;
  default_lead_time: number;
  default_incoterms: string;
  default_payment_terms: string;
  created_at: string;
  updated_at: string;
}

interface CompanyState {
  company: Company | null;
  loading: boolean;
  error: string | null;
}

export function useCompany() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<CompanyState>({
    company: null,
    loading: true,
    error: null,
  });

  // 회사 정보 조회
  const fetchCompany = useCallback(async () => {
    if (!user) {
      setState({ company: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      setState({ company: null, loading: false, error: error.message });
      return;
    }

    setState({ company: data, loading: false, error: null });
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompany();
    } else {
      setState({ company: null, loading: false, error: null });
    }
  }, [isAuthenticated, fetchCompany]);

  // 회사 생성
  const createCompany = useCallback(async (companyData: Omit<Partial<Company>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { name: string }) => {
    if (!user) return { error: new Error('로그인이 필요합니다') };

    const insertData = {
      name: companyData.name,
      user_id: user.id,
      contact_email: companyData.contact_email ?? null,
      contact_phone: companyData.contact_phone ?? null,
      address: companyData.address ?? null,
      website: companyData.website ?? null,
      logo_url: companyData.logo_url ?? null,
      bank_name: companyData.bank_name ?? null,
      bank_account: companyData.bank_account ?? null,
      bank_swift: companyData.bank_swift ?? null,
      default_moq: companyData.default_moq ?? 500,
      default_lead_time: companyData.default_lead_time ?? 20,
      default_incoterms: companyData.default_incoterms ?? 'FOB',
      default_payment_terms: companyData.default_payment_terms ?? 'T/T 30/70',
    };

    const { data, error } = await supabase
      .from('companies')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { error };
    }

    setState(prev => ({ ...prev, company: data }));
    return { data };
  }, [user]);

  // 회사 업데이트
  const updateCompany = useCallback(async (updates: Partial<Company>) => {
    if (!user || !state.company) return { error: new Error('회사 정보가 없습니다') };

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', state.company.id)
      .select()
      .single();

    if (error) {
      return { error };
    }

    setState(prev => ({ ...prev, company: data }));
    return { data };
  }, [user, state.company]);

  // 로고 업로드
  const uploadLogo = useCallback(async (file: File) => {
    if (!user) return { error: new Error('로그인이 필요합니다') };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return { error: uploadError };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName);

    // 회사 정보에 로고 URL 업데이트
    if (state.company) {
      await updateCompany({ logo_url: publicUrl });
    }

    return { data: { url: publicUrl } };
  }, [user, state.company, updateCompany]);

  return {
    ...state,
    hasCompany: !!state.company,
    fetchCompany,
    createCompany,
    updateCompany,
    uploadLogo,
  };
}
