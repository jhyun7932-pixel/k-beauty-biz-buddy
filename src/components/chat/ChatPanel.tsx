import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingStatusChip } from './OnboardingStatusChip';
import type { ChatMessage } from '@/types';
import type { OnboardingContext } from '@/types/onboarding';
import { quickCommands } from '@/data/sampleData';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  onboardingContext?: OnboardingContext | null;
  onOpenSettings?: () => void;
}

const placeholders = [
  "예: '홍콩 바이어에게 보낼 제안 패키지 만들어줘'",
  "예: 'MOQ 300, 납기 20일, FOB로 반영해줘'",
];

export function ChatPanel({ 
  messages, 
  onSendMessage, 
  isProcessing,
  onboardingContext,
  onOpenSettings,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleQuickCommand = (command: string) => {
    if (!isProcessing) {
      onSendMessage(command);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Status Chip */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">무역비서에게 요청하기</h3>
              <p className="text-xs text-muted-foreground">말로 수정하면 문서가 바로 바뀝니다.</p>
            </div>
          </div>
          {onOpenSettings && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Onboarding Status Chip */}
        {onboardingContext && (
          <div className="mt-3">
            <OnboardingStatusChip
              context={onboardingContext}
              onOpenSettings={onOpenSettings}
            />
          </div>
        )}
      </div>

      {/* Quick Chips */}
      <div className="p-3 border-b border-border overflow-x-auto">
        <div className="flex gap-2">
          {quickCommands.map((command, index) => (
            <button
              key={index}
              onClick={() => handleQuickCommand(command)}
              disabled={isProcessing}
              className="quick-chip whitespace-nowrap disabled:opacity-50"
            >
              {command.length > 15 ? command.substring(0, 15) + '...' : command}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              자료만 올리면, 바이어에게 보낼 준비 끝.
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              회사소개서와 제품자료를 올려주세요. AI가 초안을 만들어드릴게요.
            </p>
          </div>
        ) : (
          messages.map((message) => (
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
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">무역비서가 정리 중이에요…</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))
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
            placeholder={placeholders[placeholderIndex]}
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
          ⓘ 한 번에 길게 말해도 좋아요. 중요한 조건만 포함하면 돼요.
        </p>
      </form>
    </div>
  );
}
