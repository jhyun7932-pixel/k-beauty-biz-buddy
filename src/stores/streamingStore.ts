// FLONIX Streaming Store (Zustand)
// 좌측 채팅 ↔ 우측 문서 패널 동기화 (Claude JSON 응답 방식)

import { create } from "zustand";
import type { NextAction } from "../lib/nextActions";
import { detectResponseContext, getNextActions } from "../lib/nextActions";

export type StreamPhase =
  | "idle"
  | "connecting"
  | "streaming_text"
  | "tool_call_complete"
  | "complete"
  | "error";

export type DocumentType = "PI" | "CI" | "PL" | "NDA" | "SALES_CONTRACT" | "PROPOSAL" | "COMPLIANCE" | null;

export interface ToolCallInfo {
  name: string;
  isComplete: boolean;
  completedArgs: Record<string, unknown> | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCall?: { name: string; documentType: DocumentType };
  nextActions?: NextAction[];
}

interface StreamingState {
  phase: StreamPhase;
  isStreaming: boolean;
  messages: ChatMessage[];
  currentStreamingText: string;
  toolCall: ToolCallInfo | null;
  rightPanelOpen: boolean;
  rightPanelDocType: DocumentType;
  error: string | null;

  startStreaming: () => void;
  appendTextDelta: (text: string) => void;
  startToolCall: (name: string) => void;
  completeToolCall: (fullArgs: string) => void;
  completeStreaming: () => void;
  setError: (err: string) => void;
  addUserMessage: (content: string) => void;
  reset: () => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
}

function fnToDocType(name: string): DocumentType {
  if (name === "generate_document") return "PI";
  if (name === "check_compliance") return "COMPLIANCE";
  return "PI";
}

function argsToDocType(args: Record<string, unknown> | null): DocumentType {
  if (!args) return null;
  const dt = args.document_type as string | undefined;
  if (dt && ["PI", "CI", "PL", "NDA", "SALES_CONTRACT", "PROPOSAL"].includes(dt)) return dt as DocumentType;
  return null;
}

export const useStreamingStore = create<StreamingState>((set, get) => ({
  phase: "idle",
  isStreaming: false,
  messages: [],
  currentStreamingText: "",
  toolCall: null,
  rightPanelOpen: false,
  rightPanelDocType: null,
  error: null,

  startStreaming: () =>
    set({
      phase: "connecting",
      isStreaming: true,
      currentStreamingText: "",
      toolCall: null,
      error: null,
    }),

  appendTextDelta: (text) =>
    set((s) => ({
      phase: "streaming_text",
      currentStreamingText: s.currentStreamingText + text,
    })),

  startToolCall: (name) =>
    set({
      phase: "tool_call_complete",
      toolCall: {
        name,
        isComplete: false,
        completedArgs: null,
      },
      rightPanelOpen: true,
      rightPanelDocType: fnToDocType(name),
    }),

  completeToolCall: (fullArgs) =>
    set((s) => {
      if (!s.toolCall) return s;
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(fullArgs);
      } catch {
        parsed = null;
      }
      return {
        phase: "tool_call_complete",
        toolCall: {
          ...s.toolCall,
          isComplete: true,
          completedArgs: parsed,
        },
        rightPanelDocType: argsToDocType(parsed) || s.rightPanelDocType,
      };
    }),

  completeStreaming: () => {
    const s = get();
    const newMsgs = [...s.messages];

    // NextAction 컨텍스트 감지
    const context = detectResponseContext(
      s.toolCall?.name,
      s.rightPanelDocType,
      s.toolCall?.completedArgs,
      "",
    );
    const actions = getNextActions(context);

    if (s.currentStreamingText.trim()) {
      newMsgs.push({
        id: `msg-${Date.now()}-t`,
        role: "assistant",
        content: s.currentStreamingText,
        timestamp: Date.now(),
        toolCall: s.toolCall
          ? { name: s.toolCall.name, documentType: s.rightPanelDocType }
          : undefined,
        nextActions: actions.length > 0 ? actions : undefined,
      });
    }

    set({
      phase: "complete",
      isStreaming: false,
      messages: newMsgs,
      currentStreamingText: "",
    });
  },

  setError: (err) =>
    set({ phase: "error", isStreaming: false, error: err }),

  addUserMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `msg-${Date.now()}-u`,
          role: "user",
          content,
          timestamp: Date.now(),
        },
      ],
    })),

  reset: () =>
    set({
      phase: "idle",
      isStreaming: false,
      currentStreamingText: "",
      toolCall: null,
      rightPanelOpen: false,
      rightPanelDocType: null,
      error: null,
    }),

  closeRightPanel: () => set({ rightPanelOpen: false }),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
}));
