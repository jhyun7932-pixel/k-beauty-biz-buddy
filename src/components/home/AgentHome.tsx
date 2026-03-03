import React, { useState, useEffect } from 'react';
import { Send, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DealStagePreset } from '@/hooks/usePresetState';

interface AgentHomeProps {
  selectedPreset: DealStagePreset;
  onPresetChange: (preset: DealStagePreset) => void;
  onQuickAction: (actionId: string) => void;
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  onOpenEmailGenerator?: () => void;
}

const SUGGESTION_CHIPS = [
  { id: 'first_proposal', label: '첫 제안 패키지 만들기', preset: 'PROPOSAL' as DealStagePreset },
  { id: 'sample_package', label: '샘플 발송 서류 준비', preset: 'SAMPLE' as DealStagePreset },
  { id: 'bulk_order', label: '본오더 PI/계약서', preset: 'BULK' as DealStagePreset },
  { id: 'compliance_check', label: '수출 규제 확인', preset: null },
];

const EXAMPLE_PROMPTS = [
  '미국 바이어에게 첫 제안 패키지 만들어줘',
  'MOQ를 1000으로 변경해줘',
  '일본 시장 규제 요건 확인해줘',
  '샘플 발송용 PI 작성해줘',
];

export function AgentHome({
  onPresetChange,
  onQuickAction,
  onSendMessage,
  isProcessing = false,
}: AgentHomeProps) {
  const [input, setInput] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Typewriter effect for placeholder
  useEffect(() => {
    const currentPrompt = EXAMPLE_PROMPTS[currentPromptIndex];
    
    if (isTyping) {
      if (displayedText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        setCurrentPromptIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, currentPromptIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleChipClick = (chip: typeof SUGGESTION_CHIPS[0]) => {
    if (chip.preset) {
      onPresetChange(chip.preset);
    }
    onQuickAction(chip.id);
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* AI Avatar & Greeting */}
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-accent-violet flex items-center justify-center shadow-lg">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-background" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
            무엇을 도와드릴까요?
          </h1>
          <p className="text-muted-foreground text-center text-sm md:text-base max-w-md">
            K-뷰티 수출 문서 작성부터 규제 확인까지, AI가 함께합니다
          </p>
        </div>

        {/* Main Input */}
        <form 
          onSubmit={handleSubmit} 
          className="w-full max-w-2xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-accent-violet/50 to-primary/50 rounded-2xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative bg-card rounded-2xl border border-border shadow-lg">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={displayedText || '메시지를 입력하세요...'}
                disabled={isProcessing}
                rows={1}
                className={cn(
                  "w-full px-5 py-4 pr-14 bg-transparent resize-none",
                  "text-base text-foreground placeholder:text-muted-foreground/50",
                  "focus:outline-none disabled:opacity-50",
                  "min-h-[56px] max-h-[200px]"
                )}
                style={{ height: 'auto' }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isProcessing}
                className={cn(
                  "absolute right-3 bottom-3 h-10 w-10 rounded-xl",
                  "bg-primary hover:bg-primary/90 shadow-md",
                  "transition-all duration-200",
                  input.trim() && "scale-100",
                  !input.trim() && "scale-95 opacity-70"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleChipClick(chip)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full",
                  "bg-secondary/50 hover:bg-secondary border border-border/50",
                  "text-sm text-foreground/80 hover:text-foreground",
                  "transition-all duration-200 hover:shadow-sm hover:border-primary/30"
                )}
              >
                <span>{chip.label}</span>
                <ArrowRight className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Examples */}
      <div className="border-t border-border/50 bg-muted/20 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground text-center mb-3">
            이런 것들을 시도해 보세요
          </p>
          <div className="grid grid-cols-2 gap-2">
            {EXAMPLE_PROMPTS.slice(0, 4).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(prompt)}
                className={cn(
                  "text-left px-3 py-2 rounded-lg text-xs",
                  "bg-card/50 hover:bg-card border border-border/50 hover:border-border",
                  "text-muted-foreground hover:text-foreground",
                  "transition-all duration-200 truncate"
                )}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
