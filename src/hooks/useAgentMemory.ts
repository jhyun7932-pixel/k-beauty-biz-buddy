import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOnboarding } from './useOnboarding';

type MemoryType = 'preference' | 'template_param' | 'risk_policy' | 'tone_rule';

interface AgentMemory {
  memoryId: string;
  workspaceId: string | null;
  memoryType: MemoryType;
  key: string;
  value: Record<string, any> | null;
  confidence: number;
  updatedAt: string;
}

interface AgentMemoryState {
  memories: AgentMemory[];
  loading: boolean;
  error: string | null;
}

export function useAgentMemory() {
  const { user, isAuthenticated } = useAuth();
  const { workspaceId } = useOnboarding();
  const [state, setState] = useState<AgentMemoryState>({
    memories: [],
    loading: true,
    error: null,
  });

  // Load all memories for the workspace
  const loadMemories = useCallback(async () => {
    if (!user) {
      setState({ memories: [], loading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const memories: AgentMemory[] = (data || []).map(m => ({
        memoryId: m.memory_id,
        workspaceId: m.workspace_id,
        memoryType: m.memory_type as MemoryType,
        key: m.key,
        value: m.value as Record<string, any> | null,
        confidence: m.confidence || 0.5,
        updatedAt: m.updated_at,
      }));

      setState({ memories, loading: false, error: null });
    } catch (error: any) {
      setState({ memories: [], loading: false, error: error.message });
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMemories();
    } else {
      setState({ memories: [], loading: false, error: null });
    }
  }, [isAuthenticated, loadMemories]);

  // Get a specific memory by key
  const getMemory = useCallback((key: string): AgentMemory | undefined => {
    return state.memories.find(m => m.key === key);
  }, [state.memories]);

  // Get memories by type
  const getMemoriesByType = useCallback((type: MemoryType): AgentMemory[] => {
    return state.memories.filter(m => m.memoryType === type);
  }, [state.memories]);

  // Set or update a memory
  const setMemory = useCallback(async (
    key: string,
    type: MemoryType,
    value: Record<string, any>,
    confidence: number = 0.8
  ) => {
    if (!user) return { error: new Error('로그인이 필요합니다') };

    try {
      const existingMemory = state.memories.find(m => m.key === key);

      if (existingMemory) {
        // Update existing
        const { error } = await supabase
          .from('agent_memory')
          .update({
            value,
            confidence,
            memory_type: type,
            updated_at: new Date().toISOString(),
          })
          .eq('memory_id', existingMemory.memoryId);

        if (error) throw error;

        setState(prev => ({
          ...prev,
          memories: prev.memories.map(m =>
            m.memoryId === existingMemory.memoryId
              ? { ...m, value, confidence, memoryType: type, updatedAt: new Date().toISOString() }
              : m
          ),
        }));
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('agent_memory')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId || null,
            memory_type: type,
            key,
            value,
            confidence,
          })
          .select()
          .single();

        if (error) throw error;

        const newMemory: AgentMemory = {
          memoryId: data.memory_id,
          workspaceId: data.workspace_id,
          memoryType: data.memory_type as MemoryType,
          key: data.key,
          value: data.value as Record<string, any> | null,
          confidence: data.confidence || 0.5,
          updatedAt: data.updated_at,
        };

        setState(prev => ({
          ...prev,
          memories: [newMemory, ...prev.memories],
        }));
      }

      return { success: true };
    } catch (error: any) {
      return { error };
    }
  }, [user, workspaceId, state.memories]);

  // Delete a memory
  const deleteMemory = useCallback(async (key: string) => {
    if (!user) return { error: new Error('로그인이 필요합니다') };

    try {
      const memory = state.memories.find(m => m.key === key);
      if (!memory) return { error: new Error('메모리를 찾을 수 없습니다') };

      const { error } = await supabase
        .from('agent_memory')
        .delete()
        .eq('memory_id', memory.memoryId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        memories: prev.memories.filter(m => m.memoryId !== memory.memoryId),
      }));

      return { success: true };
    } catch (error: any) {
      return { error };
    }
  }, [user, state.memories]);

  // Get default trade values from memory
  const getDefaultTradeValues = useCallback(() => {
    const incoterms = getMemory('default_incoterms');
    const paymentTerms = getMemory('default_payment_terms');
    const moq = getMemory('default_moq');
    const leadTime = getMemory('default_lead_time');
    const toneStyle = getMemory('tone_style');
    const bannedPhrases = getMemory('banned_claim_phrases');

    return {
      incoterms: incoterms?.value?.value || 'FOB',
      paymentTerms: paymentTerms?.value?.value || 'T/T 30/70',
      moq: moq?.value?.value || 500,
      leadTime: leadTime?.value?.value || 20,
      toneStyle: toneStyle?.value?.value || 'professional',
      bannedPhrases: bannedPhrases?.value?.value || [],
    };
  }, [getMemory]);

  return {
    ...state,
    loadMemories,
    getMemory,
    getMemoriesByType,
    setMemory,
    deleteMemory,
    getDefaultTradeValues,
  };
}
