import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/types';
import type { OnboardingContext } from '@/types/onboarding';

export interface OnboardingQuestion {
  id: string;
  questionText: string;
  field: keyof OnboardingContext | 'custom';
  options?: { value: string; label: string }[];
  multiSelect?: boolean;
  placeholder?: string;
}

// 초기 10개 질문 시퀀스
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q1_countries',
    questionText: '이번에 "보낼 나라"는 어디인가요? (최대 3개까지 선택 가능)',
    field: 'targetCountries',
    options: [
      { value: 'US', label: '🇺🇸 미국' },
      { value: 'CN', label: '🇨🇳 중국' },
      { value: 'JP', label: '🇯🇵 일본' },
      { value: 'HK', label: '🇭🇰 홍콩' },
      { value: 'VN', label: '🇻🇳 베트남' },
      { value: 'TH', label: '🇹🇭 태국' },
      { value: 'ID', label: '🇮🇩 인도네시아' },
      { value: 'MY', label: '🇲🇾 말레이시아' },
      { value: 'TW', label: '🇹🇼 대만' },
      { value: 'AU', label: '🇦🇺 호주' },
      { value: 'EU', label: '🇪🇺 EU' },
    ],
    multiSelect: true,
  },
  {
    id: 'q2_channel',
    questionText: '판매 채널은 어디인가요?',
    field: 'targetChannel',
    options: [
      { value: 'wholesale', label: '도매/유통사' },
      { value: 'offline_retail', label: '리테일(오프라인)' },
      { value: 'online_marketplace', label: '온라인 마켓' },
      { value: 'd2c', label: 'D2C(자사몰/에이전트)' },
    ],
  },
  {
    id: 'q3_buyer_type',
    questionText: '바이어 유형은 무엇인가요?',
    field: 'buyerType',
    options: [
      { value: 'importer', label: '수입사' },
      { value: 'distributor', label: '유통사' },
      { value: 'retailer', label: '리테일러' },
      { value: 'market_seller', label: '마켓 셀러' },
    ],
  },
  {
    id: 'q4_trade_stage',
    questionText: '이번 거래 단계는 어디인가요?',
    field: 'tradeStage',
    options: [
      { value: 'first_proposal', label: '첫 접촉/제안' },
      { value: 'sample', label: '샘플 발송' },
      { value: 'main_order', label: '가격 협상/본오더' },
      { value: 'reorder', label: '재주문/출고' },
    ],
  },
  {
    id: 'q5_currency_incoterms',
    questionText: '통화와 희망 인코텀즈(FOB/CIF/DDP)는요?',
    field: 'currency',
    options: [
      { value: 'USD', label: 'USD (달러)' },
      { value: 'EUR', label: 'EUR (유로)' },
      { value: 'JPY', label: 'JPY (엔화)' },
      { value: 'CNY', label: 'CNY (위안화)' },
      { value: 'HKD', label: 'HKD (홍콩달러)' },
    ],
    placeholder: '예: USD, FOB 부산',
  },
  {
    id: 'q6_payment_terms',
    questionText: '결제 조건은 어떻게 제안하고 싶으세요?',
    field: 'custom',
    options: [
      { value: 'tt_30_70', label: 'T/T 30/70 (선금 30%, 잔금 70%)' },
      { value: 'tt_50_50', label: 'T/T 50/50 (선금 50%, 잔금 50%)' },
      { value: 'tt_100', label: 'T/T 100% 선금' },
      { value: 'lc', label: 'L/C (신용장)' },
      { value: 'negotiate', label: '협의 예정' },
    ],
    placeholder: '예: T/T 30/70',
  },
  {
    id: 'q7_hero_products',
    questionText: '대표로 밀고 싶은 제품(SKU) 1~3개는 무엇인가요?',
    field: 'custom',
    placeholder: '예: 비건 선크림, 시카 세럼, 수분 크림',
  },
  {
    id: 'q8_moq_price',
    questionText: 'MOQ/리드타임/가격대는 어느 정도로 잡을까요?',
    field: 'custom',
    placeholder: '예: MOQ 500개, 납기 20일, 단가 $3~5',
  },
  {
    id: 'q9_strengths',
    questionText: '바이어에게 강조하고 싶은 강점 3가지는요?',
    field: 'custom',
    options: [
      { value: 'efficacy', label: '효능/성분 차별화' },
      { value: 'price', label: '경쟁력 있는 가격' },
      { value: 'production', label: '안정적인 생산력/납기' },
      { value: 'brand', label: '브랜드 스토리' },
      { value: 'cert', label: '인증(비건/CGMP 등)' },
      { value: 'support', label: '마케팅/현지화 지원' },
    ],
    multiSelect: true,
  },
  {
    id: 'q10_document',
    questionText: '지금 당장 만들 문서는 무엇인가요?',
    field: 'custom',
    options: [
      { value: 'brand_deck', label: '🏢 브랜드 소개서' },
      { value: 'catalog', label: '📦 카탈로그' },
      { value: 'compliance', label: '✅ 수출 준비 요약' },
      { value: 'pi', label: '📄 견적서(PI)' },
      { value: 'contract', label: '📝 계약서' },
    ],
  },
];

// 빠른 실행 버튼과 질문 매핑
export const QUICK_ACTION_TO_QUESTIONS: Record<string, string[]> = {
  first_proposal: ['q1_countries', 'q2_channel', 'q3_buyer_type', 'q7_hero_products'],
  sample_package: ['q1_countries', 'q7_hero_products', 'q8_moq_price'],
  main_order: ['q5_currency_incoterms', 'q6_payment_terms', 'q8_moq_price'],
  compliance_check: ['q1_countries', 'q7_hero_products'],
  create_pi: ['q1_countries', 'q5_currency_incoterms', 'q6_payment_terms', 'q8_moq_price'],
  followup_email: ['q1_countries', 'q4_trade_stage'],
};

export interface UseOnboardingQuestionsReturn {
  currentQuestionIndex: number;
  currentQuestion: OnboardingQuestion | null;
  answers: Record<string, string | string[]>;
  isComplete: boolean;
  answeredCount: number;
  totalQuestions: number;
  answerQuestion: (answer: string | string[]) => void;
  skipQuestion: () => void;
  startQuestionFlow: (quickActionId?: string) => void;
  resetQuestions: () => void;
  getQuestionMessage: () => ChatMessage | null;
  generateSummaryMessage: () => string;
}

export function useOnboardingQuestions(): UseOnboardingQuestionsReturn {
  const [questionQueue, setQuestionQueue] = useState<OnboardingQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questionQueue[currentQuestionIndex] || null;
  const totalQuestions = questionQueue.length;
  const answeredCount = Object.keys(answers).length;

  const startQuestionFlow = useCallback((quickActionId?: string) => {
    let questions: OnboardingQuestion[];
    
    if (quickActionId && QUICK_ACTION_TO_QUESTIONS[quickActionId]) {
      // 빠른 실행 버튼에 맞는 질문만 선택
      const relevantQuestionIds = QUICK_ACTION_TO_QUESTIONS[quickActionId];
      questions = ONBOARDING_QUESTIONS.filter(q => relevantQuestionIds.includes(q.id));
    } else {
      // 전체 10개 질문
      questions = [...ONBOARDING_QUESTIONS];
    }
    
    setQuestionQueue(questions);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsComplete(false);
  }, []);

  const answerQuestion = useCallback((answer: string | string[]) => {
    if (!currentQuestion) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    if (currentQuestionIndex < questionQueue.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      setCurrentQuestionIndex(-1);
    }
  }, [currentQuestion, currentQuestionIndex, questionQueue.length]);

  const skipQuestion = useCallback(() => {
    if (currentQuestionIndex < questionQueue.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      setCurrentQuestionIndex(-1);
    }
  }, [currentQuestionIndex, questionQueue.length]);

  const resetQuestions = useCallback(() => {
    setQuestionQueue([]);
    setCurrentQuestionIndex(-1);
    setAnswers({});
    setIsComplete(false);
  }, []);

  const getQuestionMessage = useCallback((): ChatMessage | null => {
    if (!currentQuestion) return null;

    let content = currentQuestion.questionText;
    
    if (currentQuestion.options) {
      content += '\n\n';
      currentQuestion.options.forEach((opt, idx) => {
        content += `${idx + 1}. ${opt.label}\n`;
      });
      if (currentQuestion.multiSelect) {
        content += '\n(여러 개 선택 가능)';
      }
    }
    
    if (currentQuestion.placeholder) {
      content += `\n\n💡 ${currentQuestion.placeholder}`;
    }

    return {
      id: `question-${currentQuestion.id}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
  }, [currentQuestion]);

  const generateSummaryMessage = useCallback((): string => {
    const lines: string[] = ['📋 정리된 조건입니다:\n'];
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = ONBOARDING_QUESTIONS.find(q => q.id === questionId);
      if (!question) return;
      
      let displayValue: string;
      if (Array.isArray(answer)) {
        if (question.options) {
          displayValue = answer
            .map(v => question.options?.find(o => o.value === v)?.label || v)
            .join(', ');
        } else {
          displayValue = answer.join(', ');
        }
      } else {
        if (question.options) {
          displayValue = question.options.find(o => o.value === answer)?.label || answer;
        } else {
          displayValue = answer;
        }
      }
      
      const labelMap: Record<string, string> = {
        q1_countries: '보낼 나라',
        q2_channel: '판매 채널',
        q3_buyer_type: '바이어 유형',
        q4_trade_stage: '거래 단계',
        q5_currency_incoterms: '통화/인코텀즈',
        q6_payment_terms: '결제 조건',
        q7_hero_products: '대표 제품',
        q8_moq_price: 'MOQ/가격',
        q9_strengths: '강조 포인트',
        q10_document: '생성 문서',
      };
      
      lines.push(`• ${labelMap[questionId] || questionId}: ${displayValue}`);
    });

    lines.push('\n이 조건으로 문서를 생성할까요?');
    return lines.join('\n');
  }, [answers]);

  return {
    currentQuestionIndex,
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
  };
}
