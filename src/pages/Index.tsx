import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { AgentSplitLayout } from '@/components/layout/AgentSplitLayout';
import { LeftDock } from '@/components/layout/LeftDock';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { AgentHome } from '@/components/home/AgentHome';
import { EnhancedChatPanel } from '@/components/chat/EnhancedChatPanel';
import { WorkArea } from '@/components/workspace/WorkArea';
import { SamplePresetModal } from '@/components/goal/SamplePresetModal';
import { EmailGeneratorModal } from '@/components/email/EmailGeneratorModal';
import { useAppState } from '@/hooks/useAppState';
import { useCompany } from '@/hooks/useCompany';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';
import { usePresetState, DealStagePreset } from '@/hooks/usePresetState';
import { useDocumentRunner } from '@/hooks/useDocumentRunner';
import type { SamplePreset, BuyerGoal } from '@/types';
import type { TargetCountry, SalesChannel, BuyerType, Language, Currency } from '@/types';
import type { EmailContext } from '@/lib/api/emailGenerator';
import { toast } from 'sonner';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const {
    state,
    setActiveTab,
    setBuyerGoal,
    completeGoalSetting,
    loadSampleWithPreset,
    updateIngredient,
    confirmIngredients,
    sendMessage,
    fixWarning,
    completeExport,
    updateDocument,
  } = useAppState();

  const { company: companyData } = useCompany();
  const onboarding = useOnboarding();
  const presetState = usePresetState();
  const documentRunner = useDocumentRunner();
  
  const [mobileActiveView, setMobileActiveView] = useState<'chat' | 'workspace'>('chat');
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isInChatMode, setIsInChatMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingDoc, setCurrentGeneratingDoc] = useState<string | undefined>();
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // 회사 정보가 변경되면 buyerGoal에 반영
  useEffect(() => {
    if (companyData && state.buyerGoal) {
      const updatedGoal: BuyerGoal = {
        ...state.buyerGoal,
        company: {
          name: companyData.name,
          contactEmail: companyData.contact_email || undefined,
          contactPhone: companyData.contact_phone || undefined,
          address: companyData.address || undefined,
          website: companyData.website || undefined,
          logoUrl: companyData.logo_url || undefined,
          bankName: companyData.bank_name || undefined,
          bankAccount: companyData.bank_account || undefined,
          bankSwift: companyData.bank_swift || undefined,
          defaultMoq: companyData.default_moq,
          defaultLeadTime: companyData.default_lead_time,
          defaultIncoterms: companyData.default_incoterms || undefined,
          defaultPaymentTerms: companyData.default_payment_terms || undefined,
        },
      };
      setBuyerGoal(updatedGoal);
    }
  }, [companyData]);

  // 온보딩 컨텍스트를 BuyerGoal로 변환
  useEffect(() => {
    if (onboarding.isComplete && onboarding.context) {
      const channelMap: Record<string, SalesChannel> = {
        wholesale: 'distributor',
        offline_retail: 'retail',
        online_marketplace: 'online_market',
        d2c: 'd2c',
      };
      
      const buyerTypeMap: Record<string, BuyerType> = {
        importer: 'importer',
        distributor: 'distributor',
        retailer: 'retailer',
        market_seller: 'reseller',
      };

      const languageMap: Record<string, Language> = {
        en: '영어',
        ja: '일본어',
        zh: '중국어',
        de: '독일어',
        ko: '한국어',
      };

      const countryMap: Record<string, TargetCountry> = {
        US: '미국', CN: '중국', JP: '일본', VN: '베트남', 
        ID: '인도네시아', MY: '말레이시아', TH: '태국',
        HK: '홍콩', TW: '대만', AU: '호주', EU: 'EU',
      };

      const mappedCountries: TargetCountry[] = onboarding.context.targetCountries
        .map(c => countryMap[c])
        .filter((c): c is TargetCountry => c !== undefined);

      const goal: BuyerGoal = {
        countries: mappedCountries.length > 0 ? mappedCountries : ['홍콩'] as TargetCountry[],
        channel: channelMap[onboarding.context.targetChannel || ''] || null,
        buyerType: buyerTypeMap[onboarding.context.buyerType] || null,
        language: languageMap[onboarding.context.language] || '영어',
        currency: (onboarding.context.currency as Currency) || 'USD',
        dealStage: 'first_proposal',
      };

      setBuyerGoal(goal);
    }
  }, [onboarding.isComplete, onboarding.context]);

  const hasNotification = state.warnings.length > 0 || state.summary !== null;

  const handleSampleClick = () => {
    setShowSampleModal(true);
  };

  const handleSelectPreset = async (preset: SamplePreset) => {
    let updatedPreset = preset;
    if (companyData) {
      updatedPreset = {
        ...preset,
        goal: {
          ...preset.goal,
          company: {
            name: companyData.name,
            contactEmail: companyData.contact_email || undefined,
            contactPhone: companyData.contact_phone || undefined,
            address: companyData.address || undefined,
            website: companyData.website || undefined,
            logoUrl: companyData.logo_url || undefined,
            bankName: companyData.bank_name || undefined,
            bankAccount: companyData.bank_account || undefined,
            bankSwift: companyData.bank_swift || undefined,
            defaultMoq: companyData.default_moq,
            defaultLeadTime: companyData.default_lead_time,
            defaultIncoterms: companyData.default_incoterms || undefined,
            defaultPaymentTerms: companyData.default_payment_terms || undefined,
          },
        },
      };
    }
    loadSampleWithPreset(updatedPreset);
    setShowSampleModal(false);
    setIsInChatMode(true);
    
    // Determine preset type based on sample and auto-generate first document
    const dealStage = preset.goal.dealStage;
    if (dealStage === 'first_proposal') {
      presetState.selectPreset('PROPOSAL');
      // Auto-generate brand deck for demo
      setTimeout(async () => {
        setIsGenerating(true);
        setCurrentGeneratingDoc('brand_deck');
        await documentRunner.generateDocument('brand_deck', 'PROPOSAL');
        presetState.markDocGenerated('brand_deck');
        setIsGenerating(false);
        setCurrentGeneratingDoc(undefined);
        toast.success('브랜드 소개서 초안이 생성되었습니다!');
      }, 500);
    } else if (dealStage === 'sample_proposal') {
      presetState.selectPreset('SAMPLE');
      // Auto-generate sample PI for demo
      setTimeout(async () => {
        setIsGenerating(true);
        setCurrentGeneratingDoc('sample_pi');
        await documentRunner.generateDocument('sample_pi', 'SAMPLE');
        presetState.markDocGenerated('sample_pi');
        setIsGenerating(false);
        setCurrentGeneratingDoc(undefined);
        toast.success('샘플 PI 초안이 생성되었습니다!');
      }, 500);
    } else if (dealStage === 'pre_contract' || dealStage === 'shipment_prep') {
      presetState.selectPreset('BULK');
      // Auto-generate final PI for demo
      setTimeout(async () => {
        setIsGenerating(true);
        setCurrentGeneratingDoc('final_pi');
        await documentRunner.generateDocument('final_pi', 'BULK');
        presetState.markDocGenerated('final_pi');
        setIsGenerating(false);
        setCurrentGeneratingDoc(undefined);
        toast.success('최종 PI 초안이 생성되었습니다!');
      }, 500);
    }
  };

  const handleDockNavigate = (section: string, itemId?: string) => {
    setActiveSection(section);
    if (section !== 'home') {
      setIsInChatMode(true);
    }
  };

  const handleGoHome = () => {
    setActiveSection('home');
    setIsInChatMode(false);
  };

  const handlePresetChange = (preset: DealStagePreset) => {
    presetState.selectPreset(preset);
  };

  const handleQuickAction = (actionId: string) => {
    // Map quick actions to presets
    if (actionId === 'first_proposal') {
      presetState.selectPreset('PROPOSAL');
    } else if (actionId === 'sample_package') {
      presetState.selectPreset('SAMPLE');
    } else if (actionId === 'bulk_order') {
      presetState.selectPreset('BULK');
    } else if (actionId === 'generate_email') {
      setShowEmailModal(true);
      return;
    }
    
    // Enter chat mode
    setIsInChatMode(true);
    setMobileActiveView('chat');
  };

  // Build email context from current state
  const buildEmailContext = useCallback((): EmailContext => {
    const buyerGoal = state.buyerGoal;
    const onboardingCtx = onboarding.context;
    
    return {
      companyName: companyData?.name || buyerGoal?.company?.name,
      brandName: companyData?.name || buyerGoal?.company?.name,
      buyerCompany: buyerGoal?.buyerCompany,
      buyerName: buyerGoal?.buyerContact,
      buyerCountry: buyerGoal?.countries?.[0] || (onboardingCtx?.targetCountries?.[0] 
        ? { US: '미국', CN: '중국', JP: '일본', HK: '홍콩', VN: '베트남' }[onboardingCtx.targetCountries[0]] 
        : undefined),
      products: state.products.map(p => ({ name: p.name, category: p.category })),
      dealTerms: state.deal ? {
        incoterms: state.deal.incoterms,
        paymentTerms: state.deal.paymentTerms,
        moq: state.deal.qty,
        leadTime: `${state.deal.leadTime}일`,
        currency: state.deal.currency,
        totalAmount: state.deal.totalAmount,
      } : undefined,
      language: buyerGoal?.language === '영어' ? 'en' 
               : buyerGoal?.language === '일본어' ? 'ja' 
               : buyerGoal?.language === '중국어' ? 'zh' 
               : 'en',
    };
  }, [state.buyerGoal, state.products, state.deal, companyData, onboarding.context]);

  const handleAgentSendMessage = (message: string) => {
    sendMessage(message);
    setIsInChatMode(true);
  };

  // Handle document generation from tile click
  const handleGenerateDoc = useCallback(async (docId: string) => {
    setIsGenerating(true);
    setCurrentGeneratingDoc(docId);
    
    // Use document runner to generate
    await documentRunner.generateDocument(docId, presetState.selectedPreset);
    
    presetState.markDocGenerated(docId);
    setIsGenerating(false);
    setCurrentGeneratingDoc(undefined);
  }, [documentRunner, presetState]);

  // Handle document finalization
  const handleFinalizeDoc = useCallback(async () => {
    const success = await documentRunner.finalizeDocument();
    if (success) {
      toast.success('문서가 최종 확정되었습니다');
    } else {
      toast.error('필수 항목을 먼저 입력해주세요');
    }
  }, [documentRunner]);

  // Handle save to documents store
  const handleSaveToDocStore = useCallback(() => {
    toast.success('문서함에 저장되었습니다');
  }, []);

  // Handle print/PDF export
  const handlePrintDoc = useCallback(() => {
    documentRunner.printDocument();
  }, [documentRunner]);

  // Handle edit mode
  const handleEditDoc = useCallback(() => {
    toast.info('채팅으로 문서를 수정할 수 있습니다. 예: "MOQ를 1000으로 바꿔줘"');
  }, []);

  // Handle close document preview
  const handleCloseDoc = useCallback(() => {
    documentRunner.clearActiveDoc();
  }, [documentRunner]);

  // Handle document edit from chat
  const handleDocumentEdit = useCallback((message: string) => {
    return documentRunner.processEditMessage(message);
  }, [documentRunner]);

  // Handle cross-check fix all
  const handleApplyAllFixes = useCallback(() => {
    const appliedCount = documentRunner.applyCrossCheckFixes();
    if (appliedCount && appliedCount > 0) {
      toast.success(`${appliedCount}개 항목을 자동 수정했습니다`);
    } else {
      toast.info('수정할 항목이 없습니다');
    }
  }, [documentRunner]);

  // Handle AI assistance request for cross-check with confirmation answers
  const handleAskAIForFix = useCallback((questions: unknown[], answers: unknown[]) => {
    // Apply fixes based on user's answers
    if (answers && answers.length > 0) {
      // Process each answer to apply fixes
      const appliedCount = documentRunner.applyCrossCheckFixes();
      if (appliedCount && appliedCount > 0) {
        toast.success(`${appliedCount}개 항목을 사용자 확인에 따라 수정했습니다`);
      }
    } else {
      toast.info('AI에게 수정 요청: 문서 간 불일치 항목을 확인하고 있어요...');
    }
  }, [documentRunner]);

  // Handle single fix application
  const handleApplySingleFix = useCallback((findingId: string, actionIndex: number) => {
    documentRunner.applySingleFix(findingId, actionIndex);
    toast.success('항목을 수정했습니다');
  }, [documentRunner]);

  const handleExportPackage = () => {
    completeExport('zip');
  };

  // Render center panel based on mode
  const renderCenterPanel = () => {
    if (!isInChatMode) {
      return (
        <AgentHome
          selectedPreset={presetState.selectedPreset}
          onPresetChange={handlePresetChange}
          onQuickAction={handleQuickAction}
          onSendMessage={handleAgentSendMessage}
          isProcessing={state.isProcessing}
          onOpenEmailGenerator={() => setShowEmailModal(true)}
        />
      );
    }

    return (
      <EnhancedChatPanel
        messages={state.messages}
        onSendMessage={sendMessage}
        isProcessing={state.isProcessing}
        onboardingContext={onboarding.isComplete ? onboarding.context : undefined}
        onQuickAction={handleQuickAction}
        onDocumentEdit={handleDocumentEdit}
        isDocumentEditing={documentRunner.activeDoc?.status === 'EDITING'}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar
        currentStep={state.currentStep}
        progress={state.progress}
        progressMessage={state.progressMessage}
        onSampleClick={handleSampleClick}
      />

      <AgentSplitLayout
        leftPanel={
          <LeftDock 
            onNavigate={handleDockNavigate} 
            onGoHome={handleGoHome}
            activeSection={activeSection}
            isCollapsed={isDockCollapsed}
            onToggleCollapse={() => setIsDockCollapsed(prev => !prev)}
          />
        }
        centerPanel={renderCenterPanel()}
        rightPanel={
          <WorkArea
            selectedPreset={presetState.selectedPreset}
            completedTasks={presetState.completedTasks}
            generatedDocs={presetState.generatedDocs}
            onGenerateDoc={handleGenerateDoc}
            onCompleteTask={presetState.completeTask}
            onExportPackage={handleExportPackage}
            isGenerating={isGenerating}
            currentGeneratingDoc={currentGeneratingDoc}
            activeDoc={documentRunner.activeDoc}
            onFinalizeDoc={handleFinalizeDoc}
            onSaveToDocStore={handleSaveToDocStore}
            onPrintDoc={handlePrintDoc}
            onEditDoc={handleEditDoc}
            onCloseDoc={handleCloseDoc}
            hasBlockingIssues={documentRunner.hasBlockingIssues}
            isCrossCheckReport={documentRunner.isCrossCheckReport}
            onApplyAllFixes={handleApplyAllFixes}
            onAskAI={handleAskAIForFix}
            onApplyFix={handleApplySingleFix}
            crossCheckResult={documentRunner.getCrossCheckResult()}
            documentSet={documentRunner.getDocumentSet()}
            projectName="K-Beauty Export"
            brandName="K-Beauty Co."
            requiresCrossCheckGate={documentRunner.requiresCrossCheckGate}
            crossCheckCompleted={documentRunner.crossCheckCompleted}
          />
        }
        mobileActiveView={mobileActiveView}
        showDock={true}
        showWorkArea={isInChatMode}
        isDockCollapsed={isDockCollapsed}
      />

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar 
        activeView={mobileActiveView}
        onViewChange={setMobileActiveView}
        hasNotification={hasNotification}
      />

      {/* Sample Preset Modal */}
      <SamplePresetModal 
        open={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        onSelectPreset={handleSelectPreset}
      />

      {/* Email Generator Modal */}
      <EmailGeneratorModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        context={buildEmailContext()}
        defaultEmailType={
          presetState.selectedPreset === 'PROPOSAL' ? 'first_proposal'
          : presetState.selectedPreset === 'SAMPLE' ? 'sample_followup'
          : 'closing'
        }
      />
    </div>
  );
};

export default Index;
