// streamingStore → tradeStore 호환 어댑터
// RightPanel.tsx 등 기존 컴포넌트가 이 파일을 import하므로 유지

import { useTradeStore } from "./tradeStore";
export type { StreamPhase } from "./tradeStore";

export type DocumentType = "PI" | "CI" | "PL" | "NDA" | "SALES_CONTRACT" | "PROPOSAL" | "COMPLIANCE" | null;

export interface ToolCallInfo {
  name: string;
  isComplete: boolean;
  completedArgs: Record<string, unknown> | null;
}

function toolNameToDocType(name: string | null, doc: any): DocumentType {
  if (!name) return null;
  if (name === "check_compliance") return "COMPLIANCE";
  if (name === "generate_trade_document" || name === "generate_document") {
    const dt = doc?.document_type;
    if (dt && ["PI", "CI", "PL", "NDA", "SALES_CONTRACT", "PROPOSAL"].includes(dt)) return dt as DocumentType;
    return "PI";
  }
  return "PI";
}

export function useStreamingStore() {
  const store = useTradeStore();

  const isComplete = store.streamPhase === "tool_call_complete" || store.streamPhase === "complete";

  const toolCall: ToolCallInfo | null =
    store.currentDocument || store.complianceResult || store.activeToolName
      ? {
          name: store.activeToolName || (store.complianceResult ? "check_compliance" : "generate_trade_document"),
          isComplete,
          completedArgs: store.currentDocument
            ? (store.currentDocument as unknown as Record<string, unknown>)
            : store.complianceResult
            ? (store.complianceResult as unknown as Record<string, unknown>)
            : null,
        }
      : null;

  const rightPanelDocType = toolNameToDocType(
    toolCall?.name ?? null,
    store.currentDocument,
  );

  return {
    phase: store.streamPhase,
    isStreaming: ["connecting", "streaming_text", "tool_call_start", "tool_call_streaming"].includes(store.streamPhase),
    messages: store.messages,
    currentStreamingText: store.streamingText,
    toolCall,
    rightPanelOpen: store.rightPanelOpen,
    rightPanelDocType,
    error: store.errorMessage,
    closeRightPanel: () => useTradeStore.setState({ rightPanelOpen: false }),
    toggleRightPanel: () => useTradeStore.setState((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  };
}
