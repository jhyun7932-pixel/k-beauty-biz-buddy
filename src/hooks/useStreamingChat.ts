// Backend SSE ↔ Zustand Store 연결 + Partial JSON 실시간 파싱

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useStreamingStore } from "../stores/streamingStore";
import { StreamingJsonAccumulator } from "../utils/partialJsonParser";
import { supabase } from "../integrations/supabase/client";

interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

export function useStreamingChat() {
  const store = useStreamingStore();
  const abortRef = useRef<AbortController | null>(null);
  const accumRef = useRef(new StreamingJsonAccumulator());

  const sendMessage = useCallback(
    async (message: string, files?: File[]) => {
      // 이전 스트리밍 취소
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      accumRef.current.reset();

      // 사용자 메시지 추가 + 스트리밍 시작
      store.addUserMessage(message || (files?.length ? "[파일 첨부]" : ""));
      store.startStreaming();

      try {
        // 인증 토큰
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          store.setError("로그인이 필요합니다. 새로고침 후 다시 시도해주세요.");
          return;
        }

        // 파일 업로드 → signed URLs
        const fileUrls: string[] = [];
        if (files && files.length > 0) {
          for (const file of files) {
            const filePath = `${session.user.id}/${Date.now()}-${file.name}`;
            const { error: uploadErr } = await supabase.storage
              .from("chat-uploads")
              .upload(filePath, file);
            if (uploadErr) {
              console.warn("파일 업로드 실패:", uploadErr.message);
              continue;
            }
            const { data: urlData } = await supabase.storage
              .from("chat-uploads")
              .createSignedUrl(filePath, 3600);
            if (urlData?.signedUrl) {
              fileUrls.push(urlData.signedUrl);
            }
          }
        }

        // 히스토리 (최근 10개 — 토큰 초과 방지)
        const history = store.messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Edge Function 호출
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/trade-assistant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              message: message || "이 파일을 분석해줘",
              history,
              ...(fileUrls.length > 0 ? { file_urls: fileUrls } : {}),
            }),
            signal: ac.signal,
          }
        );

        // JSON 에러 응답 처리 (Edge Function에서 status 200 + error: true로 반환)
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await res.json();
          if (json.error) {
            const msg = json.message || "알 수 없는 오류가 발생했습니다.";
            toast.warning(msg);
            store.setError(msg);
            return;
          }
        }

        if (!res.ok) {
          const txt = await res.text();
          toast.warning(`서버 오류 (${res.status})`);
          store.setError(`서버 오류 (${res.status}): ${txt}`);
          return;
        }

        if (!res.body) {
          store.setError("스트리밍 응답을 받지 못했습니다.");
          return;
        }

        // SSE 스트림 읽기
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || ac.signal.aborted) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";

          for (const line of lines) {
            const t = line.trim();
            if (!t || !t.startsWith("data: ")) continue;
            try {
              const evt: SSEEvent = JSON.parse(t.slice(6));
              handleSSE(evt, store, accumRef.current);
            } catch {
              // 파싱 실패 무시
            }
          }
        }

        // 정상 종료 확인
        const currentState = useStreamingStore.getState();
        if (currentState.phase !== "complete" && currentState.phase !== "error") {
          store.completeStreaming();
        }

        // 채팅 히스토리 DB 저장 (실패해도 채팅 기능에 영향 없음)
        try {
          const finalState = useStreamingStore.getState();
          const assistantContent = [
            finalState.currentStreamingText,
            finalState.currentPhase2Text,
          ]
            .filter(Boolean)
            .join("\n\n")
            .trim();

          if (finalState.phase === "complete" && assistantContent) {
            await supabase.from("ai_chat_messages").insert([
              {
                user_id: session.user.id,
                role: "user",
                content: message,
                is_doc_output: false,
              },
              {
                user_id: session.user.id,
                role: "assistant",
                content: assistantContent,
                is_doc_output: finalState.rightPanelOpen,
              },
            ]);
          }
        } catch {
          // DB 저장 실패 무시 — 채팅 기능에 영향 없음
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          store.reset();
        } else {
          store.setError(`네트워크 오류: ${(err as Error).message}`);
        }
      }
    },
    [store]
  );

  const cancelStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    store.reset();
  }, [store]);

  return {
    sendMessage,
    cancelStreaming,
    isStreaming: store.isStreaming,
    phase: store.phase,
    messages: store.messages,
    currentStreamingText: store.currentStreamingText,
    currentPhase2Text: store.currentPhase2Text,
    toolCall: store.toolCall,
    rightPanelOpen: store.rightPanelOpen,
    rightPanelDocType: store.rightPanelDocType,
    error: store.error,
    closeRightPanel: store.closeRightPanel,
    toggleRightPanel: store.toggleRightPanel,
  };
}

// SSE 이벤트 핸들러
function handleSSE(
  evt: SSEEvent,
  store: ReturnType<typeof useStreamingStore.getState>,
  accum: StreamingJsonAccumulator
) {
  switch (evt.type) {
    case "text_delta": {
      const c = evt.data.content as string;
      if (c) store.appendTextDelta(c);
      break;
    }
    case "tool_call_start": {
      const name = evt.data.name as string;
      if (name) {
        accum.reset();
        store.startToolCall(name);
      }
      break;
    }
    case "tool_call_delta": {
      const chunk = evt.data.arguments_chunk as string;
      if (chunk) {
        const result = accum.append(chunk);
        store.appendToolCallDelta(chunk, result);
      }
      break;
    }
    case "tool_call_end": {
      const full = evt.data.arguments_complete as string;
      if (full) store.completeToolCall(full);
      break;
    }
    case "phase2_start":
      store.startPhase2();
      break;
    case "text_delta_phase2": {
      const c = evt.data.content as string;
      if (c) store.appendPhase2Delta(c);
      break;
    }
    case "context_loading": {
      const loadMsg = evt.data.message as string;
      if (loadMsg) store.appendTextDelta(`\n_${loadMsg}_\n`);
      break;
    }
    case "stream_end":
      store.completeStreaming();
      break;
    case "error": {
      const msg = (evt.data.message as string) || "알 수 없는 오류가 발생했습니다.";
      toast.warning(msg);
      store.setError(msg);
      break;
    }
  }
}
