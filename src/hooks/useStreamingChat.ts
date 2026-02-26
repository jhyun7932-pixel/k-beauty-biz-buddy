// Backend JSON Response ↔ Zustand Store 연결 (Claude Anthropic)

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useStreamingStore } from "../stores/streamingStore";
import { supabase } from "../integrations/supabase/client";

export function useStreamingChat() {
  const store = useStreamingStore();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string, files?: File[]) => {
      // 이전 요청 취소
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      // 사용자 메시지 추가 + 로딩 시작
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

        // 파일 → base64 변환 (첫 번째 파일만 전송)
        let attachedFile: { base64: string; mimeType: string } | undefined;
        if (files && files.length > 0) {
          const file = files[0];
          try {
            const base64 = await fileToBase64(file);
            attachedFile = { base64, mimeType: file.type };
          } catch {
            toast.warning("파일 변환 실패. 다시 시도해주세요.");
          }
        }

        // 히스토리 (최근 10개 — 토큰 초과 방지)
        const history = store.messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // 현재 메시지를 히스토리에 추가
        const messages = [
          ...history,
          { role: "user", content: message || "이 파일을 분석해줘" },
        ];

        // Edge Function 호출 (JSON 응답)
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
              messages,
              userId: session.user.id,
              ...(attachedFile ? { attachedFile } : {}),
            }),
            signal: ac.signal,
          }
        );

        // HTTP 에러 처리 (4xx, 5xx)
        if (!res.ok) {
          let errorDetail = "";
          try {
            const errJson = await res.json();
            errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
          } catch {
            errorDetail = await res.text().catch(() => "응답을 읽을 수 없습니다.");
          }
          const errorMsg = `서버 오류 (${res.status}): ${errorDetail}`;
          console.error("[useStreamingChat]", errorMsg);
          toast.warning(`서버 오류 (${res.status})`);
          store.setError(errorMsg);
          return;
        }

        // JSON 파싱
        let json: any;
        try {
          json = await res.json();
        } catch (parseErr) {
          console.error("[useStreamingChat] JSON 파싱 실패:", parseErr);
          store.setError("서버 응답을 파싱할 수 없습니다.");
          return;
        }

        // 서버 에러 응답 처리 (status 200이지만 error: true)
        if (json.error) {
          const errorMsg = json.message || "알 수 없는 오류가 발생했습니다.";
          const debugInfo = json.debug || "";
          console.error("[useStreamingChat] 서버 에러:", errorMsg, debugInfo);
          toast.warning(errorMsg);
          store.setError(debugInfo ? `${errorMsg}\n(상세: ${debugInfo})` : errorMsg);
          return;
        }

        // 응답 텍스트 처리
        const responseText = json.message || "";
        if (responseText) {
          store.appendTextDelta(responseText);
        }

        // 문서 생성 결과 처리 (우측 패널)
        if (json.document) {
          const docType = json.document.type || "PI";
          const docData = json.document.data || {};
          const fullArgs = JSON.stringify({ document_type: docType, ...docData });

          store.startToolCall("generate_document");
          store.completeToolCall(fullArgs);
        }

        // 정상 완료
        store.completeStreaming();

        // 채팅 히스토리 DB 저장
        try {
          if (responseText) {
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
                content: responseText,
                is_doc_output: !!json.document,
              },
            ]);
          }
        } catch {
          // DB 저장 실패 무시
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          store.reset();
        } else {
          console.error("[useStreamingChat] catch:", err);
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
    toolCall: store.toolCall,
    rightPanelOpen: store.rightPanelOpen,
    rightPanelDocType: store.rightPanelDocType,
    error: store.error,
    closeRightPanel: store.closeRightPanel,
    toggleRightPanel: store.toggleRightPanel,
  };
}

// File → base64 변환 유틸
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64,... 형태 그대로 전달 (서버에서 cleanBase64 처리)
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
