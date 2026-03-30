// 좌측 AI 채팅 패널 - /슬래시 커맨드 + @멘션 + 파일 첨부 지원

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NextActionCards from "./NextActionCards";
import SlashCommandMenu from "./SlashCommandMenu";
import MentionMenu from "./MentionMenu";
import ChatFileAttachment from "./ChatFileAttachment";
import { useChatInputEnhanced } from "../../hooks/useChatInputEnhanced";
import type { Buyer } from "../../hooks/useBuyers";
import type { ProductEntry } from "../../stores/types";
import type { NextAction } from "../../lib/nextActions";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  nextActions?: NextAction[];
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentStreamingText: string;
  isStreaming: boolean;
  phase: string;
  error: string | null;
  onSendMessage: (msg: string, files?: File[]) => void;
  onCancel: () => void;
  buyers?: Buyer[];
  productEntries?: ProductEntry[];
}

export default function ChatPanel({
  messages,
  currentStreamingText,
  isStreaming,
  phase,
  error,
  onSendMessage,
  onCancel,
  buyers = [],
  productEntries = [],
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    slashVisible,
    filteredCommands,
    slashIndex,
    selectSlashCommand,
    mentionVisible,
    filteredMentions,
    mentionIndex,
    selectMention,
    attachedFiles,
    addFiles,
    removeFile,
    clearFiles,
    handleInputChange,
    handleMenuKeyDown,
    isMenuOpen,
  } = useChatInputEnhanced({ buyers, productEntries });

  // 자동 스크롤
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStreamingText]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const t = input.trim();
    if ((!t && !attachedFiles.length) || isStreaming) return;
    onSendMessage(t, attachedFiles.length > 0 ? attachedFiles : undefined);
    setInput("");
    clearFiles();
  };

  const handleSendAction = (msg: string) => {
    if (isStreaming) return;
    onSendMessage(msg);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 메뉴가 열려있으면 메뉴 네비게이션 우선
    if (isMenuOpen) {
      if (handleMenuKeyDown(e.key)) {
        e.preventDefault();

        // Enter 키로 선택 처리
        if (e.key === "Enter") {
          if (slashVisible && filteredCommands[slashIndex]) {
            const msg = selectSlashCommand(filteredCommands[slashIndex]);
            setInput("");
            onSendMessage(msg);
          } else if (mentionVisible && filteredMentions[mentionIndex]) {
            const cursorPos = inputRef.current?.selectionStart ?? input.length;
            const { newValue, newCursorPos } = selectMention(
              filteredMentions[mentionIndex],
              input,
              cursorPos,
            );
            setInput(newValue);
            // Set cursor position after state update
            requestAnimationFrame(() => {
              inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            });
          }
        }
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (value: string) => {
    setInput(value);
    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    handleInputChange(value, cursorPos);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = ""; // reset
    }
  };

  const phaseLabels: Record<string, string> = {
    connecting: "연결 중...",
    streaming_text: "응답 생성 중...",
    tool_call_complete: "문서 완료 ✓",
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 상단 헤더 */}
      <header className="h-14 border-b border-gray-200 bg-white px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">Fleety AI</h1>
            <p className="text-[10px] text-gray-400">K-Beauty Export OS</p>
          </div>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-blue-600 font-medium">
              {phaseLabels[phase] || "처리 중..."}
            </span>
          </div>
        )}
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* 웰컴 스크린 */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Fleety AI Trade Assistant
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                K-뷰티 수출 서류, 규제 확인, 물류 견적까지 AI가 도와드립니다.
              </p>
              <div className="space-y-2 text-left text-sm">
                {[
                  { icon: "📄", text: "PI/CI/PL 무역 서류 자동 생성" },
                  { icon: "🔍", text: "11개국 화장품 규제 컴플라이언스" },
                  { icon: "🚢", text: "Incoterms, HS Code, 관세율 안내" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span>{icon}</span>
                    <span className="text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 히스토리 메시지 */}
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id}>
              <div className="flex gap-2.5">
                <AIAvatar />
                <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100 max-w-[80%] text-sm text-gray-800">
                  <MarkdownContent content={msg.content} />
                </div>
              </div>
              {msg.nextActions && msg.nextActions.length > 0 && (
                <div className="pl-9 mt-1.5">
                  <NextActionCards
                    actions={msg.nextActions}
                    onActionClick={handleSendAction}
                    disabled={isStreaming}
                  />
                </div>
              )}
            </div>
          )
        )}

        {/* Phase 1 스트리밍 텍스트 */}
        {isStreaming && currentStreamingText && (
          <div className="flex gap-2.5">
            <AIAvatar />
            <div className="flex-1 bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100 max-w-[80%]">
              <div className="text-sm text-gray-800">
                <MarkdownContent content={currentStreamingText} />
                <span className="inline-block w-[2px] h-4 bg-violet-500 ml-0.5 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Thinking 인디케이터 */}
        {isStreaming &&
          !currentStreamingText && (
            <div className="flex gap-2.5">
              <AIAvatar />
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100">
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* 에러 */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            <strong>안내:</strong> {error.split("\n").map((line, i) => (
              <span key={i}>{i > 0 && <br />}{line}</span>
            ))}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 bg-white px-5 py-3">
        <form onSubmit={handleSubmit} className="relative">
          {/* Slash Command Menu */}
          {slashVisible && (
            <SlashCommandMenu
              commands={filteredCommands}
              selectedIndex={slashIndex}
              onSelect={(cmd) => {
                const msg = selectSlashCommand(cmd);
                setInput("");
                onSendMessage(msg);
              }}
            />
          )}

          {/* Mention Menu */}
          {mentionVisible && (
            <MentionMenu
              items={filteredMentions}
              selectedIndex={mentionIndex}
              onSelect={(item) => {
                const cursorPos = inputRef.current?.selectionStart ?? input.length;
                const { newValue, newCursorPos } = selectMention(item, input, cursorPos);
                setInput(newValue);
                requestAnimationFrame(() => {
                  inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
                  inputRef.current?.focus();
                });
              }}
            />
          )}

          {/* 파일 첨부 미리보기 */}
          <ChatFileAttachment files={attachedFiles} onRemove={removeFile} />

          {/* 입력 바 */}
          <div className="flex gap-2 items-end">
            {/* 📎 파일 첨부 버튼 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 shrink-0"
              title="파일 첨부 (이미지, PDF)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="메시지를 입력하세요... ( / 명령어 · @ 멘션)"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm placeholder:text-gray-400"
              rows={1}
              style={{ minHeight: 42, maxHeight: 120 }}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium shrink-0"
              >
                중지
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachedFiles.length}
                className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium shrink-0"
              >
                전송
              </button>
            )}
          </div>
        </form>

        {/* 퀵 액션 */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex gap-2 mt-2.5 flex-wrap">
            {[
              "미국 수출용 PI 작성해줘",
              "선크림 EU CPNP 규제 확인",
              "FOB Busan CI 작성",
            ].map((text) => (
              <button
                key={text}
                onClick={() => {
                  setInput(text);
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AIAvatar() {
  return (
    <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-white font-bold text-[10px]">AI</span>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-2.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
        code: ({ className, children }) => {
          const isInline = !className;
          return isInline ? (
            <code className="bg-gray-100 text-violet-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
          ) : (
            <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-2 whitespace-pre">{children}</code>
          );
        },
        pre: ({ children }) => <pre className="mb-2">{children}</pre>,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border-collapse border border-gray-200 text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
        th: ({ children }) => <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold text-gray-700">{children}</th>,
        td: ({ children }) => <td className="border border-gray-200 px-2 py-1.5 text-gray-600">{children}</td>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-violet-300 pl-3 my-2 text-gray-600 italic">{children}</blockquote>
        ),
        hr: () => <hr className="my-3 border-gray-200" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 underline hover:text-violet-800">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
