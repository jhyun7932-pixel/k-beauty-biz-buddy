import { useCallback, useRef } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTradeStore } from "../stores/tradeStore";

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trade-assistant`;

export function useStreamingChat() {
  const { user } = useAuth();
  const abortRef = useRef<AbortController | null>(null);
  const store = useTradeStore();

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;
    if (!["idle","complete","error"].includes(store.streamPhase)) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    store.addUserMessage(content);
    store.onStreamConnecting();

    const apiMessages = useTradeStore.getState().messages.map(m => ({
      role: m.role, content: m.content,
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("세션 없음. 다시 로그인해주세요.");

      const response = await fetch(EDGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages, hasFile: false }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      if (!response.body) throw new Error("Response body null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventName = "";
        let dataLine = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) eventName = line.slice(7).trim();
          else if (line.startsWith("data: ")) dataLine = line.slice(6).trim();
          else if (line === "" && eventName && dataLine) {
            try {
              const data = JSON.parse(dataLine);
              switch (eventName) {
                case "text_delta":
                  if (data.text) store.onTextDelta(data.text);
                  break;
                case "tool_call_start":
                  store.onToolCallStart(data.tool_name, data.tool_id);
                  break;
                case "tool_input_delta":
                  store.onToolInputDelta(data.partial_json, data.accumulated);
                  break;
                case "tool_call_complete":
                  store.onToolCallComplete(data.tool_name, data.document);
                  break;
                case "stream_end":
                  store.onStreamEnd();
                  break;
                case "error":
                  store.onStreamError(data.message);
                  break;
              }
            } catch(e) { console.warn("SSE parse err", e); }
            eventName = ""; dataLine = "";
          }
        }
      }

      // stream_end 이벤트가 오지 않았을 경우 안전하게 완료 처리
      const finalPhase = useTradeStore.getState().streamPhase;
      if (finalPhase !== "complete" && finalPhase !== "error") {
        store.onStreamEnd();
      }
    } catch(err) {
      if ((err as Error).name === "AbortError") { store.resetStream(); return; }
      store.onStreamError(err instanceof Error ? err.message : "연결 오류");
    }
  }, [user, store]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    store.resetStream();
  }, [store]);

  return {
    messages: store.messages,
    streamingText: store.streamingText,
    streamPhase: store.streamPhase,
    isStreaming: ["connecting","streaming_text","tool_call_start","tool_call_streaming"].includes(store.streamPhase),
    rightPanelOpen: store.rightPanelOpen,
    currentDocument: store.currentDocument,
    complianceResult: store.complianceResult,
    partialDocumentJson: store.partialDocumentJson,
    activeToolName: store.activeToolName,
    errorMessage: store.errorMessage,
    sendMessage,
    cancelStream,
  };
}
