import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Expert {
  id: string;
  name: string;
  title: string;
  organization: string;
  specialty: string[];
  rating: number;
  review_count: number;
  response_time: string;
  verified: boolean;
  profile_image_url?: string;
  bio?: string;
  is_active: boolean;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  expert_id: string | null;
  workspace_id: string | null;
  document_ids: string[];
  request_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  priority: string;
  requested_at: string;
  responded_at?: string;
  completed_at?: string;
  expert_notes?: string;
  user_notes?: string;
  created_at: string;
  expert?: Expert;
}

export function useExperts() {
  return useQuery({
    queryKey: ['experts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      
      // Transform specialty from JSON to string array
      return (data || []).map(expert => ({
        ...expert,
        specialty: Array.isArray(expert.specialty) ? expert.specialty : [],
      })) as Expert[];
    },
  });
}

export function useVerificationRequests() {
  return useQuery({
    queryKey: ['verification-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('expert_verification_requests')
        .select(`
          *,
          expert:experts(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(req => ({
        ...req,
        document_ids: Array.isArray(req.document_ids) ? req.document_ids : [],
        expert: req.expert ? {
          ...req.expert,
          specialty: Array.isArray(req.expert.specialty) ? req.expert.specialty : [],
        } : undefined,
      })) as VerificationRequest[];
    },
  });
}

export function useCreateVerificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expertId,
      description,
      documentIds = [],
      requestType = 'document_review',
      priority = 'normal',
    }: {
      expertId: string;
      description?: string;
      documentIds?: string[];
      requestType?: string;
      priority?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { data, error } = await supabase
        .from('expert_verification_requests')
        .insert({
          user_id: user.id,
          expert_id: expertId,
          description,
          document_ids: documentIds,
          request_type: requestType,
          priority,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      toast.success('검증 요청이 등록되었습니다.', {
        description: '전문가가 확인 후 연락드릴 예정입니다.',
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('로그인')) {
        toast.error('로그인이 필요합니다.', {
          description: '검증 요청을 위해 먼저 로그인해주세요.',
        });
      } else {
        toast.error('요청 실패', {
          description: error.message,
        });
      }
    },
  });
}

export function useCancelVerificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const { error } = await supabase
        .from('expert_verification_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      toast.success('요청이 취소되었습니다.');
    },
    onError: (error: Error) => {
      toast.error('취소 실패', {
        description: error.message,
      });
    },
  });
}
