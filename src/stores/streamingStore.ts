// FLONIX Streaming Store (Zustand)
// 좌측 채팅 ↔ 우측 문서 패널 완벽 동기화

import { create } from "zustand";
import type { PartialParseResult } from "../utils/partialJsonParser";
import type { NextAction } from "../lib/nextActions";
import { detectResponseContext, getNextActions } from "../lib/nextActions";

export type StreamPhase =
  | "idle"
  | "connecting"
  | "streaming_text"
  | "tool_call_start"
  | "tool_call_streaming"
  | "tool_call_complete"
  | "phase2_streaming"
  | "complete"
  | "error";

export type DocumentType = "PI" | "CI" | "PL" | "NDA" | "SALES_CONTRACT" | "PROPOSAL" | "COMPLIANCE" | null;

export interface ToolCallInfo {
  name: string;
  argumentsBuffer: string;
  partialParsed: PartialParseResult | null;
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
  currentPhase2Text: string;
  toolCall: ToolCallInfo | null;
  rightPanelOpen: boolean;
  rightPanelDocType: DocumentType;
  error: string | null;

  startStreaming: () => void;
  appendTextDelta: (text: string) => void;
  startToolCall: (name: string) => void;
  appendToolCallDelta: (chunk: string, parsed: PartialParseResult) => void;
  completeToolCall: (fullArgs: string) => void;
  startPhase2: () => void;
  appendPhase2Delta: (text: string) => void;
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
  currentPhase2Text: "",
  toolCall: null,
  rightPanelOpen: false,
  rightPanelDocType: null,
  error: null,

  startStreaming: () =>
    set({
      phase: "connecting",
      isStreaming: true,
      currentStreamingText: "",
      currentPhase2Text: "",
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
      phase: "tool_call_start",
      toolCall: {
        name,
        argumentsBuffer: "",
        partialParsed: null,
        isComplete: false,
        completedArgs: null,
      },
      rightPanelOpen: true,
      rightPanelDocType: fnToDocType(name),
    }),

  appendToolCallDelta: (chunk, parsed) =>
    set((s) => {
      if (!s.toolCall) return s;
      let docType = s.rightPanelDocType;
      if (parsed.parsed && typeof parsed.parsed === "object" && !Array.isArray(parsed.parsed)) {
        const nd = argsToDocType(parsed.parsed as Record<string, unknown>);
        if (nd) docType = nd;
      }
      return {
        phase: "tool_call_streaming",
        toolCall: {
          ...s.toolCall,
          argumentsBuffer: s.toolCall.argumentsBuffer + chunk,
          partialParsed: parsed,
        },
        rightPanelDocType: docType,
      };
    }),

  completeToolCall: (fullArgs) =>
    set((s) => {
      if (!s.toolCall) return s;
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(fullArgs);
      } catch {
        parsed = (s.toolCall.partialParsed?.parsed as Record<string, unknown>) ?? null;
      }
      return {
        phase: "tool_call_complete",
        toolCall: {
          ...s.toolCall,
          argumentsBuffer: fullArgs,
          isComplete: true,
          completedArgs: parsed,
        },
        rightPanelDocType: argsToDocType(parsed) || s.rightPanelDocType,
      };
    }),

  startPhase2: () =>
    set({ phase: "phase2_streaming", currentPhase2Text: "" }),

  appendPhase2Delta: (text) =>
    set((s) => ({ currentPhase2Text: s.currentPhase2Text + text })),

  completeStreaming: () => {
    const s = get();
    const newMsgs = [...s.messages];

    // NextAction 컨텍스트 감지
    const context = detectResponseContext(
      s.toolCall?.name,
      s.rightPanelDocType,
      s.toolCall?.completedArgs,
      s.currentPhase2Text,
    );
    const actions = getNextActions(context);

    if (s.currentStreamingText.trim()) {
      newMsgs.push({
        id: `msg-${Date.now()}-t`,
        role: "assistant",
        content: s.currentStreamingText,
        timestamp: Date.now(),
      });
    }

    if (s.currentPhase2Text.trim()) {
      newMsgs.push({
        id: `msg-${Date.now()}-p2`,
        role: "assistant",
        content: s.currentPhase2Text,
        timestamp: Date.now(),
        toolCall: s.toolCall
          ? { name: s.toolCall.name, documentType: s.rightPanelDocType }
          : undefined,
        nextActions: actions.length > 0 ? actions : undefined,
      });
    } else if (actions.length > 0 && newMsgs.length > 0) {
      // Phase2 텍스트가 없지만 actions가 있으면 마지막 메시지에 첨부
      const lastMsg = newMsgs[newMsgs.length - 1];
      if (lastMsg.role === "assistant") {
        lastMsg.nextActions = actions;
      }
    }

    set({
      phase: "complete",
      isStreaming: false,
      messages: newMsgs,
      currentStreamingText: "",
      currentPhase2Text: "",
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
      currentPhase2Text: "",
      toolCall: null,
      rightPanelOpen: false,
      rightPanelDocType: null,
      error: null,
    }),

  closeRightPanel: () => set({ rightPanelOpen: false }),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
}));
