import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Settings, MessageCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatHeader } from './ChatHeader';
import { QuickActionChips } from './QuickActionChips';
import { ActionCard, DocCard, RiskCard, ChecklistCard } from './MessageCards';
import { ToolCallResultCard } from './ToolCallResultCard';
import { useOnboardingQuestions, ONBOARDING_QUESTIONS } from '@/hooks/useOnboardingQuestions';
import { isEditCommand } from '@/lib/chat/documentEditParser';
import type { ChatMessage } from '@/types';
import type { OnboardingContext } from '@/types/onboarding';

interface EnhancedChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onboardingContext?: OnboardingContext | null;
  onOpenSettings?: () => void;
  onMaterialUpload?: (materialId: string) => void;
  onQuickAction?: (actionId: string) => void;
  onDocumentEdit?: (message: string) => { isEdit: boolean; response: string };
  isDocumentEditing?: boolean;
}

const placeholders = [
  "예: '홍콩 바이어에게 보낼 제안 패키지 만들어줘'",
  "예: 'MOQ 300, 납기 20일, FOB로 반영해줘'",
  "예: '일본 규제에 맞게 성분표 체크해줘'",
];

// 빠른 실행 버튼별 시작 메시지
const QUICK_ACTION_INTRO: Record<string, string> = {
  first_proposal: '첫 제안 패키지를 만들기 위해 몇 가지 질문을 드릴게요.',
  sample_package: '샘플 패키지를 준비하기 위해 정보가 필요해요.',
  main_order: '본오더 패키지를 위한 거래 조건을 확인할게요.',
  compliance_check: '규제 체크를 위해 대상 국가와 제품 정보를 확인할게요.',
  create_pi: 'PI(견적서)를 만들기 위한 정보를 수집할게요.',
  followup_email: '후속 메일 작성을 위해 현재 상황을 파악할게요.',
};

export function EnhancedChatPanel({ 
  messages, 
  onSendMessage, 
  isProcessing,
  onboardingContext,
  onOpenSettings,
  onMaterialUpload,
  onQuickAction,
  onDocumentEdit,
  isDocumentEditing = false,
}: EnhancedChatPanelProps) {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentQuestion,
    answers,
    isComplete,
    answeredCount,
    totalQuestions,
    answerQuestion,
    skipQuestion,
    startQuestionFlow,
    resetQuestions,
    getQuestionMessage,
    generateSummaryMessage,
  } = useOnboardingQuestions();

  // 플레이스홀더 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, localMessages, currentQuestion]);

  // 질문 완료 시 요약 메시지 추가
  useEffect(() => {
    if (isComplete && Object.keys(answers).length > 0) {
      const summaryMsg: ChatMessage = {
        id: `summary-${Date.now()}`,
        role: 'assistant',
        content: generateSummaryMessage(),
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, summaryMsg]);
      
      // 실제 메시지로 전송
      onSendMessage(`[조건 정리 완료]\n${generateSummaryMessage()}`);
      resetQuestions();
    }
  }, [isComplete, answers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const userInput = input.trim();
    setInput('');
    
    // Add user message to local messages
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setLocalMessages(prev => [...prev, userMsg]);
    
    // Check if this is a document edit command
    if (isDocumentEditing && onDocumentEdit && isEditCommand(userInput)) {
      const result = onDocumentEdit(userInput);
      if (result.isEdit) {
        // Add AI response for the edit
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
        };
        setTimeout(() => {
          setLocalMessages(prev => [...prev, aiMsg]);
        }, 300);
        return;
      }
    }
    
    // 질문 플로우 중인 경우
    if (currentQuestion) {
      // 옵션이 있는 질문의 경우 매칭 시도
      if (currentQuestion.options) {
        const matchedOption = currentQuestion.options.find(opt => 
          opt.label.toLowerCase().includes(userInput.toLowerCase()) ||
          userInput.includes(opt.value)
        );
        if (matchedOption) {
          answerQuestion(currentQuestion.multiSelect ? [matchedOption.value] : matchedOption.value);
        } else {
          // 숫자로 선택한 경우
          const numMatch = userInput.match(/\d+/g);
          if (numMatch) {
            const selectedIndices = numMatch.map(n => parseInt(n) - 1);
            const selectedValues = selectedIndices
              .filter(i => i >= 0 && i < currentQuestion.options!.length)
              .map(i => currentQuestion.options![i].value);
            if (selectedValues.length > 0) {
              answerQuestion(currentQuestion.multiSelect ? selectedValues : selectedValues[0]);
            } else {
              answerQuestion(userInput);
            }
          } else {
            answerQuestion(userInput);
          }
        }
      } else {
        answerQuestion(userInput);
      }
    } else {
      // 일반 메시지 전송
      onSendMessage(userInput);
    }
  };

  const handleQuickAction = (actionId: string) => {
    if (onQuickAction) {
      onQuickAction(actionId);
    }
    
    // 인트로 메시지 추가
    const introMsg: ChatMessage = {
      id: `intro-${Date.now()}`,
      role: 'assistant',
      content: QUICK_ACTION_INTRO[actionId] || '필요한 정보를 수집할게요.',
      timestamp: new Date(),
    };
    setLocalMessages(prev => [...prev, introMsg]);
    
    // 해당 액션에 맞는 질문 플로우 시작
    startQuestionFlow(actionId);
  };

  const handleSkip = () => {
    skipQuestion();
  };

  // 현재 질문 메시지
  const questionMessage = getQuestionMessage();

  // 모든 메시지 합치기
  const allMessages = [...messages, ...localMessages];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Context Header */}
      <ChatHeader 
        countries={onboardingContext?.targetCountries?.map(c => {
          const countryMap: Record<string, string> = {
            US: '미국', CN: '중국', JP: '일본', VN: '베트남', 
            ID: '인도네시아', MY: '말레이시아', TH: '태국',
            HK: '홍콩', TW: '대만', AU: '호주', EU: 'EU',
          };
          return countryMap[c] || c;
        }) || ['홍콩', '일본']}
        channel={onboardingContext?.targetChannel === 'wholesale' ? '도매' : 
                onboardingContext?.targetChannel === 'offline_retail' ? '리테일' : 
                onboardingContext?.targetChannel === 'online_marketplace' ? '온라인' : '도매'}
        tradeStage={onboardingContext?.tradeStage === 'first_proposal' ? '첫 제안' : 
                   onboardingContext?.tradeStage === 'sample' ? '샘플' : 
                   onboardingContext?.tradeStage === 'main_order' ? '본오더' : '첫 제안'}
        language={onboardingContext?.language === 'en' ? '영어' : 
                 onboardingContext?.language === 'ja' ? '일본어' : 
                 onboardingContext?.language === 'zh' ? '중국어' : '영어'}
        currency={onboardingContext?.currency || 'USD'}
        onMaterialClick={onMaterialUpload}
      />

      {/* Quick Action Chips */}
      <QuickActionChips onAction={handleQuickAction} disabled={isProcessing || !!currentQuestion} />

      {/* Progress indicator when in question flow */}
      {currentQuestion && totalQuestions > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>질문 {answeredCount + 1} / {totalQuestions}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={handleSkip}
            >
              건너뛰기
            </Button>
          </div>
          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((answeredCount + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 && !currentQuestion ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              무역비서가 도와드릴게요
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              위의 빠른 실행 버튼을 누르거나, 필요한 작업을 말씀해주세요.
            </p>
            
            {/* 시작 가이드 */}
            <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-sm">
              <button
                onClick={() => handleQuickAction('first_proposal')}
                className="p-3 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <span className="text-lg">📦</span>
                <p className="text-sm font-medium mt-1">첫 제안 패키지</p>
                <p className="text-xs text-muted-foreground">바이어에게 보낼 소개 자료</p>
              </button>
              <button
                onClick={() => handleQuickAction('compliance_check')}
                className="p-3 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <span className="text-lg">✅</span>
                <p className="text-sm font-medium mt-1">규제 체크</p>
                <p className="text-xs text-muted-foreground">국가별 수출 요건 확인</p>
              </button>
              <button
                onClick={() => handleQuickAction('create_pi')}
                className="p-3 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <span className="text-lg">📄</span>
                <p className="text-sm font-medium mt-1">견적서(PI)</p>
                <p className="text-xs text-muted-foreground">가격/조건 제안서 작성</p>
              </button>
              <button
                onClick={() => handleQuickAction('followup_email')}
                className="p-3 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <span className="text-lg">✉️</span>
                <p className="text-sm font-medium mt-1">후속 메일</p>
                <p className="text-xs text-muted-foreground">바이어 팔로업 이메일</p>
              </button>
            </div>
          </div>
        ) : (
          <>
            {allMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} fade-in-up`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-muted-foreground">문서를 생성하고 있어요…</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-primary">
                          <span>🔍</span><span>요청 분석 완료</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground animate-pulse">
                          <span>✍️</span><span>내용 생성 중...</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Tool Call Result Cards */}
                      {message.toolCallResults && message.toolCallResults.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {message.toolCallResults.map((result, idx) => (
                            <ToolCallResultCard
                              key={`${message.id}-tc-${idx}`}
                              toolCall={result.toolCall}
                              beforeValue={result.beforeValue}
                              success={result.success}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* 현재 질문 표시 */}
            {questionMessage && (
              <div className="flex justify-start fade-in-up">
                <div className="max-w-[85%] chat-bubble-ai">
                  <p className="text-sm whitespace-pre-wrap">{questionMessage.content}</p>
                  
                  {/* 옵션 버튼 */}
                  {currentQuestion?.options && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentQuestion.options.map((opt, idx) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const userMsg: ChatMessage = {
                              id: `user-${Date.now()}`,
                              role: 'user',
                              content: opt.label,
                              timestamp: new Date(),
                            };
                            setLocalMessages(prev => [...prev, userMsg]);
                            answerQuestion(currentQuestion.multiSelect ? [opt.value] : opt.value);
                          }}
                          className="px-3 py-1.5 text-xs rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentQuestion 
              ? currentQuestion.placeholder || '답변을 입력하세요...'
              : placeholders[placeholderIndex]
            }
            disabled={isProcessing}
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2 text-center">
          {currentQuestion 
            ? '💡 위 버튼을 클릭하거나 직접 입력하세요'
            : isDocumentEditing
            ? '📝 예: "MOQ를 1000으로 바꿔줘", "표를 더 깔끔하게", "일본어로 바꿔줘"'
            : 'ⓘ 한 번에 길게 말해도 좋아요. 중요한 조건만 포함하면 돼요.'
          }
        </p>
      </form>
    </div>
  );
}
