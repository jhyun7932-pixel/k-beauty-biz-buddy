import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Package, FileText, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAppStore, StagePreset, PRESET_LABELS, DOC_TILES } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{ label: string; action: () => void }>;
}

const PRESET_ICONS: Record<StagePreset, React.ReactNode> = {
  'FIRST_PROPOSAL': <Send className="h-4 w-4" />,
  'SAMPLE': <Package className="h-4 w-4" />,
  'PURCHASE_ORDER': <FileText className="h-4 w-4" />,
};

const QUICK_ACTIONS = [
  { id: 'first_proposal', label: '첫 제안 패키지', preset: 'FIRST_PROPOSAL' as StagePreset },
  { id: 'sample', label: '샘플 발송 서류', preset: 'SAMPLE' as StagePreset },
  { id: 'bulk', label: '본오더 패키지', preset: 'PURCHASE_ORDER' as StagePreset },
  { id: 'compliance', label: '컴플라이언스 체크', preset: null },
];

export function AgentChatPanel() {
  const {
    project,
    setPreset,
    setWorkbenchTab,
    createDocFromTemplate,
    applyFieldPatch,
    getActiveDoc,
    handleAction,
    navigate,
  } = useAppStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const detectIntent = (message: string): { intent: string; entities: Record<string, any> } => {
    const lowerMsg = message.toLowerCase();
    
    // MOQ 변경
    if (lowerMsg.includes('moq') || lowerMsg.includes('최소주문')) {
      const match = message.match(/(\d+)/);
      if (match) {
        return { intent: 'update_fields', entities: { field: 'moq', value: parseInt(match[1]) } };
      }
    }
    
    // 단가 변경
    if (lowerMsg.includes('단가') || lowerMsg.includes('가격') || lowerMsg.includes('price')) {
      const match = message.match(/(\d+\.?\d*)/);
      if (match) {
        return { intent: 'update_fields', entities: { field: 'unitPrice', value: parseFloat(match[1]) } };
      }
    }
    
    // 납기 변경
    if (lowerMsg.includes('납기') || lowerMsg.includes('리드타임') || lowerMsg.includes('lead')) {
      const match = message.match(/(\d+)/);
      if (match) {
        return { intent: 'update_fields', entities: { field: 'leadTime', value: parseInt(match[1]) } };
      }
    }
    
    // Incoterms 변경
    const incotermsMatch = message.match(/(FOB|CIF|DDP|EXW)/i);
    if (incotermsMatch) {
      return { intent: 'update_fields', entities: { field: 'incoterms', value: incotermsMatch[1].toUpperCase() } };
    }
    
    // 문서 생성
    if (lowerMsg.includes('pi 만들') || lowerMsg.includes('견적서')) {
      return { intent: 'create_doc', entities: { templateKey: project.stagePreset === 'SAMPLE' ? 'PI_SAMPLE' : 'PI_FINAL' } };
    }
    
    if (lowerMsg.includes('카탈로그')) {
      return { intent: 'create_doc', entities: { templateKey: 'CATALOG_15P' } };
    }
    
    if (lowerMsg.includes('계약서')) {
      return { intent: 'create_doc', entities: { templateKey: 'CONTRACT_SALES' } };
    }
    
    // 규제/컴플라이언스
    if (lowerMsg.includes('규제') || lowerMsg.includes('컴플라이언스') || lowerMsg.includes('compliance')) {
      return { intent: 'run_compliance', entities: {} };
    }
    
    // Gate 실행
    if (lowerMsg.includes('게이트') || lowerMsg.includes('체크') || lowerMsg.includes('검사')) {
      return { intent: 'run_gate', entities: {} };
    }
    
    return { intent: 'help', entities: {} };
  };

  const processIntent = (intent: string, entities: Record<string, any>): string => {
    const activeDoc = getActiveDoc();
    
    switch (intent) {
      case 'update_fields':
        if (!activeDoc) {
          return '먼저 문서를 선택해주세요. Files 탭에서 문서를 클릭하세요.';
        }
        
        const { field, value } = entities;
        let patch: Record<string, any> = {};
        let description = '';
        
        if (field === 'moq') {
          patch = { moq: value };
          // Update SKU list as well
          const updatedItems = activeDoc.fields.items?.map((item: any) => ({
            ...item,
            qty: value,
            amount: value * item.unitPrice,
          }));
          if (updatedItems) {
            patch.items = updatedItems;
            patch.totalAmount = updatedItems.reduce((sum: number, i: any) => sum + i.amount, 0);
          }
          description = `MOQ를 ${value}으로 변경했습니다.`;
        } else if (field === 'unitPrice') {
          const updatedItems = activeDoc.fields.items?.map((item: any) => ({
            ...item,
            unitPrice: value,
            amount: item.qty * value,
          }));
          if (updatedItems) {
            patch.items = updatedItems;
            patch.totalAmount = updatedItems.reduce((sum: number, i: any) => sum + i.amount, 0);
          }
          description = `단가를 $${value}로 변경했습니다.`;
        } else if (field === 'leadTime') {
          patch = { leadTime: value };
          description = `납기를 ${value}일로 변경했습니다.`;
        } else if (field === 'incoterms') {
          patch = { incoterms: value };
          description = `Incoterms를 ${value}로 변경했습니다.`;
        }
        
        if (Object.keys(patch).length > 0) {
          applyFieldPatch({ docId: activeDoc.docId, patch });
          return `✅ ${description}\n\n미리보기가 업데이트되었습니다. Preview 탭에서 확인하세요.`;
        }
        return '변경할 내용을 찾지 못했습니다.';
        
      case 'create_doc':
        const { templateKey } = entities;
        const docId = createDocFromTemplate({ templateKey, preset: project.stagePreset });
        if (docId) {
          return `✅ 문서가 생성되었습니다!\n\nPreview 탭에서 확인하세요. 수정이 필요하면 "MOQ를 1000으로 바꿔줘" 같이 말씀해주세요.`;
        }
        return '문서 생성에 실패했습니다. 타겟 국가를 먼저 선택해주세요.';
        
      case 'run_compliance':
        navigate('COMPLIANCE');
        return '📋 컴플라이언스 페이지로 이동합니다. 국가별 규제 요건을 확인하세요.';
        
      case 'run_gate':
        if (project.stagePreset !== 'PURCHASE_ORDER') {
          return '⚠️ Gate 점검은 본오더 단계에서만 가능합니다.';
        }
        setWorkbenchTab('GATE');
        return '🔍 Gate 탭으로 이동합니다. 문서 간 불일치를 확인하세요.';
        
      default:
        return `안녕하세요! 다음과 같이 도와드릴 수 있어요:\n\n` +
          `📝 문서 수정: "MOQ를 1000으로 바꿔줘", "단가 $5로 변경"\n` +
          `📄 문서 생성: "PI 만들어줘", "카탈로그 생성"\n` +
          `🔍 검사: "Gate 점검해줘", "규제 확인"\n\n` +
          `우측 Files 탭에서 문서를 클릭하면 자동으로 생성됩니다.`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Process with intent detection
    const { intent, entities } = detectIntent(input);
    const response = processIntent(intent, entities);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 300);
  };

  const handlePresetClick = (preset: StagePreset) => {
    setPreset(preset);
    handleAction({ type: 'SET_PRESET', payload: { preset } });
    toast.success(`${PRESET_LABELS[preset]} 단계로 전환했습니다.`);
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.preset) {
      handlePresetClick(action.preset);
    } else {
      navigate('COMPLIANCE');
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Preset Selector */}
      <div className="p-3 border-b bg-muted/30 flex-shrink-0">
        <h2 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          거래 단계
        </h2>
        <div className="flex gap-2">
          {(['FIRST_PROPOSAL', 'SAMPLE', 'PURCHASE_ORDER'] as StagePreset[]).map((preset) => {
            const isActive = project.stagePreset === preset;
            const tiles = DOC_TILES[preset];
            
            return (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                  isActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary">{PRESET_ICONS[preset]}</span>
                  <span className="font-semibold text-sm">{PRESET_LABELS[preset]}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {tiles.length}개 문서
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">무엇을 도와드릴까요?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                문서 수정, 생성, 규제 확인 등을 도와드려요
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-full",
                      "bg-secondary/50 hover:bg-secondary border border-border/50",
                      "text-sm text-foreground/80 hover:text-foreground",
                      "transition-all duration-200 hover:shadow-sm"
                    )}
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-card flex-shrink-0">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 'MOQ를 1000으로 바꿔줘', 'PI 만들어줘'"
            disabled={isProcessing}
            className="w-full pl-4 pr-12 py-3 rounded-full bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full" 
            disabled={!input.trim() || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
