import { useState, useCallback } from 'react';
import type { 
  AppState, 
  Step, 
  ChatMessage, 
  Product, 
  Document, 
  ValidationWarning,
  DraftSummary,
  Deal,
  BuyerPackFile,
  HistoryEntry,
  Ingredient,
  BuyerGoal,
  SamplePreset,
  ToolCallResult,
} from '@/types';
import { 
  sampleCompany, 
  sampleProducts, 
  sampleSummary, 
  sampleDeal,
  samplePIDocument,
  sampleContractDocument,
  sampleWarnings,
  generateBuyerPackFiles,
  CHANNEL_LABELS
} from '@/data/sampleData';
import { streamTradeAssistant } from '@/lib/api/tradeAssistant';
import { useToolCallHandler } from '@/hooks/useToolCallHandler';
import { useToast } from '@/hooks/use-toast';

const initialState: AppState = {
  currentStep: 'upload',
  activeTab: 0,
  company: null,
  products: [],
  marketChoice: null,
  buyerGoal: null,
  summary: null,
  deal: null,
  documents: [],
  warnings: [],
  buyerPack: [],
  history: [],
  messages: [],
  isProcessing: false,
  progress: 0,
  progressMessage: '',
  isSampleMode: false,
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);
  const { toast } = useToast();
  const { handleToolCalls } = useToolCallHandler();

  // Step management
  const setStep = useCallback((step: Step) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  // Tab management
  const setActiveTab = useCallback((tab: number) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // Progress management
  const setProgress = useCallback((progress: number, message: string) => {
    setState(prev => ({ 
      ...prev, 
      progress, 
      progressMessage: message,
      isProcessing: progress < 100
    }));
  }, []);

  // Update buyer goal
  const setBuyerGoal = useCallback((goal: BuyerGoal) => {
    setState(prev => ({ ...prev, buyerGoal: goal }));
  }, []);

  // Complete goal setting
  const completeGoalSetting = useCallback(() => {
    if (!state.buyerGoal) return;
    
    toast({
      title: '목표 설정 완료!',
      description: `${state.buyerGoal.countries.join('/')} · ${state.buyerGoal.channel ? CHANNEL_LABELS[state.buyerGoal.channel] : ''} 기준으로 패키지가 생성됩니다.`,
    });
  }, [state.buyerGoal, toast]);

  // Load sample data with preset
  const loadSampleWithPreset = useCallback((preset: SamplePreset) => {
    const buyerPack = generateBuyerPackFiles(preset.goal);
    
    setState(prev => ({
      ...prev,
      company: sampleCompany,
      products: sampleProducts,
      buyerGoal: preset.goal,
      currentStep: 'ingredients',
      isSampleMode: true,
      messages: [
        {
          id: 'welcome-1',
          role: 'assistant',
          content: `안녕하세요! K-뷰티 AI 무역비서입니다.\n\n📍 **목표**: ${preset.goal.countries.join(' · ')} · ${preset.goal.channel ? CHANNEL_LABELS[preset.goal.channel] : ''}\n\n샘플 데이터를 불러왔어요. 성분을 확인하고 수정하신 후 "성분 확인 완료" 버튼을 눌러주세요.\n\n💡 저에게 국가별 규제, 성분 분석, 거래 조건 등을 물어보세요!\n\n*초안입니다. 최종 제출 전 확인이 필요합니다.*`,
          timestamp: new Date(),
        }
      ],
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date(),
          action: '샘플 프리셋 로드',
          status: 'draft',
          goalBadge: `${preset.goal.countries[0]} · ${preset.goal.channel ? CHANNEL_LABELS[preset.goal.channel] : ''}`,
        }
      ],
    }));
  }, []);

  // Legacy sample load (for backwards compatibility)
  const loadSampleData = useCallback(() => {
    // Default to Hong Kong preset
    const defaultPreset: SamplePreset = {
      id: 'default',
      name: '홍콩 리테일러',
      description: '홍콩 오프라인 리테일러에게 제안',
      goal: {
        countries: ['홍콩'],
        channel: 'retail',
        buyerType: 'retailer',
        language: '영어',
        currency: 'HKD',
        dealStage: 'first_proposal',
      },
    };
    loadSampleWithPreset(defaultPreset);
  }, [loadSampleWithPreset]);

  // Update ingredient
  const updateIngredient = useCallback((productId: string, ingredientId: string, updates: Partial<Ingredient>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(product => 
        product.id === productId
          ? {
              ...product,
              ingredientsConfirmed: product.ingredientsConfirmed.map(ing =>
                ing.id === ingredientId ? { ...ing, ...updates } : ing
              )
            }
          : product
      )
    }));
  }, []);

  // Confirm ingredients and generate summary
  const confirmIngredients = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true,
      progress: 0,
      progressMessage: '자료 읽는 중...'
    }));

    // Simulate processing
    await new Promise(r => setTimeout(r, 800));
    setState(prev => ({ ...prev, progress: 30, progressMessage: '초안 만드는 중...' }));
    
    await new Promise(r => setTimeout(r, 1000));
    setState(prev => ({ ...prev, progress: 60, progressMessage: '수출 요건 확인 중...' }));
    
    await new Promise(r => setTimeout(r, 800));
    
    // Generate buyer pack based on goal
    const buyerPack = state.buyerGoal ? generateBuyerPackFiles(state.buyerGoal) : [];
    const goalBadge = state.buyerGoal 
      ? `${state.buyerGoal.countries[0]} · ${state.buyerGoal.channel ? CHANNEL_LABELS[state.buyerGoal.channel] : ''}`
      : undefined;
    
    setState(prev => ({ 
      ...prev, 
      progress: 100, 
      progressMessage: '완성!',
      isProcessing: false,
      currentStep: 'draft',
      activeTab: 0,
      summary: sampleSummary,
      buyerPack,
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `✅ 성분 확인이 완료되었어요!\n\n📍 **목표**: ${goalBadge || '미설정'}\n\n수출 준비 요약(초안)을 만들었습니다. 우측 탭에서 확인해보세요.\n\n이제 저에게 다음을 요청할 수 있어요:\n- "바이어 패키지 만들어줘"\n- "PI 만들어줘"\n- "실수 체크해줘"\n\n*초안입니다. 최종 제출 전 확인이 필요합니다.*`,
          timestamp: new Date(),
        }
      ],
      history: [
        ...prev.history,
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date(),
          action: '성분 확인 완료',
          status: 'draft',
          goalBadge,
        }
      ]
    }));
  }, [state.buyerGoal]);

  // Send chat message with real AI
  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, loadingMessage],
      isProcessing: true,
      progressMessage: '무역비서가 정리 중이에요...',
    }));

    let assistantContent = '';
    let pendingToolCallResults: ToolCallResult[] = [];

    // Prepare context for AI (include active doc for tool calling)
    const context: any = {
      products: state.products,
      deal: state.deal,
      targetCountry: state.marketChoice?.selectedCountries?.[0],
    };

    // Try to include active document context from appStore
    try {
      const { useAppStore } = await import('@/stores/appStore');
      const activeDoc = useAppStore.getState().getActiveDoc();
      if (activeDoc) {
        context.activeDoc = {
          docId: activeDoc.docId,
          templateKey: activeDoc.templateKey,
          status: activeDoc.status,
          fields: activeDoc.fields,
        };
      }
    } catch { /* appStore not available */ }

    // Get conversation history (last 10 messages)
    const conversationHistory = [...state.messages, userMessage]
      .slice(-10)
      .filter(m => !m.isLoading)
      .map(m => ({ role: m.role, content: m.content }));

    await streamTradeAssistant({
      messages: conversationHistory,
      context,
      onToolCalls: (toolCalls) => {
        // Execute tool calls and capture results for visualization
        pendingToolCallResults = handleToolCalls(toolCalls);
        
        // Attach results to the assistant message
        setState(prev => ({
          ...prev,
          messages: prev.messages.map((m, i) =>
            i === prev.messages.length - 1
              ? { ...m, toolCallResults: pendingToolCallResults }
              : m
          ),
        }));
      },
      onDelta: (delta) => {
        assistantContent += delta;
        setState(prev => ({
          ...prev,
          messages: prev.messages.map((m, i) => 
            i === prev.messages.length - 1 
              ? { ...m, content: assistantContent, isLoading: false, toolCallResults: pendingToolCallResults.length > 0 ? pendingToolCallResults : undefined }
              : m
          ),
        }));
      },
      onDone: () => {
        // Check if we should update documents based on content
        const lowerContent = content.toLowerCase();
        let newDocuments: Document[] = [];
        let newDeal: Deal | null = null;
        let newWarnings: ValidationWarning[] = [];
        let newBuyerPack: BuyerPackFile[] = [];
        let newStep: Step = state.currentStep;
        let newTab = state.activeTab;

        if (lowerContent.includes('pi') || lowerContent.includes('계약') || lowerContent.includes('거래')) {
          newDocuments = [samplePIDocument, sampleContractDocument];
          newDeal = sampleDeal;
          newStep = 'edit';
          newTab = 2;
        } else if (lowerContent.includes('실수') || lowerContent.includes('체크') || lowerContent.includes('검토')) {
          newWarnings = sampleWarnings;
          newStep = 'validate';
          newTab = 2;
        } else if (lowerContent.includes('패키지') || lowerContent.includes('바이어')) {
          newBuyerPack = state.buyerGoal ? generateBuyerPackFiles(state.buyerGoal) : [];
          newStep = 'export';
          newTab = 1;
        }

        setState(prev => ({
          ...prev,
          documents: newDocuments.length > 0 ? newDocuments : prev.documents,
          deal: newDeal || prev.deal,
          warnings: newWarnings.length > 0 ? newWarnings : prev.warnings,
          buyerPack: newBuyerPack.length > 0 ? newBuyerPack : prev.buyerPack,
          currentStep: newStep,
          activeTab: newTab,
          isProcessing: false,
          history: [
            ...prev.history,
            {
              id: `hist-${Date.now()}`,
              timestamp: new Date(),
              action: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
              status: 'draft',
            }
          ]
        }));
      },
      onError: (error) => {
        toast({
          title: 'AI 오류',
          description: error,
          variant: 'destructive',
        });
        setState(prev => ({
          ...prev,
          messages: prev.messages.slice(0, -1), // Remove loading message
          isProcessing: false,
        }));
      }
    });
  }, [state.products, state.deal, state.marketChoice, state.messages, state.currentStep, state.activeTab, toast]);

  // Fix warning
  const fixWarning = useCallback((warningId: string) => {
    setState(prev => ({
      ...prev,
      warnings: prev.warnings.filter(w => w.id !== warningId),
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: '✅ 수정 완료! 해당 항목의 불일치를 해결했어요.\n\n*수정된 내용은 모든 관련 문서에 자동 반영됩니다.*',
          timestamp: new Date(),
        }
      ]
    }));
  }, []);

  // Complete export
  const completeExport = useCallback((type: 'pdf' | 'zip' | 'link') => {
    const actionMap = { pdf: 'PDF 저장', zip: 'ZIP 다운로드', link: '링크 생성' };
    
    toast({
      title: actionMap[type],
      description: '완성! 지금 바로 바이어에게 보낼 수 있어요.',
    });
    
    setState(prev => ({
      ...prev,
      currentStep: 'export',
      history: [
        ...prev.history,
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date(),
          action: actionMap[type],
          status: 'complete',
        }
      ]
    }));
  }, [toast]);

  // Reset state
  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  // Update document content
  const updateDocument = useCallback((docId: string, content: string) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === docId
          ? { ...doc, content, updatedAt: new Date() }
          : doc
      ),
      history: [
        ...prev.history,
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date(),
          action: '문서 수정',
          status: 'draft',
        }
      ]
    }));
  }, []);

  return {
    state,
    setStep,
    setActiveTab,
    setProgress,
    setBuyerGoal,
    completeGoalSetting,
    loadSampleData,
    loadSampleWithPreset,
    updateIngredient,
    confirmIngredients,
    sendMessage,
    fixWarning,
    completeExport,
    resetState,
    updateDocument,
  };
}
